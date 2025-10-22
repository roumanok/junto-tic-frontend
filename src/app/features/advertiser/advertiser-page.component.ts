import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpParams } from '@angular/common/http';
import { Observable, Subject, combineLatest, of } from 'rxjs';
import { takeUntil, switchMap, catchError, tap } from 'rxjs/operators';
import { ApiPaginatedResponse, ApiService } from '../../core/services/api.service';
import { CommunityService } from '../../core/services/community.service';
import { Listing } from '../../core/models/listing.model';
import { Advertiser } from '../../core/models/advertiser.model';
import { SeoService } from '../../core/services/seo.service';
import { I18nService } from '../../core/services/i18n.service';
import { CdnService } from 'src/app/core/services/cdn.service';
import { ThemeService } from 'src/app/core/services/theme.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorStateComponent } from 'src/app/shared/components/error-state/error-state.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { BreadcrumbComponent, BreadcrumbItem } from '../../shared/components/breadcrumb/breadcrumb.component';
import { ListingCardComponent } from '../../shared/components/listing-card/listing-card.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { PageHeaderComponent } from 'src/app/shared/components/page-header/page-header.component';
import { TranslatePipe } from 'src/app/shared/pipes/translate.pipe';

@Component({
    selector: 'app-advertiser-page',
    standalone: true,
    imports: [
        CommonModule,
        TranslatePipe,
        LoadingSpinnerComponent,
        ErrorStateComponent,
        EmptyStateComponent,
        BreadcrumbComponent,
        PageHeaderComponent,
        ListingCardComponent,
        PaginationComponent
    ],
    templateUrl: './advertiser-page.component.html',
    styleUrl: './advertiser-page.component.css'
})
export class AdvertiserPageComponent implements OnInit, OnDestroy {
    advertiser: Advertiser | null = null;
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
    private cdnService = inject(CdnService);
    private themeService = inject(ThemeService);
  
    constructor(
        private route: ActivatedRoute,
        private router: Router,
        @Inject(PLATFORM_ID) platformId: Object
    ) {
        this.isBrowser = isPlatformBrowser(platformId);
    }

    ngOnInit(): void {
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
                throw new Error('No se encontró el slug del anunciante');
            }
            
            const advertiserId = this.extractAdvertiserIdFromSlug(slug);
            
            if (!advertiserId) {                
                throw new Error(this.i18n.t("PAGES.ADVERTISER.NOT_FOUND") + `: ${slug}`);
            }
            
            return this.loadAdvertiserInfo(advertiserId).pipe(
            switchMap((advertiser: Advertiser) => {
                this.advertiser = advertiser;
                this.setupSEO();
                this.buildBreadcrumbs();
                return this.loadAdvertiserListings(advertiserId, this.currentPage);
            })
            );
        }),
        catchError(err => {
            console.error('Error loading advertiser page:', err);
            this.error = err.message || this.i18n.t("PAGES.ADVERTISER.LOADING_ERROR");
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

    private extractAdvertiserIdFromSlug(slug: string): string | null {
        // Formato esperado: {slug}-aid-{id}
        const match = slug.match(/-aid-([a-f0-9-]+)$/i);
        return match ? match[1] : null;
    }

    private loadAdvertiserInfo(advertiserId: string): Observable<Advertiser> {
        return this.communityService.waitForId$().pipe(
            switchMap((communityId: string) => {
                const endpoint = `/communities/${communityId}/advertisers/${advertiserId}`;
                return this.apiService.getSimple<Advertiser>(endpoint);
            })
        );
    }

    private loadAdvertiserListings(advertiserId: string, page: number = 1): Observable<ApiPaginatedResponse<Listing>> {
        return this.communityService.waitForId$().pipe(
        switchMap((communityId: string) => {
            const endpoint = `/communities/${communityId}/advertisers/${advertiserId}/listings`;
            const params = new HttpParams()
            .set('page', page.toString())
            .set('limit', this.itemsPerPage.toString());
            return this.apiService.getPaginated<Listing>(endpoint, params);
        })
        );
    }

    private buildBreadcrumbs(): void {
        if (!this.advertiser) return;

        this.breadcrumbItems = [
            { label: this.i18n.t('COMMON.HOME'), url: '/' },            
            {
                label: this.advertiser.name ? this.advertiser.name : this.i18n.t('COMMON.ADVERTISER'),
                isActive: true
            }
        ];
    }

    handleRetry(): void {    
        this.ngOnInit();
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

    getLogoUrl(): string {              
        const logoRelPath = this.advertiser?.logo_url || null;      
        return this.themeService.getUrlWithCdn(logoRelPath);
    }

    private setupSEO(): void {    
        const communityName = this.i18n.t('COMMUNITY.NAME'); 
        const advertiserName = this.advertiser?.name || '';
        this.seo.setPageMeta(
        'PAGES.ADVERTISER.TITLE',
        'PAGES.ADVERTISER.DESCRIPTION',
        { advertiserName, communityName }
        );
    }
}