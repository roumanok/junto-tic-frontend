import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { OrderService } from '../../core/services/order.service';
import { BreadcrumbComponent, BreadcrumbItem } from 'src/app/shared/components/breadcrumb/breadcrumb.component';
import { PaginationComponent } from 'src/app/shared/components/pagination/pagination.component';
import { TranslatePipe } from 'src/app/shared/pipes/translate.pipe';
import { ListingService } from 'src/app/core/services/listing.service';
import { CdnService } from 'src/app/core/services/cdn.service';
import { I18nService } from 'src/app/core/services/i18n.service';
import { SeoService } from 'src/app/core/services/seo.service';
import { MySalesMiniStatsComponent } from './components/my-sales-mini-stats/my-sales-mini-stats.component';

interface Sale {
  id: string;
  public_id: string;
  total: string;
  delivery_method_type: string;
  created_at: string;
  status: string;
  payment_status: string;
  customer_name: string;
  first_item_title: string;
  first_item_quantity: number;
  first_item_image: string;
}

interface SalesResponse {
  sales: Sale[];
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
  selector: 'app-my-sales-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSnackBarModule,
    PaginationComponent,
    BreadcrumbComponent,
    TranslatePipe,
    MySalesMiniStatsComponent
  ],
  templateUrl: './my-sales-page.component.html',
  styleUrl: './my-sales-page.component.css'
})
export class MySalesPageComponent implements OnInit, OnDestroy {
  sales = signal<Sale[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  currentPage = signal(1);
  totalItems = signal(0);
  pageSize = 10;
  
  breadcrumbItems: BreadcrumbItem[] = [];
  
  private destroy$ = new Subject<void>();
  private authService = inject(AuthService);
  private orderService = inject(OrderService);
  private listingService = inject(ListingService);
  private cdnService = inject(CdnService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private i18n = inject(I18nService);
  private seo = inject(SeoService);

  ngOnInit(): void {
    this.authService.checkAdvertiserAccess();
    this.buildBreadcrumbs();
    this.loadSales();
    this.setupSEO();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  public loadSales(): void {
    this.loading.set(true);
    
    this.orderService.getMySales(this.currentPage(), this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: SalesResponse) => {
          this.sales.set(response.sales || []);
          this.totalItems.set(response.pagination?.total || 0);
          this.loading.set(false);
          console.log('✅ Ventas cargadas:', response);
        },
        error: (error) => {
          this.loading.set(false);
          this.error.set('Error al cargar las ventas');
          console.error('❌ Error cargando ventas:', error);
          this.snackBar.open('Error al cargar las ventas', 'Cerrar', {
            duration: 4000
          });
          this.sales.set([]);
        }
      });
  }

  private buildBreadcrumbs(): void {
    this.breadcrumbItems = [
      { label: this.i18n.t('COMMON.HOME'), url: '/' },
      { label: this.i18n.t('COMMON.MY_ACCOUNT'), url: '/mi-cuenta' },
      { label: this.i18n.t('COMMON.MY_SALES'), url: '' }
    ];
  }

  private setupSEO(): void {
    const communityName = this.i18n.t('COMMUNITY.NAME');
    this.seo.setPageMeta(
      'PAGES.MY_SALES.TITLE',
      'PAGES.MY_SALES.DESCRIPTION',
      { communityName }
    );
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }

  formatPrice(price: string | number): string {
    return this.listingService.getformattedPrice(price);
  }

  getStatusClass(status: string): string {
    return `status-${status.toLowerCase()}`;
  }

  getStatusLabel(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Pendiente',
      'processing': 'En proceso',
      'delivered': 'Entregado',
      'cancelled': 'Cancelado'
    };
    return statusMap[status.toLowerCase()] || status;
  }

  getPaymentStatusLabel(paymentStatus: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Pendiente',
      'issued': 'Emitido',
      'in_process': 'En proceso',
      'approved': 'Aprobado',
      'rejected': 'Rechazado',
      'cancelled': 'Cancelado',
      'refunded': 'Devuelto',
      'deferred': 'Diferido',
      'objected': 'Objetado',
      'review': 'En revisión',
      'validate': 'En validación',
      'overdue': 'Vencido'
    };
    return statusMap[paymentStatus.toLowerCase()] || paymentStatus;
  }

  viewOrderDetail(orderId: string): void {
    console.log('Navegando a detalle de venta:', orderId);
    this.router.navigate(['/mi-cuenta/mis-ventas/orden', orderId]);
  }

  getCdnUrl(imagePath?: string): string {
    if (!imagePath) return '/placeholder-product.png';
    return this.cdnService.getCdnUrl(imagePath);
  }

  getDeliveryMethodLabel(type: string): string {
    const labels: { [key: string]: string } = {
      'pickup': 'Retiro en local',
      'delivery': 'Envío a domicilio'
    };
    return labels[type] || type;
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadSales();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onPageSizeChange(newSize: number): void {
    this.pageSize = newSize;
    this.currentPage.set(1);
    this.loadSales();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems() / this.pageSize);
  }
}