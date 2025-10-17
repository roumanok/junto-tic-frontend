import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID, inject, signal } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, switchMap, catchError, tap, takeUntil, combineLatest } from 'rxjs';
import { of } from 'rxjs';

import { OrderService } from '../../core/services/order.service';
import { OrderDetail } from '../../core/models/order.model';
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
  paymentStatusMessage = signal<{ type: 'success' | 'error' | 'warning' | null, text: string } | null>(null);

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
    private orderService: OrderService,
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
        this.error.set(err.message || 'Error al cargar la orden');
        this.loading.set(false);
        return of(null);
      })
    ).subscribe((response) => {
      if (response) {
        console.log('📦 Orden cargada:', response);       
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
      case 'issued':
      case 'in_process':
        this.paymentStatusMessage.set({
          type: 'warning',
          text: 'El pago está pendiente o en proceso'
        });
        break;
      case 'approved':
        this.paymentStatusMessage.set({
          type: 'success',
          text: '¡Pago exitoso! Gracias por tu compra'
        });
        break;      
      case 'rejected':
        this.paymentStatusMessage.set({
          type: 'error',
          text: 'El pago fue rechazado'
        });
        break;
      case 'cancelled':
      case 'overdue':
        this.paymentStatusMessage.set({
          type: 'error',
          text: 'El pago fue cancelado'
        });
        break;
      case 'refunded':
        this.paymentStatusMessage.set({
          type: 'error',
          text: 'El pago fue devuelto'
        });
        break;      
      case 'deferred':
        this.paymentStatusMessage.set({
          type: 'warning',
          text: 'El pago se encuentra diferido'
        });
        break;        
      case 'objected':
        this.paymentStatusMessage.set({
          type: 'warning',
          text: 'El pago se encuentra objetado'
        });
        break;                
      case 'review':
        this.paymentStatusMessage.set({
          type: 'warning',
          text: 'El pago se realizó y está siendo revisado por la entidad'
        });
        break;
      case 'validate':
        this.paymentStatusMessage.set({
          type: 'warning',
          text: 'El pago se realizó pero debe ser validado'
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
    // Actualizar el último breadcrumb con el ID de la orden
    if (this.breadcrumbItems.length > 0) {
      this.breadcrumbItems[this.breadcrumbItems.length - 1] = {
        label: this.i18n.t('COMMON.ORDER') + ' #'+order.public_id,
        url: ''
      };
    }
  }

  private setupSEO(): void {
    const communityName = this.i18n.t('COMMUNITY.NAME');
    const orderId = this.order()?.id;
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

  getCustomerIdentificationTypeLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'DNI_ARG': this.i18n.t('COMMON.DNI'),
      'CUIT_ARG': this.i18n.t('COMMON.CUIT')      
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
  
}