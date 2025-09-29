// src/app/features/checkout/pages/checkout-page.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CheckoutService } from './services/checkout.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { CdnService } from 'src/app/core/services/cdn.service';
import {
  CheckoutProduct,
  CheckoutCalculationResponse,
  ValidationError
} from './models/checkout.model';

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './checkout-page.component.html',
  styleUrls: ['./checkout-page.component.css']
})
export class CheckoutPageComponent implements OnInit {
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private checkoutService = inject(CheckoutService);
  private authService = inject(AuthService);
  private cdnService = inject(CdnService);

  // Datos del producto (vienen por navigation state)
  product = signal<CheckoutProduct | null>(null);
  quantity = signal<number>(1);
  
  // Estados
  selectedDeliveryMethod = signal<string | null>(null);
  validating = signal(false);
  calculating = signal(false);
  validationErrors = signal<ValidationError[]>([]);
  totals = signal<CheckoutCalculationResponse | null>(null);

  // Formulario
  checkoutForm = this.fb.group({
    customer_name: ['', Validators.required],
    customer_email: [{ value: '', disabled: true }],
    customer_identification_type: ['DNI_ARG', Validators.required],
    customer_identification_number: ['', Validators.required],
    customer_phone: ['', Validators.required],
    delivery_address: ['', Validators.required],
    delivery_apartment: [''],
    delivery_postal_code: [''],
    delivery_city: ['', Validators.required],
    delivery_province: ['', Validators.required],
    delivery_notes: ['']
  });

  ngOnInit() {
    // Obtener datos del producto desde navigation state
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || history.state;
    
    if (state?.['product'] && state?.['quantity']) {
      this.product.set(state['product']);
      this.quantity.set(state['quantity']);
      
      console.log('✅ Datos recibidos:', {
        product: this.product(),
        quantity: this.quantity()
      });

      // Cargar email del usuario
      const userInfo = this.authService.getUserProfile();
      if (userInfo?.email) {
        this.checkoutForm.patchValue({ customer_email: userInfo.email });
      }

      // Validar y calcular inicialmente
      this.validateCheckout();
    } else {
      console.warn('⚠️ No hay datos de producto, redirigiendo');
      this.router.navigate(['/']);
    }
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
    this.router.navigate(['/']);
  }

  getMethodCost(cost: string): number {
    return parseFloat(cost) || 0;
  }

  parseFloat(value: string): number {
    return parseFloat(value) || 0;
  }

  getCdnUrl(imagePath?: string): string {
    if (!imagePath) return '';
    return this.cdnService.getCdnUrl(imagePath);
  }
}