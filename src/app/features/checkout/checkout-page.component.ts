// src/app/features/checkout/pages/checkout-page.component.ts
import { Component, OnInit, inject, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CheckoutService } from './services/checkout.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { CdnService } from 'src/app/core/services/cdn.service';
import { ListingService } from 'src/app/core/services/listing.service';
import { SeoService } from '../../core/services/seo.service';
import { I18nService } from '../../core/services/i18n.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatDividerModule } from '@angular/material/divider';
import {
  CheckoutProduct,
  CheckoutCalculationResponse,
  ValidationError
} from './models/checkout.model';

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    MatDividerModule
  ],
  templateUrl: './checkout-page.component.html',
  styleUrls: ['./checkout-page.component.css']
})
export class CheckoutPageComponent implements OnInit {
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private checkoutService = inject(CheckoutService);
  private authService = inject(AuthService);
  private cdnService = inject(CdnService);
  private listingService = inject(ListingService);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private seo = inject(SeoService);
  private i18n = inject(I18nService);


  // Datos del producto (vienen por navigation state)
  product = signal<CheckoutProduct | null>(null);
  quantity = signal<number>(1);
  
  // Estados
  selectedDeliveryMethod = signal<string | null>(null);
  validating = signal(false);
  calculating = signal(false);
  validationErrors = signal<ValidationError[]>([]);
  totals = signal<CheckoutCalculationResponse | null>(null);

  provinces = [
    'Buenos Aires',
    'Ciudad Autónoma de Buenos Aires',
    'Catamarca',
    'Chaco',
    'Chubut',
    'Córdoba',
    'Corrientes',
    'Entre Ríos',
    'Formosa',
    'Jujuy',
    'La Pampa',
    'La Rioja',
    'Mendoza',
    'Misiones',
    'Neuquén',
    'Río Negro',
    'Salta',
    'San Juan',
    'San Luis',
    'Santa Cruz',
    'Santa Fe',
    'Santiago del Estero',
    'Tierra del Fuego',
    'Tucumán'
  ];

  // Formulario
  checkoutForm = this.fb.group({
    customer_name: ['', [
      Validators.required, 
      Validators.minLength(3), 
      Validators.maxLength(100)
    ]],
    customer_email: [{ value: '', disabled: true }],
    customer_identification_type: ['DNI_ARG', Validators.required],
    customer_identification_number: ['', [
      Validators.required, 
      Validators.pattern(/^\d{7,11}$/)  // DNI/CUIL argentino: 7-11 dígitos
    ]],
    customer_phone: ['', [
      Validators.required, 
      Validators.pattern(/^[\d\s\+\-()]{10,20}$/)
    ]],
    delivery_address: ['', [Validators.required, Validators.minLength(5)]],
    delivery_apartment: [''],
    delivery_postal_code: ['', Validators.pattern(/^\d{4}$/)],  // CP argentino: 4 dígitos
    delivery_city: ['', Validators.required],
    delivery_province: ['', Validators.required],
    delivery_notes: ['', Validators.maxLength(500)]
  });

  ngOnInit() {
    if (!this.isBrowser) {
      return;
    }

    // Obtener datos del producto desde navigation state
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || (typeof history !== 'undefined' ? history.state : null);

    
    // ✅ Intentar primero desde navigation state
    if (state?.['product'] && state?.['quantity']) {
      this.loadProductData(state['product'], state['quantity']);
      // ✅ Guardar en sessionStorage para persistir en refresh
      this.saveCheckoutToSession(state['product'], state['quantity']);
    } 
    // ✅ Si no hay en state, intentar recuperar desde sessionStorage
    else {
      const savedCheckout = this.loadCheckoutFromSession();
      if (savedCheckout) {
        console.log('✅ Datos recuperados desde sessionStorage');
        this.loadProductData(savedCheckout.product, savedCheckout.quantity);
      } else {
        console.warn('⚠️ No hay datos de producto');
      }
    }
    this.setupSEO();
  }

  private loadProductData(product: CheckoutProduct, quantity: number) {
    this.product.set(product);
    this.quantity.set(quantity);
    
    console.log('✅ Datos cargados:', { product, quantity });

    // Cargar email del usuario
    const userInfo = this.authService.getUserProfile();
    if (userInfo?.email) {
      this.checkoutForm.patchValue({ customer_email: userInfo.email });
    }

    // Si hay un solo método de entrega, seleccionarlo automáticamente
    const methods = this.product()?.delivery_methods;
    if (methods && methods.length >= 1) {
      this.selectedDeliveryMethod.set(methods[0].id);      
    }

    // Validar y calcular inicialmente
    this.validateCheckout();
  }

  private saveCheckoutToSession(product: CheckoutProduct, quantity: number) {
    if (!this.isBrowser) return;
    try {
      sessionStorage.setItem('checkout_data', JSON.stringify({ product, quantity }));
    } catch (e) {
      console.error('Error guardando checkout en sessionStorage:', e);
    }
  }

  private loadCheckoutFromSession(): { product: CheckoutProduct; quantity: number } | null {
    if (!this.isBrowser) return null;
    try {
      const data = sessionStorage.getItem('checkout_data');
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('Error cargando checkout desde sessionStorage:', e);
      return null;
    }
  }

