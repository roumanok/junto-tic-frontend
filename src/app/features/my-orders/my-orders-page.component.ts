import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subject, switchMap, catchError, tap, takeUntil } from 'rxjs';
import { of } from 'rxjs';
import { Order } from '../../core/models/order.model';
import { OrderService } from '../../core/services/order.service';
import { SeoService } from '../../core/services/seo.service';
import { I18nService } from '../../core/services/i18n.service';
import { ListingService } from '../../core/services/listing.service';
import { BreadcrumbComponent, BreadcrumbItem } from '../../shared/components/breadcrumb/breadcrumb.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorStateComponent } from 'src/app/shared/components/error-state/error-state.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { PageHeaderComponent } from 'src/app/shared/components/page-header/page-header.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-my-orders-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LoadingSpinnerComponent,
    ErrorStateComponent,
    EmptyStateComponent,
    BreadcrumbComponent,
    PageHeaderComponent,
    PaginationComponent,
    TranslatePipe
  ],
  templateUrl: './my-orders-page.component.html',
  styleUrl: './my-orders-page.component.css'
})
export class MyOrdersPageComponent implements OnInit, OnDestroy {
  orders = signal<Order[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  breadcrumbItems: BreadcrumbItem[] = [];
  
  // Paginación
  currentPage = 1;
  totalPages = 1;
  totalItems = 0;
  itemsPerPage = 10;
  
  private destroy$ = new Subject<void>();
  private isBrowser: boolean;
  private seo = inject(SeoService);
  private i18n = inject(I18nService);
  private listingService = inject(ListingService);
  private orderService = inject(OrderService);

  constructor(
    private route: ActivatedRoute,
    private router: Router,    
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    this.setupSEO();
    this.buildBreadcrumbs();
    this.loadOrders();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  handleRetry(): void {
    this.ngOnInit();
  }

  public loadOrders(): void {
    this.route.queryParams.pipe(
      takeUntil(this.destroy$),
      tap(() => {
        this.loading.set(true);
        this.error.set(null);
      }),
      switchMap((queryParams) => {
        this.currentPage = parseInt(queryParams['page']) || 1;
        return this.orderService.getUserOrders(this.currentPage, this.itemsPerPage);
      }),
      catchError((err) => {
        console.error('Error cargando órdenes:', err);
        this.error.set(err.message || this.i18n.t('PAGES.MY_ORDERS.LOADING_ERROR'));
        this.loading.set(false);
        return of(null);
      })
    ).subscribe((response) => {
      if (response) {        
        const ordersData = response.orders || [];
        this.orders.set(ordersData);
        
        if (response.pagination) {
          this.totalPages = response.pagination.total_pages;
          this.totalItems = response.pagination.total;
          this.itemsPerPage = response.pagination.limit;
        }
      }
      this.loading.set(false);
    });
  }

  private buildBreadcrumbs(): void {
    this.breadcrumbItems = [
      { label: this.i18n.t('COMMON.HOME'), url: '/' },
      { label: this.i18n.t('COMMON.MY_ACCOUNT'), url: '/mi-cuenta' },
      { label: this.i18n.t('COMMON.MY_ORDERS'), url: '' }
    ];
  }

  private setupSEO(): void {
    const communityName = this.i18n.t('COMMUNITY.NAME');
    this.seo.setPageMeta(
      'PAGES.MY_ORDERS.TITLE',
      'PAGES.MY_ORDERS.DESCRIPTION',
      { communityName }
    );
  }  

  getItemsCount(items: any[]): number {
    if (!items || items.length === 0) return 0;
    return items.reduce((total, item) => total + (item.quantity || 1), 0);
  }

  viewOrderDetail(orderId: string): void {
    this.router.navigate(['/mi-cuenta/mis-compras/orden', orderId]);
  }

  onPageChange(page: number): void {
    if (page === this.currentPage) return;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page },
      queryParamsHandling: 'merge'
    });
  }

  formatDate(dateString: string): string {
    return this.orderService.formatDate(dateString);
  }

  getStatusLabel(status: string): string {
    return this.orderService.getStatusLabel(status);
  }

  getPaymentStatusLabel(status: string): string {
    return this.orderService.getPaymentStatusLabel(status);
  }

  getFormattedPrice(price: string | number): string {
    return this.listingService.getformattedPrice(price);
  }

}