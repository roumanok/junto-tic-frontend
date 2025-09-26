// src/app/features/category/category-page.component.ts
import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpParams } from '@angular/common/http';
import { Subject, combineLatest, of, from, Observable } from 'rxjs';
import { takeUntil, switchMap, map, catchError, tap, take } from 'rxjs/operators';

import { CategoryService } from '../../core/services/category.service';
import { ApiService } from '../../core/services/api.service';
import { CommunityService } from '../../core/services/community.service';
import { Category } from '../../core/models/category.model';
import { Listing } from '../../core/models/listing.model';
import { SeoService } from '../../core/services/seo.service';
import { I18nService } from '../../core/services/i18n.service';

import { BreadcrumbComponent, BreadcrumbItem } from '../../shared/components/breadcrumb/breadcrumb.component';
import { ListingCardComponent } from '../../shared/components/listing-card/listing-card.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';

import { TranslatePipe } from 'src/app/shared/pipes/translate.pipe';

interface CategoryListingsResponse {
  items: Listing[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
}

@Component({
  selector: 'app-category-page',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
    BreadcrumbComponent,
    ListingCardComponent,
    PaginationComponent
  ],
  templateUrl: './category-page.component.html',
  styleUrls: ['./category-page.component.scss']
})
export class CategoryPageComponent implements OnInit, OnDestroy {
  category: Category | null = null;
  listings: Listing[] = [];
  breadcrumbItems: BreadcrumbItem[] = [];
  loading = true;
  error: string | null = null;
  
  // Paginación
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  itemsPerPage = 12;
  
  private destroy$ = new Subject<void>();
  private isBrowser: boolean;
  private seo = inject(SeoService);
  private i18n = inject(I18nService);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private categoryService: CategoryService,
    private apiService: ApiService,
    private communityService: CommunityService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    // Observar cambios en los parámetros de ruta y query params
    combineLatest([
      this.route.params,
      this.route.queryParams
    ]).pipe(
      takeUntil(this.destroy$),
      tap(() => {
        this.loading = true;
        this.error = null;
      }),
      switchMap(([params, queryParams]) => {
        const slug = params['slug'];
        this.currentPage = parseInt(queryParams['page']) || 1;
        
        if (!slug) {
          throw new Error('No se encontró el slug de la categoría');
        }
        
        // Primero asegurarnos de que las categorías estén cargadas
        return from(this.categoryService.ensureCategoriesLoaded()).pipe(
          map((categories: Category[]) => {
            const category = categories.find((cat: Category) => cat.slug === slug);
            if (!category) {
              console.error('Available categories:', categories.map((c: Category) => c.slug));
              throw new Error(`No se encontró la categoría con slug: ${slug}`);
            }
            return category;
          }),
          switchMap((category: Category) => {
            this.category = category;
            this.setupSEO();
            this.buildBreadcrumbs();
            return this.loadCategoryListings(category.id, this.currentPage);
          })
        );
      }),
      catchError(err => {
        console.error('Error loading category page:', err);
        this.error = err.message || 'Error al cargar la categoría';
        this.loading = false;
        throw err;
      })
    ).subscribe({
      next: (response: CategoryListingsResponse) => {
        this.listings = response.items;
        this.totalItems = response.pagination.total;
        this.totalPages = response.pagination.total_pages;        
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadCategoryListings(categoryId: string, page: number = 1): Observable<CategoryListingsResponse> {
    return this.communityService.waitForId$().pipe(
      switchMap((communityId: string) => {
        const endpoint = `/communities/${communityId}/listings/categories/${categoryId}/listings`;        
        const params = new HttpParams()
          .set('page', page.toString())
          .set('limit', this.itemsPerPage.toString());
        
        return this.apiService.getPaginated<Listing>(endpoint, params);
      })
    );
  }

  private buildBreadcrumbs(): void {
    if (!this.category) return;

    this.breadcrumbItems = [
      { label: this.i18n.t('COMMON.HOME'), url: '/' }
    ];

    // Si la categoría tiene padre, buscarlo
    if (this.category.parent_id) {
      this.categoryService.all$.pipe(
        takeUntil(this.destroy$)
      ).subscribe(categories => {
        const parentCategory = categories.find(cat => cat.id === this.category!.parent_id);
        if (parentCategory) {
          this.breadcrumbItems.splice(1, 0, {
            label: parentCategory.name || parentCategory.slug,
            url: `/categoria/${parentCategory.slug}`
          });
        }
      });
    }

    this.breadcrumbItems.push({
      label: this.category.name || this.category.slug,
      isActive: true
    });
  }

  onPageChange(page: number): void {
    if (page === this.currentPage || page < 1 || page > this.totalPages) {
      return;
    }

    // Navegar con el nuevo parámetro de página
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: page > 1 ? page : null }, // No incluir page=1 en URL
      queryParamsHandling: 'merge'
    });

    // Scroll al top
    if (this.isBrowser) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  trackByListing(index: number, listing: Listing): string {
    return listing.id;
  }

  private setupSEO(): void {    
    const communityName = this.i18n.t('COMMUNITY.NAME'); 
    const categoryName = this.category?.name || '';
    this.seo.setPageMeta(
      'PAGES.CATEGORY.TITLE',
      'PAGES.CATEGORY.DESCRIPTION',
      { categoryName, communityName }
    );
  }
}