import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { ListingService } from '../../core/services/listing.service';
import { CategoryService } from '../../core/services/category.service';
import { SeoService } from '../../core/services/seo.service';
import { I18nService } from '../../core/services/i18n.service';
import { BreadcrumbComponent, BreadcrumbItem } from '../../shared/components/breadcrumb/breadcrumb.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { ImageUploaderComponent } from './components/image-uploader/image-uploader.component';
import { Category } from '../../core/models/category.model';

interface DeliveryMethod {
  id: string;
  type: string;
  name: string;
  description?: string;
  cost?: string;
  address?: string;
  enabled: boolean;
}

interface CategoryWithDisplay extends Category {
  displayName?: string;
}

@Component({
  selector: 'app-create-listing-page',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCheckboxModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    MatIconModule,
    MatButtonToggleModule,
    BreadcrumbComponent,
    TranslatePipe,
    ImageUploaderComponent
  ],
  templateUrl: './create-listing-page.component.html',
  styleUrls: ['./create-listing-page.component.css']
})
export class CreateListingPageComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private listingService = inject(ListingService);
  private categoryService = inject(CategoryService);
  private snackBar = inject(MatSnackBar);
  private seo = inject(SeoService);
  private i18n = inject(I18nService);
  
  private destroy$ = new Subject<void>();

  listingForm!: FormGroup;
  categories: CategoryWithDisplay[] = [];
  breadcrumbItems: BreadcrumbItem[] = [];
  isSubmitting = signal(false);
  tempImageIds: string[] = [];

  listingTypes = [
    { value: 'product', label: 'Producto' },
    { value: 'service', label: 'Servicio' }
  ];
  
  deliveryMethods: DeliveryMethod[] = [];
  defaultPickupMethodId: string = '';

  ngOnInit(): void {
    this.buildBreadcrumbs();    
    this.initForm();    
    this.setupSEO();
    this.loadCategories();
    this.loadDeliveryMethods();
    
    this.listingForm.get('type')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(type => {
        if (type === 'service') {
          this.deliveryMethods.forEach(m => m.enabled = false);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initForm(): void {
    this.listingForm = this.fb.group({
      type: ['product', Validators.required],
      title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
      short_description: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(200)]],
      long_description: ['', [Validators.required, Validators.minLength(20)]],
      price: ['', [Validators.required, Validators.min(0.01)]],
      list_price: [''],
      stock_quantity: [0, [Validators.min(0), Validators.max(10000)]],
      max_quantity_per_order: [1, [Validators.required, Validators.min(1), Validators.max(10000)]],
      category_id: ['', Validators.required],
      delivery_method_ids: [[]],
      is_active: [false],
      is_featured: [false]
    }, { validators: this.priceValidator });
  }

  private priceValidator(group: FormGroup): { [key: string]: boolean } | null {
    const price = group.get('price')?.value;
    const listPrice = group.get('list_price')?.value;
    
    if (listPrice && price && parseFloat(listPrice) < parseFloat(price)) {
      return { invalidListPrice: true };
    }
    
    return null;
  }

  get priceError(): boolean {
    return this.listingForm.hasError('invalidListPrice') && 
           this.listingForm.get('list_price')?.touched === true;
  }

  private loadCategories(): void {
    this.categoryService.all$
      .pipe(takeUntil(this.destroy$))
      .subscribe(categories => {
        const childCategories = categories.filter(cat => cat.parent_id);
        this.categories = childCategories.map(child => {
          const parent = categories.find(cat => cat.id === child.parent_id);
          return {
            ...child,
            displayName: parent ? `${parent.name} → ${child.name}` : child.name
          };
        });
      });
  }

  private loadDeliveryMethods(): void {
    this.listingService.getMyDeliveryMethods()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (methods) => {
          this.deliveryMethods = methods.map(method => ({
            ...method,
            enabled: false
          }));
          const pickupMethod = this.deliveryMethods.find(m => m.type === 'pickup');
          if (pickupMethod) {
            this.defaultPickupMethodId = pickupMethod.id;
          }
        },
        error: (error) => {
          console.error('Error loading delivery methods:', error);
          this.snackBar.open('Error al cargar métodos de entrega', 'Cerrar', {
            duration: 3000
          });
        }
      });
  }  

  private buildBreadcrumbs(): void {
    this.breadcrumbItems = [
      { label: this.i18n.t('COMMON.HOME'), url: '/' },
      { label: this.i18n.t('COMMON.MY_ACCOUNT'), url: '/mi-cuenta' },
      { label: this.i18n.t('COMMON.MY_LISTINGS'), url: '/mi-cuenta/mis-articulos' },
      { label: 'Crear artículo', url: '' }
    ];
  }

  private setupSEO(): void {    
    const communityName = this.i18n.t('COMMUNITY.NAME');    
    this.seo.setPageMeta(
      'PAGES.CREATE_LISTING.TITLE',
      'PAGES.CREATE_LISTING.DESCRIPTION', 
      { communityName }
    );
  }

  onImagesChanged(tempIds: string[]): void {
    this.tempImageIds = tempIds;
  }

  toggleDeliveryMethod(method: DeliveryMethod): void {
    if (this.listingForm.get('type')?.value === 'service') {
      return;
    }
    method.enabled = !method.enabled;
    this.updateDeliveryMethodIds();
  }

  private updateDeliveryMethodIds(): void {
    const enabledIds = this.deliveryMethods
      .filter(m => m.enabled)
      .map(m => m.id);
    this.listingForm.patchValue({ delivery_method_ids: enabledIds });
  }

  async onSubmit(): Promise<void> {
    if (this.listingForm.invalid) {
      this.markFormGroupTouched(this.listingForm);
      this.snackBar.open('Por favor completa todos los campos requeridos', 'Cerrar', {
        duration: 4000
      });
      return;
    }

    const formValue = this.listingForm.value;
    const isProduct = formValue.type === 'product';

    if (isProduct && formValue.delivery_method_ids.length === 0) {
      this.snackBar.open('Debes seleccionar al menos un método de entrega para productos', 'Cerrar', {
        duration: 4000
      });
      return;
    }

    if (this.tempImageIds.length === 0) {
      this.snackBar.open('Debes subir al menos una imagen', 'Cerrar', {
        duration: 4000
      });
      return;
    }

    this.isSubmitting.set(true);

    const payload = {
      type: formValue.type,
      title: formValue.title,
      short_description: formValue.short_description,
      long_description: formValue.long_description,
      price: parseFloat(formValue.price),
      list_price: formValue.list_price ? parseFloat(formValue.list_price) : null,
      stock_quantity: isProduct ? parseInt(formValue.stock_quantity) : 0,
      max_quantity_per_order: parseInt(formValue.max_quantity_per_order),
      category_id: formValue.category_id,      
      delivery_method_ids: isProduct ? formValue.delivery_method_ids : [this.defaultPickupMethodId],
      is_active: false,
      is_featured: false,
      temp_image_ids: this.tempImageIds,
      delete_image_ids: []
    };

    this.listingService.createListing(payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('Artículo creado exitosamente', 'Cerrar', {
            duration: 3000
          });
          this.router.navigate(['/mi-cuenta/mis-articulos']);
        },
        error: (error) => {
          console.error('Error al crear artículo:', error);
          this.isSubmitting.set(false);
          this.snackBar.open(
            error.error?.message || 'Error al crear el artículo',
            'Cerrar',
            { duration: 4000 }
          );
        }
      });
  }

  cancel(): void {
    this.router.navigate(['/mi-cuenta/mis-articulos']);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }

  get isProduct(): boolean {
    return this.listingForm.get('type')?.value === 'product';
  }
}