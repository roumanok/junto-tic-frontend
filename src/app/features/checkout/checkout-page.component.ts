import { Component, OnInit, inject, signal, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { CommunityService } from 'src/app/core/services/community.service';
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
import { ErrorStateComponent } from 'src/app/shared/components/error-state/error-state.component';
import { CheckoutProduct, CheckoutCalculationResponse, ValidationError } from './models/checkout.model';

@Component({
  selector: 'app-checkout-page',
  standalone: true,
  imports: [
    CommonModule, 
    ErrorStateComponent,    
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
  private readonly community = inject(CommunityService);
  private checkoutService = inject(CheckoutService);
  private authService = inject(AuthService);
  private cdnService = inject(CdnService);
  private listingService = inject(ListingService);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private seo = inject(SeoService);
  private i18n = inject(I18nService);

  product = signal<CheckoutProduct | null>(null);
  quantity = signal<number>(1);
  
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

  private readonly FIELD_VALIDATORS = {
    name: [
      Validators.required,
      Validators.minLength(3),
      Validators.maxLength(100)
    ],
    phone_area_code: [
      Validators.required,
      Validators.pattern(/^\d{2,4}$/)
    ],
    phone_number: [
      Validators.required,
      Validators.pattern(/^\d{6,8}$/)
    ],
    address: [
      Validators.required,
      Validators.minLength(5)
    ],
    postal_code: [
      Validators.required,
      Validators.pattern(/^\d{4}$/)
    ],
    city: [Validators.required],
    province: [Validators.required],
    identification_type: [Validators.required],
    identification_number: [
      Validators.required,
      Validators.pattern(/^\d{7,11}$/)
    ],
    notes: [Validators.maxLength(500)]
  };

  private readonly BILLING_FIELDS = [
    'billing_name',
    'billing_phone_area_code',
    'billing_phone_number',
    'billing_address',
    'billing_apartment',
    'billing_postal_code',
    'billing_city',
    'billing_province'
  ];

  private readonly DELIVERY_FIELDS = [
    'delivery_name',
    'delivery_phone_area_code',
    'delivery_phone_number',
    'delivery_address',
    'delivery_apartment',
    'delivery_postal_code',
    'delivery_city',
    'delivery_province'
  ];

  checkoutForm = this.fb.group({    
    customer_identification_type: ['DNI_ARG', this.FIELD_VALIDATORS.identification_type],
    customer_identification_number: ['', this.FIELD_VALIDATORS.identification_number],
    customer_email: [{ value: '', disabled: true }],        
    billing_name: ['', this.FIELD_VALIDATORS.name],
    billing_phone_area_code: ['', this.FIELD_VALIDATORS.phone_area_code],
    billing_phone_number: ['', this.FIELD_VALIDATORS.phone_number],
    billing_address: ['', this.FIELD_VALIDATORS.address],
    billing_apartment: [''],
    billing_postal_code: ['', this.FIELD_VALIDATORS.postal_code],
    billing_city: ['', this.FIELD_VALIDATORS.city],
    billing_province: ['', this.FIELD_VALIDATORS.province],
    delivery_name: ['', this.FIELD_VALIDATORS.name],
    delivery_phone_area_code: ['', this.FIELD_VALIDATORS.phone_area_code],
    delivery_phone_number: ['', this.FIELD_VALIDATORS.phone_number],
    delivery_address: ['', this.FIELD_VALIDATORS.address],
    delivery_apartment: [''],
    delivery_postal_code: ['', this.FIELD_VALIDATORS.postal_code],
    delivery_city: ['', this.FIELD_VALIDATORS.city],
    delivery_province: ['', this.FIELD_VALIDATORS.province],
    delivery_notes: ['', this.FIELD_VALIDATORS.notes]
  });

  ngOnInit() {
    if (!this.isBrowser) {
      return;
    }

    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state || (typeof history !== 'undefined' ? history.state : null);

    
    if (state?.['product'] && state?.['quantity']) {
      this.loadProductData(state['product'], state['quantity']);
      this.saveCheckoutToSession(state['product'], state['quantity']);
    } 
    else {
      const savedCheckout = this.loadCheckoutFromSession();
      if (savedCheckout) {
        console.log('Datos recuperados desde sessionStorage');
        this.loadProductData(savedCheckout.product, savedCheckout.quantity);
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
        
        const thirtyMinutes = 30 * 60 * 1000;
        if (Date.now() - saved.timestamp < thirtyMinutes) {
          console.log('Restaurando checkout pendiente');
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
    
  private setFieldsValidators(fields: string[], shouldSetValidators: boolean) {
    fields.forEach(field => {
      const control = this.checkoutForm.get(field);
      if (!control) return;

      if (shouldSetValidators) {
        const fieldType = this.getFieldType(field);
        const validators = this.FIELD_VALIDATORS[fieldType as keyof typeof this.FIELD_VALIDATORS];
        
        if (validators) {
          control.setValidators(validators);
        }
      } else {
        control.clearValidators();
      }
      
      control.updateValueAndValidity();
    });
  }

  private getFieldType(fieldName: string): string {
    if (fieldName.includes('_name')) return 'name';
    if (fieldName.includes('_phone_area_code')) return 'phone_area_code';
    if (fieldName.includes('_phone_number')) return 'phone_number';
    if (fieldName.includes('_address') && !fieldName.includes('apartment')) return 'address';
    if (fieldName.includes('_postal_code')) return 'postal_code';
    if (fieldName.includes('_city')) return 'city';
    if (fieldName.includes('_province')) return 'province';
    if (fieldName.includes('_notes')) return 'notes';
    return '';
  }

  private updateValidatorsForPickup() {
    this.setFieldsValidators(this.DELIVERY_FIELDS, false);
  }

  private updateValidatorsForDelivery() {
    this.setFieldsValidators(this.DELIVERY_FIELDS, true);
  }

  private removeBillingValidators() {
    this.setFieldsValidators(this.BILLING_FIELDS, false);
  }

  private restoreBillingValidators() {
    this.setFieldsValidators(this.BILLING_FIELDS, true);
  }  

  toggleSameAsDelivery(checked: boolean) {
    this.sameAsDelivery.set(checked);
    
    if (checked) {
      this.copyDeliveryToBilling();
      this.removeBillingValidators();
    } else {
      this.clearBillingFields();
      this.restoreBillingValidators();
    }
  }
  
  private copyDeliveryToBilling() {
    const form = this.checkoutForm;
    const mapping: { [key: string]: string } = {
      'billing_name': 'delivery_name',
      'billing_phone_area_code': 'delivery_phone_area_code',
      'billing_phone_number': 'delivery_phone_number',
      'billing_address': 'delivery_address',
      'billing_apartment': 'delivery_apartment',
      'billing_postal_code': 'delivery_postal_code',
      'billing_city': 'delivery_city',
      'billing_province': 'delivery_province'
    };

    const values: any = {};
    Object.entries(mapping).forEach(([billing, delivery]) => {
      values[billing] = form.get(delivery)?.value;
    });

    form.patchValue(values);
  }
  
  private clearBillingFields() {
    const values: any = {};
    this.BILLING_FIELDS.forEach(field => {
      values[field] = '';
    });
    this.checkoutForm.patchValue(values);
  }

  private clearDeliveryFields() {    
    const values: any = {};
    this.DELIVERY_FIELDS.forEach(field => {
      values[field] = '';
    });
    this.checkoutForm.patchValue(values);
  }

  private loadProductData(product: CheckoutProduct, quantity: number) {
    this.product.set(product);
    this.quantity.set(quantity);
    
    console.log('Datos cargados:', { product, quantity });

    const userInfo = this.authService.getUserProfile();
    if (userInfo?.email) {
      this.checkoutForm.patchValue({ customer_email: userInfo.email });
    }

    const methods = this.product()?.delivery_methods;
    if (methods && methods.length >= 1) {
      this.selectedDeliveryMethod.set(methods[0].id);      
    }

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
          console.error('Validación fallida:', response.errors);
        } else {
          if (this.selectedDeliveryMethod()) {
            this.calculateTotals();
          }
        }
      },
      error: (err) => {
        this.validating.set(false);
        console.error('Error validando:', err);
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
      },
      error: (err) => {
        this.calculating.set(false);
        console.error('Error calculando totales:', err);
      }
    });
  }

  onDeliveryMethodChange(methodId: string) {
    this.selectedDeliveryMethod.set(methodId);
    this.checkIfPickup();
    this.calculateTotals();
  }

  private checkIfPickup() {
    const methods = this.product()?.delivery_methods;
    const selectedMethod = methods?.find(m => m.id === this.selectedDeliveryMethod());
    
    const isPickup = selectedMethod?.type === 'pickup';
    this.isPickupMethod.set(isPickup);
        
    if (isPickup) {
      this.clearDeliveryFields();
      this.updateValidatorsForPickup();
    } else {
      this.updateValidatorsForDelivery();
    }
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
    console.log('Usuario no autenticado, redirigiendo a login-required');
    
    if (this.isBrowser) {
      sessionStorage.setItem('pendingCheckout', JSON.stringify({
        product: this.product(),
        quantity: this.quantity(),
        formData: this.checkoutForm.getRawValue(),
        selectedMethod: this.selectedDeliveryMethod(),
        timestamp: Date.now()
      }));
    }
    
    this.router.navigate(['/login-required'], {
      queryParams: { returnUrl: '/checkout' }
    });
  }

  proceedToPayment() {
    if (!this.canProceed() || !this.formValid()) {
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
      community_id: this.community.communityId,
      ...formData
    };    

    console.log('Creando orden:', orderData);

    this.checkoutService.createOrder(orderData as any).subscribe({
      next: (response) => {
        console.log('Orden creada:', response);

        this.clearCheckoutFromSession();
        if (this.isBrowser) {
          sessionStorage.removeItem('pendingCheckout');
        }

        if (response.payment_url) {
          window.location.href = response.payment_url;
        } else {
          this.router.navigate(['/mi-cuenta/mis-compras']);
        }
      },
      error: (err) => {
        console.error('Error creando orden:', err);
        alert('Error al crear la orden');
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