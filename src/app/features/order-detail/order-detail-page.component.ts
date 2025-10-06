import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, switchMap, catchError, tap, takeUntil } from 'rxjs';
import { of } from 'rxjs';

import { OrdersService } from '../../core/services/order.service';
import { OrderDetail } from '../../core/models/order-detail.model';
import { ListingService } from '../../core/services/listing.service';
import { SeoService } from '../../core/services/seo.service';
import { I18nService } from '../../core/services/i18n.service';
import { CdnService } from '../../core/services/cdn.service';

import { BreadcrumbComponent, BreadcrumbItem } from '../../shared/components/breadcrumb/breadcrumb.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-order-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BreadcrumbComponent,
    TranslatePipe
  ],
  templateUrl: './order-detail-page.component.html',
  styleUrl: './order-detail-page.component.css'
})
export class OrderDetailPageComponent implements OnInit, OnDestroy {
  order = signal<OrderDetail | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  breadcrumbItems: BreadcrumbItem[] = [];
  
  private destroy$ = new Subject<void>();
  private isBrowser: boolean;
  private seo = inject(SeoService);
  private i18n = inject(I18nService);
  private cdnService = inject(CdnService);
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
    this.loadOrderDetail();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadOrderDetail(): void {
    this.route.params.pipe(
      takeUntil(this.destroy$),
      tap(() => {
        this.loading.set(true);
        this.error.set(null);
      }),
      switchMap((params) => {        
        const orderId = params['order_id'];        
        if (!orderId) {
          throw new Error('No se encontró el ID de la orden');
        }
        return this.ordersService.getOrderDetail(orderId);
      }),
      catchError((err) => {
        console.error('Error cargando detalle de orden:', err);
        this.error.set(err.message || 'Error al cargar la orden');
        this.loading.set(false);
        return of(null);
      })
    ).subscribe((response) => {
      if (response) {        
        this.order.set(response);
        this.updateBreadcrumbsWithOrder(response);
      }
      this.loading.set(false);
    });
  }

  private buildBreadcrumbs(): void {
    this.breadcrumbItems = [
      { label: this.i18n.t('COMMON.HOME'), url: '/' },
      { label: this.i18n.t('COMMON.MY_ORDERS'), url: '/mi-cuenta/mis-compras' },
      { label: this.i18n.t('COMMON.ORDER'), url: '' }
    ];
  }

  private updateBreadcrumbsWithOrder(order: OrderDetail): void {
    // Actualizar el último breadcrumb con el ID de la orden
    if (this.breadcrumbItems.length > 0) {
      this.breadcrumbItems[this.breadcrumbItems.length - 1] = {
        label: this.i18n.t('COMMON.ORDER') + ' #'+order.id,
        url: ''
      };
    }
  }

  private setupSEO(): void {
    const communityName = this.i18n.t('COMMUNITY.NAME');
    const orderId = this.route.snapshot.params['order_id'];
    this.seo.setPageMeta(
      'PAGES.ORDER_DETAIL.TITLE',
      'PAGES.ORDER_DETAIL.DESCRIPTION',
      { orderId, communityName }
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
    return date.toLocaleDateString(environment.locale, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatPrice(price: string | number): string {
    return '$' + this.listingService.getformattedPrice(price);    
  }  

  getCdnUrl(imagePath?: string): string {
    if (!imagePath) return '/placeholder-product.png';
    return this.cdnService.getCdnUrl(imagePath);
  }

  goBack(): void {
    this.router.navigate(['/mi-cuenta/mis-compras']);
  }

  goToListing(listingId: string): void {
    this.router.navigate(['/articulo', listingId]);
  }

  printOrder(): void {
    if (this.isBrowser) {
      window.print();
    }
  }
}