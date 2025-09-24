import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpParams } from '@angular/common/http';
import { Subject, combineLatest, switchMap, map, catchError, tap, take } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { ApiService } from '../../core/services/api.service';
import { CommunityService } from '../../core/services/community.service';
import { Listing } from '../../core/models/listing.model';
import { SeoService } from '../../core/services/seo.service';
import { I18nService } from '../../core/services/i18n.service';

import { BreadcrumbComponent, BreadcrumbItem } from '../../shared/components/breadcrumb/breadcrumb.component';
import { ListingCardComponent } from '../../shared/components/listing-card/listing-card.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';

import { TranslatePipe } from 'src/app/shared/pipes/translate.pipe';

interface NewsListingsResponse {
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
  selector: 'app-news-page',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
    BreadcrumbComponent,
    ListingCardComponent,
    PaginationComponent
  ],
  templateUrl: './news-page.component.html',
  styleUrls: ['./news-page.component.css']
})
export class NewsPageComponent implements OnInit, OnDestroy {
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
    private apiService: ApiService,
    private communityService: CommunityService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.buildBreadcrumbs();
    this.setupSEO();

    // Observar cambios en los query params para la paginación
    this.route.queryParams.pipe(
      takeUntil(this.destroy$),
      tap(() => {
        this.loading = true;
        this.error = null;
      }),
      switchMap((queryParams) => {
        this.currentPage = parseInt(queryParams['page']) || 1;
        return this.loadNewsListings(this.currentPage);
      }),
      catchError(err => {
        console.error('Error loading news page:', err);
        this.error = err.message || 'Error al cargar las novedades';
        this.loading = false;
        throw err;
      })
    ).subscribe({
      next: (response: NewsListingsResponse) => {
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

  private loadNewsListings(page: number = 1) {
    return this.communityService.waitForId$().pipe(
      switchMap((communityId: string) => {
        const endpoint = `/communities/${communityId}/listings/featured`;        
        const params = new HttpParams()
          .set('page', page.toString())
          .set('limit', this.itemsPerPage.toString())
          .set('strategy', 'newest_first');
        
        return this.apiService.getPaginated<Listing>(endpoint, params);
      })
    );
  }

  private buildBreadcrumbs(): void {
    this.breadcrumbItems = [
      { label: 'Inicio', url: '/' },
      { label: 'Novedades', isActive: true }
    ];
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
    this.seo.setPageMeta(
      'PAGES.NEWS.TITLE',
      'PAGES.NEWS.DESCRIPTION',
      { communityName }
    );
  }
}