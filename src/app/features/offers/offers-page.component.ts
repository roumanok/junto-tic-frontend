import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpParams } from '@angular/common/http';
import { Subject, switchMap, catchError, tap } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { CommunityService } from '../../core/services/community.service';
import { Listing } from '../../core/models/listing.model';
import { SeoService } from '../../core/services/seo.service';
import { I18nService } from '../../core/services/i18n.service';
import { BreadcrumbComponent, BreadcrumbItem } from '../../shared/components/breadcrumb/breadcrumb.component';
import { ListingCardComponent } from '../../shared/components/listing-card/listing-card.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { PageHeaderComponent } from 'src/app/shared/components/page-header/page-header.component';
import { TranslatePipe } from 'src/app/shared/pipes/translate.pipe';

@Component({
  selector: 'app-offers-page',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
    BreadcrumbComponent,
    PageHeaderComponent,
    ListingCardComponent,
    PaginationComponent
  ],
  templateUrl: './offers-page.component.html',
  styleUrls: ['./offers-page.component.css']
})
export class OffersPageComponent implements OnInit, OnDestroy {
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
  private apiService = inject(ApiService);
  private communityService = inject(CommunityService);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.buildBreadcrumbs();
    this.setupSEO();

    this.route.queryParams.pipe(
      takeUntil(this.destroy$),
      tap(() => {
        this.loading = true;
        this.error = null;
      }),
      switchMap((queryParams) => {
        this.currentPage = parseInt(queryParams['page']) || 1;
        return this.loadOffersListings(this.currentPage);
      }),
      catchError(err => {
        console.error('Error loading Offers page:', err);
        this.error = err.message || this.i18n.t('LISTINGS.LOADING_ERROR');
        this.loading = false;
        throw err;
      })
    ).subscribe({
      next: (response) => {
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

  private loadOffersListings(page: number = 1) {
    return this.communityService.waitForId$().pipe(
      switchMap((communityId: string) => {
        const endpoint = `/communities/${communityId}/listings/featured`;        
        const params = new HttpParams()
          .set('page', page.toString())
          .set('limit', this.itemsPerPage.toString())
          .set('strategy', 'offers_first');
        
        return this.apiService.getPaginated<Listing>(endpoint, params);
      })
    );
  }

  private buildBreadcrumbs(): void {
    this.breadcrumbItems = [
      { label: this.i18n.t('COMMON.HOME'), url: '/' },
      { label: this.i18n.t('COMMON.OFFERS'), isActive: true }
    ];
  }

  onPageChange(page: number): void {
    if (page === this.currentPage || page < 1 || page > this.totalPages) {
      return;
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page: page > 1 ? page : null },
      queryParamsHandling: 'merge'
    });

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
      'PAGES.OFFERS.TITLE',
      'PAGES.OFFERS.DESCRIPTION',
      { communityName }
    );
  }
}