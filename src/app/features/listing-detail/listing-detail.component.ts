// src/app/features/listing-detail/listing-detail.component.ts
import { Component, OnInit, OnDestroy, Inject, inject, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { Subject, of } from 'rxjs';
import { takeUntil, catchError, switchMap, filter } from 'rxjs/operators';

import { ListingDetailService, ListingDetail } from './services/listing-detail.service';
import { CategoryService } from '../../core/services/category.service';
import { ListingService } from '../../core/services/listing.service';
import { Listing } from '../../core/models/listing.model';
import { SeoService } from '../../core/services/seo.service';
import { I18nService } from '../../core/services/i18n.service';

import { BreadcrumbComponent, BreadcrumbItem } from '../../shared/components/breadcrumb/breadcrumb.component';
import { ImageGalleryComponent } from '../../shared/components/image-gallery/image-gallery.component';
import { ListingCardComponent } from '../../shared/components/listing-card/listing-card.component';
import { CarouselComponent } from '../../shared/components/carousel/carousel.component';

import { TranslatePipe } from 'src/app/shared/pipes/translate.pipe';

@Component({
  selector: 'app-listing-detail',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
    FormsModule,
    BreadcrumbComponent,
    ImageGalleryComponent,
    ListingCardComponent,
    CarouselComponent
  ],
  templateUrl: './listing-detail.component.html',
  styleUrls: ['./listing-detail.component.scss']
})
export class ListingDetailComponent implements OnInit, OnDestroy {
  listing: ListingDetail | null = null;
  relatedListings: Listing[] = [];
  breadcrumbItems: BreadcrumbItem[] = [];
  loading = true;
  error: string | null = null;
  quantity = 1;
  
