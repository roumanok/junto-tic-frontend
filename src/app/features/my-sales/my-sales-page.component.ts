import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { OrderService } from '../../core/services/order.service';
import { BreadcrumbComponent, BreadcrumbItem } from 'src/app/shared/components/breadcrumb/breadcrumb.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorStateComponent } from 'src/app/shared/components/error-state/error-state.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { PageHeaderComponent } from 'src/app/shared/components/page-header/page-header.component';
import { MySalesMiniStatsComponent } from './components/my-sales-mini-stats/my-sales-mini-stats.component';
import { PaginationComponent } from 'src/app/shared/components/pagination/pagination.component';
import { TranslatePipe } from 'src/app/shared/pipes/translate.pipe';
import { ListingService } from 'src/app/core/services/listing.service';
import { CdnService } from 'src/app/core/services/cdn.service';
import { I18nService } from 'src/app/core/services/i18n.service';
import { SeoService } from 'src/app/core/services/seo.service';
import { Sale } from '../../core/models/order.model';

@Component({
  selector: 'app-my-sales-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSnackBarModule,
    PaginationComponent,
    BreadcrumbComponent,    
    LoadingSpinnerComponent,
    ErrorStateComponent,
    EmptyStateComponent,
    PageHeaderComponent,
    MySalesMiniStatsComponent,
    TranslatePipe
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
    this.error.set(null);
    
    this.orderService.getMySales(this.currentPage(), this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.sales.set(response.sales || []);
          this.totalItems.set(response.pagination?.total || 0);
          this.loading.set(false);          
        },
        error: (error) => {          
          console.error('Error cargando ventas:', error);
          this.error.set(this.i18n.t('PAGES.MY_SALES.LOADING_ERROR'));          
          this.loading.set(false);
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
    return this.orderService.formatDate(dateString);
  }

  formatPrice(price: string | number): string {
    return this.listingService.getformattedPrice(price);
  }

  getStatusClass(status: string): string {
    return `status-${status.toLowerCase()}`;
  }

  getStatusLabel(status: string): string {
    return this.orderService.getStatusLabel(status);
  }

  getPaymentStatusLabel(paymentStatus: string): string {
    return this.orderService.getPaymentStatusLabel(paymentStatus);
  }

  viewOrderDetail(orderId: string): void {
    this.router.navigate(['/mi-cuenta/mis-ventas/orden', orderId]);
  }

  getCdnUrl(imagePath?: string): string {
    if (!imagePath) return '/placeholder.png';
    return this.cdnService.getCdnUrl(imagePath);
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