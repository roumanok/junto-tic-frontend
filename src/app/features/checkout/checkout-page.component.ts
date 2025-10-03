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
import { TranslatePipe } from 'src/app/shared/pipes/translate.pipe';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
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
    TranslatePipe,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    MatDividerModule,
    MatCheckboxModule
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
  sameAsDelivery = signal(true);
  isPickupMethod = signal(false);
  formValid = signal(false);

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
    customer_email: [{ value: '', disabled: true }],
    customer_identification_type: ['DNI_ARG', Validators.required],
    customer_identification_number: ['', [
      Validators.required, 
      Validators.pattern(/^\d{7,11}$/)  // DNI/CUIL argentino: 7-11 dígitos
    ]],
    billing_name: ['', [
      Validators.required, 
      Validators.minLength(3), 
      Validators.maxLength(100)
    ]],
    billing_phone_area_code: ['', [
      Validators.required,
      Validators.pattern(/^\d{2,4}$/)  // 2-4 dígitos para código de área
    ]],
    billing_phone_number: ['', [
      Validators.required,
      Validators.pattern(/^\d{6,8}$/)  // 6-8 dígitos para número
    ]],
    billing_address: ['', [Validators.required, Validators.minLength(5)]],
    billing_apartment: [''],
    billing_postal_code: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],  // CP argentino: 4 dígitos
    billing_city: ['', Validators.required],
    billing_province: ['', Validators.required],
    delivery_name: ['', [
      Validators.required, 
      Validators.minLength(3), 
      Validators.maxLength(100)
    ]],
    delivery_phone_area_code: ['', [
      Validators.required,
      Validators.pattern(/^\d{2,4}$/)
    ]],
    delivery_phone_number: ['', [
      Validators.required,
      Validators.pattern(/^\d{6,8}$/)
    ]],
    delivery_address: ['', [Validators.required, Validators.minLength(5)]],
    delivery_apartment: [''],
    delivery_postal_code: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]],  // CP argentino: 4 dígitos
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

    if (this.selectedDeliveryMethod()) {
      this.checkIfPickup();
    }

    if (this.sameAsDelivery()) {
      this.removeBillingValidators();
    }
    
    this.checkoutForm.statusChanges.subscribe(status => {
      this.formValid.set(status === 'VALID');
    });

    const pendingCheckout = sessionStorage.getItem('pendingCheckout');
    if (pendingCheckout && this.authService.isAuthenticated()) {
      try {
        const saved = JSON.parse(pendingCheckout);
        
        // Verificar que no haya expirado (30 minutos)
        const thirtyMinutes = 30 * 60 * 1000;
        if (Date.now() - saved.timestamp < thirtyMinutes) {
          console.log('✅ Restaurando checkout pendiente');
          this.loadProductData(saved.product, saved.quantity);
          this.selectedDeliveryMethod.set(saved.selectedMethod);
          this.checkoutForm.patchValue(saved.formData);
          sessionStorage.removeItem('pendingCheckout');
        }
      } catch (e) {
        console.error('Error restaurando checkout:', e);
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
    this.checkIfPickup();
    this.calculateTotals();
  }

  /**
   * Verifica si el método seleccionado es pickup
  */
  private checkIfPickup() {
    const methods = this.product()?.delivery_methods;
    const selectedMethod = methods?.find(m => m.id === this.selectedDeliveryMethod());
    
    const isPickup = selectedMethod?.type === 'pickup';
    this.isPickupMethod.set(isPickup);
    
    console.log('🚚 Método es pickup?', isPickup);
    
    if (isPickup) {
      this.updateValidatorsForPickup();
    } else {
      this.updateValidatorsForDelivery();
    }
  }

  private removeBillingValidators() {
    const billingFields = [
      'billing_name', 'billing_phone', 'billing_address',
      'billing_city', 'billing_province', 'billing_postal_code'
    ];
    
    billingFields.forEach(field => {
      const control = this.checkoutForm.get(field);
      control?.clearValidators();
      control?.updateValueAndValidity();
    });
  }

  private restoreBillingValidators(){
    this.checkoutForm.get('billing_name')?.setValidators([
      Validators.required, 
      Validators.minLength(3), 
      Validators.maxLength(100)
    ]);
    this.checkoutForm.get('billing_phone_area_code')?.setValidators([
      Validators.required,
      Validators.pattern(/^\d{2,4}$/)
    ]);
    this.checkoutForm.get('billing_phone_number')?.setValidators([
      Validators.required,
      Validators.pattern(/^\d{6,8}$/)
    ]);
    this.checkoutForm.get('billing_address')?.setValidators([
      Validators.required, 
      Validators.minLength(5)
    ]);
    this.checkoutForm.get('billing_city')?.setValidators(Validators.required);
    this.checkoutForm.get('billing_province')?.setValidators(Validators.required);
    this.checkoutForm.get('billing_postal_code')?.setValidators([
      Validators.required, 
      Validators.pattern(/^\d{4}$/)
    ]);
    
    // Actualizar validez de todos
    ['billing_name', 'billing_phone_area_code', 'billing_phone_number', 'billing_address', 'billing_city', 
    'billing_province', 'billing_postal_code'].forEach(field => {
      this.checkoutForm.get(field)?.updateValueAndValidity();
    });
  }

  toggleSameAsDelivery(checked: boolean) {
    this.sameAsDelivery.set(checked);
    
    if (checked) {
      // Copiar datos
      this.copyDeliveryToBilling();
      this.removeBillingValidators();      
    } else {
      // Limpiar campos
      this.clearBillingFields();      
      this.restoreBillingValidators();
    }
  }

  private copyDeliveryToBilling() {
    const form = this.checkoutForm;
    form.patchValue({
      billing_name: form.get('delivery_name')?.value,
      billing_phone_area_code: form.get('delivery_phone_area_code')?.value,
      billing_phone_number: form.get('delivery_phone_number')?.value,
      billing_address: form.get('delivery_address')?.value,
      billing_apartment: form.get('delivery_apartment')?.value,
      billing_postal_code: form.get('delivery_postal_code')?.value,
      billing_city: form.get('delivery_city')?.value,
      billing_province: form.get('delivery_province')?.value
    });
  }

  private clearBillingFields() {
    this.checkoutForm.patchValue({
      billing_name: '',
      billing_phone_area_code: '',
      billing_phone_number: '',
      billing_address: '',
      billing_apartment: '',
      billing_postal_code: '',
      billing_city: '',
      billing_province: ''
    });
  }

  private updateValidatorsForPickup() {
    const deliveryFields = [
      'delivery_name', 'delivery_phone_area_code', 'delivery_phone_number', 'delivery_address',
      'delivery_city', 'delivery_province', 'delivery_postal_code'
    ];
    
    deliveryFields.forEach(field => {
      const control = this.checkoutForm.get(field);
      control?.clearValidators();
      control?.updateValueAndValidity();
    });
  }

  private updateValidatorsForDelivery() {    
    this.checkoutForm.get('delivery_name')?.setValidators([
      Validators.required, 
      Validators.minLength(3), 
      Validators.maxLength(100)
    ]);
    this.checkoutForm.get('delivery_phone_area_code')?.setValidators([
      Validators.required,
      Validators.pattern(/^\d{2,4}$/)
    ]);
    this.checkoutForm.get('delivery_phone_number')?.setValidators([
      Validators.required,
      Validators.pattern(/^\d{6,8}$/)
    ]);
    this.checkoutForm.get('delivery_address')?.setValidators([
      Validators.required, 
      Validators.minLength(5)
    ]);
    this.checkoutForm.get('delivery_city')?.setValidators(Validators.required);
    this.checkoutForm.get('delivery_province')?.setValidators(Validators.required);
    this.checkoutForm.get('delivery_postal_code')?.setValidators([
      Validators.required, 
      Validators.pattern(/^\d{4}$/)
    ]);
    
    // Actualizar validez
    ['delivery_name', 'delivery_phone_area_code', 'delivery_phone_number', 'delivery_address', 'delivery_city', 'delivery_province', 'delivery_postal_code']
      .forEach(field => this.checkoutForm.get(field)?.updateValueAndValidity());
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

  redirectToLogin(): void{
    console.log('🔒 Usuario no autenticado, redirigiendo a login-required');
    
    // Guardar el estado actual del checkout en sessionStorage
    if (this.isBrowser) {
      sessionStorage.setItem('pendingCheckout', JSON.stringify({
        product: this.product(),
        quantity: this.quantity(),
        formData: this.checkoutForm.getRawValue(),
        selectedMethod: this.selectedDeliveryMethod(),
        timestamp: Date.now()
      }));
    }
    
    // Redirigir a login-required
    this.router.navigate(['/login-required'], {
      queryParams: { returnUrl: '/checkout' }
    });
  }

  proceedToPayment() {
    if (!this.canProceed() || !this.formValid()) {
      alert('⚠️ Por favor completa todos los campos requeridos');
      return;
    }

    if (!this.authService.isAuthenticated()) {
      this.redirectToLogin();
      return;
    }


    const prod = this.product();
    if (!prod) return;

    if (this.sameAsDelivery() && !this.isPickupMethod()) {
      this.copyDeliveryToBilling();
    }

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
        if (this.isBrowser) {
          sessionStorage.removeItem('pendingCheckout');
        }

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