  private clearCheckoutFromSession() {
    if (!this.isBrowser) return;
    sessionStorage.removeItem('checkout_data');
  }

  validateCheckout() {
    const prod = this.product();
    if (!prod) return;

    this.validating.set(true);
    this.validationErrors.set([]);

    const request = {
      items: [{ listing_id: prod.id, quantity: this.quantity() }],
      seller_id: prod.advertiser_id || ''
    };

    this.checkoutService.validateCheckout(request).subscribe({
      next: (response) => {
        this.validating.set(false);
        if (!response.valid) {
          this.validationErrors.set(response.errors);
          console.error('❌ Validación fallida:', response.errors);
        } else {
          console.log('✅ Validación exitosa');
          // Si hay método seleccionado, calcular totales
          if (this.selectedDeliveryMethod()) {
            this.calculateTotals();
          }
        }
      },
      error: (err) => {
        this.validating.set(false);
        console.error('❌ Error validando:', err);
      }
    });
  }

  calculateTotals() {
    const prod = this.product();
    if (!prod || !this.selectedDeliveryMethod()) return;

    this.calculating.set(true);

    const request = {
      items: [{ listing_id: prod.id, quantity: this.quantity() }],
      seller_id: prod.advertiser_id || '',
      delivery_method_id: this.selectedDeliveryMethod()!
    };

    this.checkoutService.calculateTotals(request).subscribe({
      next: (response) => {
        this.calculating.set(false);
        this.totals.set(response);
        console.log('✅ Totales calculados:', response);
      },
      error: (err) => {
        this.calculating.set(false);
        console.error('❌ Error calculando totales:', err);
      }
    });
  }

  onDeliveryMethodChange(methodId: string) {
    console.log('📦 Método seleccionado:', methodId);
    this.selectedDeliveryMethod.set(methodId);
    this.calculateTotals();
  }

  updateQuantity(event: Event) {
    const input = event.target as HTMLInputElement;
    const newQty = parseInt(input.value);
    
    if (isNaN(newQty) || newQty < 1) {
      input.value = '1';
      this.quantity.set(1);
      return;
    }

    const max = this.product()?.max_quantity_per_order || 10;
    if (newQty > max) {
      input.value = String(max);
      this.quantity.set(max);
    } else {
      this.quantity.set(newQty);
    }

    // Revalidar y recalcular
    setTimeout(() => {
      this.validateCheckout();
    }, 300);
  }

  increaseQuantity() {
    const max = this.product()?.max_quantity_per_order || 10;
    if (this.quantity() < max) {
      this.quantity.update(q => q + 1);
      setTimeout(() => this.validateCheckout(), 300);
    }
  }

  decreaseQuantity() {
    if (this.quantity() > 1) {
      this.quantity.update(q => q - 1);
      setTimeout(() => this.validateCheckout(), 300);
    }
  }

  getMaxQuantity(): number {
    const prod = this.product();
    if (!prod) return 1;
    
    const maxPerOrder = prod.max_quantity_per_order || 999;
    const stock = prod.stock_quantity || 999;
    
    return Math.min(maxPerOrder, stock);
  }

  proceedToPayment() {
    if (!this.canProceed() || !this.checkoutForm.valid) {
      alert('⚠️ Por favor completa todos los campos requeridos');
      return;
    }

    const prod = this.product();
    if (!prod) return;

    const formData = this.checkoutForm.getRawValue();
    
    const orderData = {
      items: [{ listing_id: prod.id, quantity: this.quantity() }],
      delivery_method_id: this.selectedDeliveryMethod()!,
      ...formData
    };

    console.log('💳 Creando orden:', orderData);

    this.checkoutService.createOrder(orderData as any).subscribe({
      next: (response) => {
        console.log('✅ Orden creada:', response);

        // ✅ Limpiar sessionStorage al completar la orden
        this.clearCheckoutFromSession();

        // Redirigir a la pasarela de pago
        if (response.payment_url) {
          window.location.href = response.payment_url;
        } else {
          this.router.navigate(['/payment-result']);
        }
      },
      error: (err) => {
        console.error('❌ Error creando orden:', err);
        alert('❌ Error al crear la orden');
      }
    });
  }

  canProceed(): boolean {
    return (
      !this.validating() &&
      !this.calculating() &&
      this.validationErrors().length === 0 &&
      !!this.product() &&
      !!this.selectedDeliveryMethod()
    );
  }

  goBack() {    
    this.clearCheckoutFromSession();
    this.router.navigate(['/']);
  }

  getMethodCost(cost: string): number {
    return parseFloat(cost) || 0;
  }

  parseFloat(value: string): number {
    return parseFloat(value) || 0;
  }

  getformattedPrice(value: string): string {    
    return this.listingService.getformattedPrice(value);
  }  

  getCdnUrl(imagePath?: string): string {
    if (!imagePath) return '';
    return this.cdnService.getCdnUrl(imagePath);
  }

  private setupSEO(): void {    
    const communityName = this.i18n.t('COMMUNITY.NAME');     
    this.seo.setPageMeta(
      'PAGES.CHECKOUT.TITLE',
      'PAGES.CHECKOUT.DESCRIPTION',
      { communityName }
    );
  }
}