  private destroy$ = new Subject<void>();
  private isBrowser: boolean;
  private seo = inject(SeoService);
  private i18n = inject(I18nService);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private listingDetailService: ListingDetailService,
    private listingService: ListingService,    
    private categoryService: CategoryService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    if (!this.isBrowser) {
      return;
    }    

    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.scrollToTop();
    });

    this.route.params.pipe(
      takeUntil(this.destroy$),
      switchMap(params => {
        const slug = params['slug'];
        if (!slug) {
          throw new Error('No se encontró el slug del listing');
        }
        
        // Por ahora, extraer ID del slug o usar el slug como ID
        // En un futuro podrías tener un endpoint que resuelva slug -> ID
        const listingId = this.extractIdFromSlug(slug);
        
        return this.listingDetailService.getListingById(listingId);
      }),
      catchError(err => {
        console.error('Error loading listing:', err);
        this.error = 'Error al cargar el listing';
        this.loading = false;
        return of(null);
      })
    ).subscribe(listing => {
      if (listing) {
        this.listing = listing;
        this.setupSEO();
        this.buildBreadcrumbs();
        this.loadRelatedListings();
      }
      this.loading = false;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private scrollToTop(): void {
    if (this.isBrowser) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  private extractIdFromSlug(slug: string): string {
    // Extraer ID del formato: "{slug}-lid-{id}"
    const lidIndex = slug.lastIndexOf('-lid-');
    if (lidIndex !== -1) {
      return slug.substring(lidIndex + 5); // +5 para saltar "-lid-"
    }
    
    // Fallback: usar el slug completo como ID
    console.warn(`No se encontró "-lid-" en el slug: ${slug}, usando slug como ID`);
    return slug;
  }

  private buildBreadcrumbs(): void {
    if (!this.listing) return;

    this.breadcrumbItems = [
      { label: this.i18n.t('COMMON.HOME'), url: '/' }
    ];

    if (this.listing.category) {
      if (this.listing.category.parent_id) {
        this.categoryService.all$.pipe(
          takeUntil(this.destroy$)
        ).subscribe(categories => {
          const parentCategory = categories.find(cat => cat.id === this.listing!.category.parent_id);
          if (parentCategory) {
            this.breadcrumbItems.splice(1, 0, {
              label: parentCategory.name || parentCategory.slug,
              url: `/categoria/${parentCategory.slug}`
            });
          }
        });
      }

      this.breadcrumbItems.push({
        label: this.listing.category.name || this.listing.category.slug,
        url: `/categoria/${this.listing.category.slug}`
      });
    }

    this.breadcrumbItems.push({
      label: this.listing.title || 'Artículo',
      isActive: true
    });
  }

  private loadRelatedListings(): void {
    if (!this.listing) return;

    this.listingDetailService.getRelatedListings(this.listing.id, 8).pipe(
      takeUntil(this.destroy$),
      catchError(err => {
        console.error('Error loading related listings:', err);
        return of([]);
      })
    ).subscribe(listings => {
      this.relatedListings = listings;
    });
  }

  increaseQuantity(): void {
    if (this.quantity < (this.listing?.max_quantity_per_order || 10)) {
      this.quantity++;
    }
  }

  decreaseQuantity(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  addToCart(): void {
    if (!this.listing) return;
    
    console.log('Agregando al carrito:', {
      listing: this.listing.id,
      quantity: this.quantity
    });

    if (this.isBrowser) {
      alert(`${this.listing.title} agregado al carrito (${this.quantity} unidad${this.quantity > 1 ? 'es' : ''})`);
    }
  }

  purchase(): void {
    if (!this.listing) return;

    console.log('Iniciando compra:', {
      listing: this.listing.id,
      quantity: this.quantity
    });

    if (this.isBrowser) {
      alert(`${this.listing.title} (${this.quantity} unidad${this.quantity > 1 ? 'es' : ''})`);
    }
  }

  toggleWishlist(): void {
    if (!this.listing) return;
    
    console.log('Toggle wishlist para:', this.listing.id);

    if (this.isBrowser) {
      alert('Funcionalidad de favoritos próximamente');
    }
  }

  onRelatedListingClick(listing: Listing): void {    
    const slug = this.listingService.generateSlugWithId(listing.title || 'listing', listing.id);
    this.router.navigate(['/articulo', slug]);    
  }

  get hasImages(): boolean | undefined {
    return this.listing?.images && this.listing.images.length > 0;
  }

  get displayImages() {
    if (this.hasImages) {
      // Ordenar imágenes por sort_order y primary
      return this.listing!.images.sort((a, b) => {
        if (a.is_primary && !b.is_primary) return -1;
        if (!a.is_primary && b.is_primary) return 1;
        return a.sort_order - b.sort_order;
      });
    }
    
    return [];
  }

  get hasDiscount(): boolean {
    if (!this.listing?.list_price || !this.listing?.price) return false;
    const listPrice = parseFloat(this.listing.list_price);
    const currentPrice = parseFloat(this.listing.price);
    return listPrice > currentPrice;
  }

  get discountPercentage(): number {
    if (!this.hasDiscount) return 0;
    
    const listPrice = parseFloat(this.listing!.list_price!);
    const currentPrice = parseFloat(this.listing!.price!);
    return Math.round(((listPrice - currentPrice) / listPrice) * 100);
  }

  get formattedPrice(): string {    
    return this.listingService.getformattedPrice(this.listing?.price as string);
  }

  get formattedListPrice(): string {
    return this.listingService.getformattedPrice(this.listing?.list_price as string);
  }

  goHome(): void {
    this.router.navigate(['/']);
  }

  getMethodCostDisplay(cost: string): string {
    const numericCost = parseInt(cost);
    return numericCost === 0 
      ? 'Gratis' 
      : `$${numericCost.toLocaleString('es-AR')}`;
  }

  private setupSEO(): void {    
    const communityName = this.i18n.t('COMMUNITY.NAME'); 
    const listingTitle = this.listing?.title || '';
    this.seo.setPageMeta(
      'PAGES.LISTING_DETAIL.TITLE',
      'PAGES.LISTING_DETAIL.DESCRIPTION',
      { listingTitle, communityName }
    );
  }
}