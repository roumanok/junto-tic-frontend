import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subject, switchMap, catchError, tap, takeUntil } from 'rxjs';
import { of } from 'rxjs';

import { Order } from '../../core/models/order.model';

import { OrdersService } from '../../core/services/order.service';
import { SeoService } from '../../core/services/seo.service';
import { I18nService } from '../../core/services/i18n.service';
import { ListingService } from '../../core/services/listing.service';

import { BreadcrumbComponent, BreadcrumbItem } from '../../shared/components/breadcrumb/breadcrumb.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-my-orders-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BreadcrumbComponent,
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ordersService: OrdersService,
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

  public loadOrders(): void {
    this.route.queryParams.pipe(
      takeUntil(this.destroy$),
      tap(() => {
        this.loading.set(true);
        this.error.set(null);
      }),
      switchMap((queryParams) => {
        this.currentPage = parseInt(queryParams['page']) || 1;
        return this.ordersService.getUserOrders(this.currentPage, this.itemsPerPage);
      }),
      catchError((err) => {
        console.error('Error cargando órdenes:', err);
        this.error.set(err.message || 'Error al cargar las órdenes');
        this.loading.set(false);
        return of(null);
      })
    ).subscribe((response) => {
      if (response) {
        console.log('📦 Órdenes cargadas:', response);
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

  getStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'status-pending',
      'processing': 'status-processing',
      'delivered': 'status-delivered',
      'cancelled': 'status-cancelled'
    };
    return statusMap[status] || 'status-pending';
  }

  getPaymentStatusClass(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'payment-pending',
      'approved': 'payment-approved',
      'cancelled': 'payment-cancelled',
      'refunded': 'payment-refunded'
    };
    return statusMap[status] || 'payment-pending';
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'pending': 'Pendiente',
      'processing': 'En preparación',
      'delivered': 'Entregado',
      'cancelled': 'Cancelado'
    };
    return labels[status] || status;
  }

  getPaymentStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'pending': 'Pendiente',
      'approved': 'Pago aprobado',
      'cancelled': 'Pago cancelado',
      'refunded': 'Reembolsado'
    };
    return labels[status] || status;
  }

  getDeliveryMethodLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'pickup': 'Retiro en local',
      'delivery': 'Envío a domicilio'
    };
    return labels[type] || type;
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatPrice(price: string | number): string {    
    return '$' + this.listingService.getformattedPrice(price);    
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
}