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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ChangeOrderStatusDialogComponent } from './components/change-order-status-dialog/change-order-status-dialog.component';
import { BreadcrumbComponent, BreadcrumbItem } from '../../shared/components/breadcrumb/breadcrumb.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorStateComponent } from 'src/app/shared/components/error-state/error-state.component';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-sale-detail-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    BreadcrumbComponent,
    LoadingSpinnerComponent,
    ErrorStateComponent,
    MatDialogModule,
    MatSnackBarModule,
    TranslatePipe
  ],
  templateUrl: './sale-detail-page.component.html',
  styleUrl: './sale-detail-page.component.css'
})
export class SaleDetailPageComponent implements OnInit, OnDestroy {
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
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
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
        
        return this.orderService.getSaleDetail(orderId);
      }),
      catchError((err) => {
        console.error('Error cargando detalle de orden:', err);
        this.error.set(err.message || this.i18n.t('PAGES.SALE_DETAIL.LOADING_ERROR'));
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

  private buildBreadcrumbs(): void {
    this.breadcrumbItems = [
      { label: this.i18n.t('COMMON.HOME'), url: '/' },
      { label: this.i18n.t('COMMON.MY_ACCOUNT'), url: '/mi-cuenta/' },
      { label: this.i18n.t('COMMON.MY_SALES'), url: '/mi-cuenta/mis-ventas' },
      { label: this.i18n.t('COMMON.ORDER'), url: '' }
    ];
  }

  private updateBreadcrumbsWithOrder(order: OrderDetail): void {
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
      'PAGES.SALE_DETAIL.TITLE',
      'PAGES.SALE_DETAIL.DESCRIPTION',
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
    this.router.navigate(['/mi-cuenta/mis-ventas']);
  }

  goToListing(listingId: string): void {
    this.router.navigate(['/articulo', listingId]);
  }

  openChangeStatusDialog(): void {
    if (!this.order()) return;

    const dialogRef = this.dialog.open(ChangeOrderStatusDialogComponent, {
      width: '500px',
      data: {
        currentStatus: this.order()!.status,
        orderId: this.order()!.id,
        publicId: this.order()!.public_id
      }
    });

    dialogRef.afterClosed().subscribe(newStatus => {
      if (newStatus) {
        this.updateOrderStatus(newStatus);
      }
    });
  }

  private updateOrderStatus(newStatus: string): void {
    if (!this.order()) return;

    const orderId = this.order()!.id;
    
    this.orderService.updateOrderStatus(orderId, newStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.order.update(order => {
            if (order) {
              return { ...order, status: newStatus };
            }
            return order;
          });

          this.snackBar.open(
            `Estado actualizado a: ${this.getStatusLabel(newStatus)}`,
            'Cerrar',
            { duration: 3000 }
          );
          console.log('Estado actualizado:', response);
        },
        error: (error) => {
          console.error('Error actualizando estado:', error);
          this.snackBar.open(
            this.i18n.t('PAGES.SALE_DETAIL.CHANGE_STATUS.ERROR'),
            this.i18n.t('COMMON.CLOSE'),
            { duration: 4000 }
          );
        }
      });
  }

  canChangeStatus(): boolean {
    if (!this.order()) return false;
    return this.order()!.status !== 'delivered';
  }

  printOrder(): void {
    if (!this.isBrowser) return;    
    document.body.classList.add('printing-order');
    setTimeout(() => {
      window.print();
      document.body.classList.remove('printing-order');
    }, 1000);
  }
  
}