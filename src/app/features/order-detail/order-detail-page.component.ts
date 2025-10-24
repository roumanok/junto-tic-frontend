import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, switchMap, catchError, tap, takeUntil, combineLatest, of } from 'rxjs';
import { OrderService } from '../../core/services/order.service';
import { OrderDetail } from '../../core/models/order.model';
import { ListingService } from '../../core/services/listing.service';
import { SeoService } from '../../core/services/seo.service';
import { I18nService } from '../../core/services/i18n.service';
import { CdnService } from '../../core/services/cdn.service';
import { BreadcrumbComponent, BreadcrumbItem } from '../../shared/components/breadcrumb/breadcrumb.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorStateComponent } from 'src/app/shared/components/error-state/error-state.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-order-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BreadcrumbComponent,
    LoadingSpinnerComponent,
    ErrorStateComponent,
    TranslatePipe
  ],
  templateUrl: './order-detail-page.component.html',
  styleUrl: './order-detail-page.component.css'
})
export class OrderDetailPageComponent implements OnInit, OnDestroy {
  order = signal<OrderDetail | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);
  paymentStatusMessage = signal<{ type: 'success' | 'error' | 'warning' | null, text: string } | null>(null);
  retryingPayment = signal(false);

  breadcrumbItems: BreadcrumbItem[] = [];
  
  private destroy$ = new Subject<void>();
  private isBrowser: boolean;
  private seo = inject(SeoService);
  private i18n = inject(I18nService);
  private cdnService = inject(CdnService);
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
    this.buildBreadcrumbs();    
    this.loadOrderDetail();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  private loadOrderDetail(): void {
    combineLatest([
      this.route.params,
      this.route.queryParams
    ]).pipe(
      takeUntil(this.destroy$),
      tap(() => {
        this.loading.set(true);
        this.error.set(null);
      }),
      switchMap(([params, queryParams]) => {    
        this.checkPaymentStatus(queryParams);

        const orderId = queryParams['external_transaction_id'] || params['order_id'];
        
        console.log('🔍 Buscando orden:', {
          fromQueryParams: queryParams['external_transaction_id'],
          fromParams: params['order_id'],
          paymentStatus: queryParams['status'],
          orderId
        });
        
        if (!orderId) {
          throw new Error('No se encontró el ID de la orden');
        }
        
        return this.orderService.getOrderDetail(orderId);
      }),
      catchError((err) => {
        console.error('Error cargando detalle de orden:', err);
        this.error.set(err.message || this.i18n.t('PAGES.ORDER_DETAIL.LOADING_ERROR'));
        this.loading.set(false);
        return of(null);
      })
    ).subscribe((response) => {
      if (response) {
        this.order.set(response);
        this.updateBreadcrumbsWithOrder(response);
        this.setupSEO();
      }
      this.loading.set(false);
    });
  }

  private checkPaymentStatus(queryParams: any): void {
    const status = queryParams['status'];
    
    if (!status) {
      this.paymentStatusMessage.set(null);
      return;
    }

    switch (status.toLowerCase()) {
      case 'pending':
        this.paymentStatusMessage.set({
          type: 'warning',
          text: this.i18n.t('PAGES.ORDER_DETAIL.PAYMENT_MSG_PENDING')
        });
        break;
      case 'issued':
        this.paymentStatusMessage.set({
          type: 'warning',
          text: this.i18n.t('PAGES.ORDER_DETAIL.PAYMENT_MSG_ISSUED')
        });
        break;
      case 'in_process':
        this.paymentStatusMessage.set({
          type: 'warning',
          text: this.i18n.t('PAGES.ORDER_DETAIL.PAYMENT_MSG_IN_PROCESS')
        });
        break;
      case 'approved':
        this.paymentStatusMessage.set({
          type: 'success',
          text: this.i18n.t('PAGES.ORDER_DETAIL.PAYMENT_MSG_APPROVED')
        });
        break;      
      case 'rejected':
        this.paymentStatusMessage.set({
          type: 'error',
          text: this.i18n.t('PAGES.ORDER_DETAIL.PAYMENT_MSG_REJECTED')          
        });
        break;
      case 'cancelled':
        this.paymentStatusMessage.set({
          type: 'error',
          text: this.i18n.t('PAGES.ORDER_DETAIL.PAYMENT_MSG_CANCELLED')
        });
        break;
      case 'overdue':
        this.paymentStatusMessage.set({
          type: 'error',
          text: this.i18n.t('PAGES.ORDER_DETAIL.PAYMENT_MSG_OVERDUE')
        });
        break;
      case 'refunded':
        this.paymentStatusMessage.set({
          type: 'error',
          text: this.i18n.t('PAGES.ORDER_DETAIL.PAYMENT_MSG_REFUNDED')
        });
        break;      
      case 'deferred':
        this.paymentStatusMessage.set({
          type: 'warning',
          text: this.i18n.t('PAGES.ORDER_DETAIL.PAYMENT_MSG_DEFERRED')
        });
        break;        
      case 'objected':
        this.paymentStatusMessage.set({
          type: 'warning',
          text: this.i18n.t('PAGES.ORDER_DETAIL.PAYMENT_MSG_OBJECTED')
        });
        break;                
      case 'review':
        this.paymentStatusMessage.set({
          type: 'warning',
          text: this.i18n.t('PAGES.ORDER_DETAIL.PAYMENT_MSG_REVIEW')
        });
        break;
      case 'validate':
        this.paymentStatusMessage.set({
          type: 'warning',
          text: this.i18n.t('PAGES.ORDER_DETAIL.PAYMENT_MSG_VALIDATE')
        });
        break;        
      
      default:
        this.paymentStatusMessage.set(null);
        break;
    }
  }

  private buildBreadcrumbs(): void {
    this.breadcrumbItems = [
      { label: this.i18n.t('COMMON.HOME'), url: '/' },
      { label: this.i18n.t('COMMON.MY_ACCOUNT'), url: '/mi-cuenta/' },
      { label: this.i18n.t('COMMON.MY_ORDERS'), url: '/mi-cuenta/mis-compras' },
      { label: this.i18n.t('COMMON.ORDER'), url: '' }
    ];
  }

  private updateBreadcrumbsWithOrder(order: OrderDetail): void {
    if (this.breadcrumbItems.length > 0) {
      this.breadcrumbItems[this.breadcrumbItems.length - 1] = {
        label: this.i18n.t('COMMON.ORDER') + ' #' + order.public_id,
        url: ''
      };
    }
  }

  private setupSEO(): void {
    const communityName = this.i18n.t('COMMUNITY.NAME');
    const orderId = this.order()?.public_id;
    this.seo.setPageMeta(
      'PAGES.ORDER_DETAIL.TITLE',
      'PAGES.ORDER_DETAIL.DESCRIPTION',
      { orderId, communityName }
    );
  }

  getStatusLabel(status: string): string {
    return this.orderService.getStatusLabel(status);
  }

  getPaymentStatusLabel(status: string): string {
    return this.orderService.getPaymentStatusLabel(status);
  }

  getCustomerIdentificationTypeLabel(type: string): string {
    return this.orderService.getCustomerIdentificationTypeLabel(type);
  }

  formatDateTime(dateString: string): string {
    return this.orderService.formatDateTime(dateString);
  }

  formatPrice(price: string | number): string {
    return this.listingService.getformattedPrice(price);    
  }  

  getCdnUrl(imagePath?: string): string {
    if (!imagePath) return '/placeholder.png';
    return this.cdnService.getCdnUrl(imagePath);
  }

  goBack(): void {
    this.router.navigate(['/mi-cuenta/mis-compras']);
  }

  goToListing(listingId: string): void {
    this.router.navigate(['/articulo', listingId]);
  }

  shouldShowRetryButton(): boolean {
    const order = this.order();
    if (!order) return false;
    
    const paymentStatus = order.payment_status.toLowerCase();
    return paymentStatus === 'rejected' || 
           paymentStatus === 'objected' || 
           paymentStatus === 'overdue';
  }

  shouldShowDownloadTicketButton(): boolean {
    const order = this.order();
    if (!order) return false;
    
    return order.payment_status.toLowerCase() === 'approved' && 
           !!order.external_transaction_id;
  }

  retryPayment(): void {
    const order = this.order();
    if (!order || !order.external_transaction_id) {
      console.error('No se puede reintentar el pago: falta external_transaction_id');
      return;
    }

    this.retryingPayment.set(true);
    
    this.orderService.retryPayment(order.external_transaction_id).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        console.log('✅ Reintento de pago iniciado:', response);
        // Redirigir al usuario a la URL de pago
        if (response.payment_url) {
          window.location.href = response.payment_url;
        }
      },
      error: (error) => {
        console.error('❌ Error al reintentar el pago:', error);
        this.retryingPayment.set(false);
        // Aquí podrías mostrar un mensaje de error al usuario
        alert(this.i18n.t('PAGES.ORDER_DETAIL.RETRY_PAYMENT_ERROR'));
      }
    });
  }

  downloadTicket(): void {
    const order = this.order();
    if (!order || !order.external_transaction_id) {
      console.error('No se puede descargar el comprobante: falta external_transaction_id');
      return;
    }

    const ticketUrl = `https://checkout.paypertic.com/app/${order.external_transaction_id}/ticket`;
    window.open(ticketUrl, '_blank');
  }
  
}