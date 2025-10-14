import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ValidatorFn, AbstractControl, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
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
import { CdnService } from '../../core/services/cdn.service';
import { BreadcrumbComponent, BreadcrumbItem } from '../../shared/components/breadcrumb/breadcrumb.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { ImageUploaderComponent } from './components/image-uploader/image-uploader.component';
import { Category } from '../../core/models/category.model';
import { ListingImage } from '../../core/models/listing.model';
import { ListingDetail } from '../../core/models/listing.model';

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
  selector: 'app-edit-listing-page',
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
  templateUrl: './edit-listing-page.component.html',
  styleUrls: ['./edit-listing-page.component.css']
})
export class EditListingPageComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private listingService = inject(ListingService);
  private categoryService = inject(CategoryService);
  private cdnService = inject(CdnService);
  private snackBar = inject(MatSnackBar);
  private seo = inject(SeoService);
  private i18n = inject(I18nService);
  
  private destroy$ = new Subject<void>();

  listingForm!: FormGroup;
  categories: CategoryWithDisplay[] = [];
  breadcrumbItems: BreadcrumbItem[] = [];
  isSubmitting = signal(false);
  isLoading = signal(true);
  
  listingId: string = '';
  currentListing: ListingDetail | null = null;
  tempImageIds: string[] = [];
  deleteImageIds: string[] = [];
  existingImages: any[] = [];

  listingTypes = [
    { value: 'product', label: 'Producto' },
    { value: 'service', label: 'Servicio' }
  ];

  deliveryMethods: DeliveryMethod[] = [];
  defaultPickupMethodId: string = '';

  ngOnInit(): void {
    this.listingId = this.route.snapshot.paramMap.get('id') || '';
    this.buildBreadcrumbs();
    this.initForm();
    this.loadCategories();
    this.loadDeliveryMethods();
    this.loadListing();
        
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
      list_price: [null, [this.listPriceGreaterThan('price')]],
      stock_quantity: [0, [Validators.min(0), Validators.max(10000)]],
      max_quantity_per_order: [1, [Validators.required, Validators.min(1), Validators.max(10000)]],
      category_id: ['', Validators.required],
      delivery_method_ids: [[]],
      is_active: [false],
      is_featured: [false]
    });
  }

  public listPriceGreaterThan(priceCtrlName: string): ValidatorFn {
    return (ctrl: AbstractControl) => {
      if (!ctrl.parent) return null;
      const priceCtrl = ctrl.parent.get(priceCtrlName);
      if (!priceCtrl) return null;
      const price = +priceCtrl.value || 0;
      const list  = (ctrl.value === null || ctrl.value === '') ? null : +ctrl.value;
      if (list === null || Number.isNaN(list)) return null;
      return list > price ? null : { listPriceNotGreater: true };
    };
  }

  get showDiscount(): boolean {
    const price = this.listingForm.get('price')?.value;
    const listPrice = this.listingForm.get('list_price')?.value;
    return listPrice && price && parseFloat(listPrice) > parseFloat(price);
  }

  get discountAmount(): number {
    const price = parseFloat(this.listingForm.get('price')?.value || '0');
    const listPrice = parseFloat(this.listingForm.get('list_price')?.value || '0');
    return listPrice - price;
  }

  get discountPercentage(): number {
    const price = parseFloat(this.listingForm.get('price')?.value || '0');
    const listPrice = parseFloat(this.listingForm.get('list_price')?.value || '0');
    if (listPrice === 0) return 0;
    return Math.round(((listPrice - price) / listPrice) * 100);
  }

  formatPrice(amount: string | number): string {
    return this.listingService.getformattedPrice(amount);
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

  private loadListing(): void {
    this.listingService.getListingById(this.listingId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (listing: any) => {
          this.currentListing = listing;
          this.populateForm(listing);
          this.setupExistingImages(listing.images);
          this.isLoading.set(false);
          this.setupSEO();
        },
        error: (error) => {
          console.error('Error loading listing:', error);
          this.snackBar.open('Error al cargar el artículo', 'Cerrar', {
            duration: 4000
          });
          this.router.navigate(['/mi-cuenta/mis-articulos']);
        }
      });
  }

  private populateForm(listing: ListingDetail): void {
    this.listingForm.patchValue({
      type: listing.type,
      title: listing.title,
      short_description: listing.short_description,
      long_description: listing.long_description,
      price: listing.price,
      list_price: listing.list_price || '',
      stock_quantity: listing.stock_quantity,
      max_quantity_per_order: listing.max_quantity_per_order,
      category_id: listing.category_id,
      is_active: listing.is_active || false,
      is_featured: listing.is_featured || false
    });

    // Set delivery methods
    if (listing.delivery_methods) {
      const enabledMethods = listing.delivery_methods.map(dm => dm.id);
      this.deliveryMethods.forEach(method => {
        method.enabled = enabledMethods.includes(method.id);
      });
      this.listingForm.patchValue({ delivery_method_ids: enabledMethods });
    }
  }

  private setupExistingImages(images: ListingImage[]): void {
    if (!images || images.length === 0) return;

    this.existingImages = images
      .sort((a, b) => {
        if (a.is_primary && !b.is_primary) return -1;
        if (!a.is_primary && b.is_primary) return 1;
        return a.sort_order - b.sort_order;
      })
      .map(img => ({
        id: img.id,
        preview: this.cdnService.getCdnUrl(img.image_url),
        uploading: false,
        progress: 100,
        tempId: null
      }));
  }

  private buildBreadcrumbs(): void {
    this.breadcrumbItems = [
      { label: this.i18n.t('COMMON.HOME'), url: '/' },
      { label: this.i18n.t('COMMON.MY_ACCOUNT'), url: '/mi-cuenta' },
      { label: this.i18n.t('COMMON.MY_LISTINGS'), url: '/mi-cuenta/mis-articulos' },
      { label: 'Editar artículo', url: '' }
    ];
  }

  private setupSEO(): void {    
    const communityName = this.i18n.t('COMMUNITY.NAME');
    const listingTitle = this.currentListing?.title || '';
    this.seo.setPageMeta(
      'PAGES.EDIT_LISTING.TITLE',
      'PAGES.EDIT_LISTING.DESCRIPTION', 
      { listingTitle, communityName }
    );
  }

  onImagesChanged(data: { tempIds: string[], existingIds: string[], deletedIds: string[] }): void {
    this.tempImageIds = data.tempIds;
    this.deleteImageIds = data.deletedIds;
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

    const totalImages = this.existingImages.length - this.deleteImageIds.length + this.tempImageIds.length;
    if (totalImages === 0) {
      this.snackBar.open('Debes tener al menos una imagen', 'Cerrar', {
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
      list_price: formValue.list_price ? parseFloat(formValue.list_price) : undefined,
      stock_quantity: isProduct ? parseInt(formValue.stock_quantity) : 0,
      max_quantity_per_order: parseInt(formValue.max_quantity_per_order),
      category_id: formValue.category_id,      
      delivery_method_ids: isProduct ? formValue.delivery_method_ids : [this.defaultPickupMethodId],
      is_active: formValue.is_active === true,
      is_featured: formValue.is_featured === true,
      temp_image_ids: this.tempImageIds,
      delete_image_ids: this.deleteImageIds
    };

    this.listingService.updateListing(this.listingId, payload)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.snackBar.open('Artículo actualizado exitosamente', 'Cerrar', {
            duration: 3000
          });
          this.router.navigate(['/mi-cuenta/mis-articulos']);
        },
        error: (error) => {
          console.error('Error al actualizar artículo:', error);
          this.isSubmitting.set(false);
          this.snackBar.open(
            error.error?.message || 'Error al actualizar el artículo',
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