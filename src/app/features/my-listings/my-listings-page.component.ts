import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { ListingService } from '../../core/services/listing.service';
import { BreadcrumbComponent, BreadcrumbItem } from 'src/app/shared/components/breadcrumb/breadcrumb.component';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { ErrorStateComponent } from 'src/app/shared/components/error-state/error-state.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { PageHeaderComponent } from 'src/app/shared/components/page-header/page-header.component';
import { PaginationComponent } from 'src/app/shared/components/pagination/pagination.component';
import { MyListing } from '../../core/models/listing.model';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MyListingsMiniStatsComponent } from './components/my-listings-mini-stats/my-listings-mini-stats.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { StockDialogComponent, StockDialogData } from '../../shared/components/stock-dialog/stock-dialog.component';
import { TranslatePipe } from 'src/app/shared/pipes/translate.pipe';
import { I18nService } from 'src/app/core/services/i18n.service';
import { SeoService } from 'src/app/core/services/seo.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-my-listings-page',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTableModule,
    MatMenuModule,
    MatChipsModule,
    MatTooltipModule,
    MatPaginatorModule,
    MatDividerModule,
    MatDialogModule,
    BreadcrumbComponent,
    LoadingSpinnerComponent,
    ErrorStateComponent,
    EmptyStateComponent,
    PageHeaderComponent,
    MyListingsMiniStatsComponent,
    PaginationComponent
  ],
  templateUrl: './my-listings-page.component.html',
  styleUrl: './my-listings-page.component.css'
})
export class MyListingsPageComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private authService = inject(AuthService);
  private listingService = inject(ListingService);
  private i18n = inject(I18nService);
  private seo = inject(SeoService);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog); 
  private destroy$ = new Subject<void>();

  breadcrumbItems: BreadcrumbItem[] = [];
  
  loading = signal(false);
  error = signal<string | null>(null);
  listings = signal<MyListing[]>([]);
  currentPage = signal(1);
  totalItems = signal(0);  
  pageSize = 10;

  displayedColumns: string[] = ['image', 'title', 'price', 'stock', 'sales', 'status', 'actions'];

  ngOnInit() {
    this.authService.checkAdvertiserAccess();
    this.buildBreadcrumbs();
    this.loadMyListings();
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  public loadMyListings() {
    this.loading.set(true);
    this.error.set(null);
    
    this.listingService.getMyListings(this.currentPage(), this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.listings.set(response.listings || response);
          this.totalItems.set(response.pagination?.total || 0);
          this.loading.set(false);
          this.setupSEO();
        },
        error: (error) => {          
          console.error('Error cargando artículos:', error);          
          this.error.set(this.i18n.t('PAGES.MY_LISTINGS.LOADING_ERROR'));          
          this.loading.set(false);
          this.listings.set([]);
        }
      });
  }

  private buildBreadcrumbs(): void {
    this.breadcrumbItems = [
      { label: this.i18n.t('COMMON.HOME'), url: '/' },
      { label: this.i18n.t('COMMON.MY_ACCOUNT'), url: '/mi-cuenta' },
      { label: this.i18n.t('COMMON.MY_LISTINGS'), url: '' }
    ];
  }

  private setupSEO(): void {
    const communityName = this.i18n.t('COMMUNITY.NAME');
    this.seo.setPageMeta(
      'PAGES.MY_LISTINGS.TITLE',
      'PAGES.MY_LISTINGS.DESCRIPTION',
      { communityName }
    );
  }

  getImageUrl(listing: MyListing): string {
    if (listing.image_url) {
      if (listing.image_url.startsWith('http')) {
        return listing.image_url;
      }
      return `${environment.cdnUrl}${listing.image_url}`;
    }
    return '/placeholder.png';
  }

  onImageError(event: any): void {
    event.target.src = '/placeholder.png';
  }

  isProduct(listing: MyListing): boolean {
    return listing.type === 'product';
  }

  getTypeIcon(listing: MyListing): string {
    return this.isProduct(listing) ? 'sell' : 'room_service';
  }

  getTypeLabel(listing: MyListing): string {
    return this.isProduct(listing) ? 'Producto' : 'Servicio';
  }

  getformattedPrice(price: string | number): string {    
    return this.listingService.getformattedPrice(price);
  }  

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadMyListings();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onPageSizeChange(newSize: number): void {
    this.pageSize = newSize;
    this.currentPage.set(1);
    this.loadMyListings();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems() / this.pageSize);
  }
  
  createNewListing() {
    this.router.navigate(['/mi-cuenta/mis-articulos/crear']);
  }
  
  viewListing(listing: MyListing) {
    const link = this.listingService.generateSlugWithId(listing.title || 'listing', listing.id)    
    const url = `/articulo/${link}`;
    window.open(url, '_blank');
  }
  
  editListing(id: string) {
    this.router.navigate(['/mi-cuenta/mis-articulos', id, 'editar']);
  }
  
  toggleStatus(listing: MyListing) {
    const isActive = listing.status === 'active';
    const action = isActive ? 'inactivar' : 'activar';
    const actionCapitalized = isActive ? this.i18n.t('PAGES.MY_LISTINGS.DEACTIVATE_LISTING') : this.i18n.t('PAGES.MY_LISTINGS.ACTIVATE_LISTING');
    const question = isActive ? this.i18n.t('PAGES.MY_LISTINGS.DEACTIVATE_LISTING_QUESTION') : this.i18n.t('PAGES.MY_LISTINGS.ACTIVATE_LISTING_QUESTION');
    
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: actionCapitalized,
        message: question,
        confirmText: actionCapitalized,
        cancelText: this.i18n.t('COMMON.CANCEL'),
        confirmColor: isActive ? 'warn' : 'primary'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Usuario confirmó, proceder con el cambio
        this.listingService.toggleListingStatus(listing.id, !isActive)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              const updatedListings = this.listings().map(l => 
                l.id === listing.id 
                  ? { ...l, status: (!isActive ? 'active' : 'inactive') as 'active' | 'inactive' }
                  : l
              );
              this.listings.set(updatedListings);
              const statusText = !isActive ? this.i18n.t('PAGES.MY_LISTINGS.ACTIVATE_LISTING_SUCCESS') : this.i18n.t('PAGES.MY_LISTINGS.DEACTIVATE_LISTING_SUCCESS');
              this.snackBar.open(statusText, this.i18n.t('COMMON.CLOSE'), { duration: 2000 });
            },
            error: (error) => {
              console.error('Error cambiando estado:', error);
              this.snackBar.open(this.i18n.t('PAGES.MY_LISTINGS.UPDATE_STATUS_ERROR'), this.i18n.t('COMMON.CLOSE'), { duration: 3000 });
            }
          });
      }
    });
  }

  addStock(listing: MyListing) {
    const dialogRef = this.dialog.open(StockDialogComponent, {
      width: '500px',
      data: {
        mode: 'add',
        currentStock: listing.stock,
        listingTitle: listing.title
      } as StockDialogData
    });

    dialogRef.afterClosed().subscribe(quantity => {
      if (quantity !== null && quantity !== undefined) {
        this.listingService.addStock(listing.id, quantity)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              // Actualizar el stock local
              const updatedListings = this.listings().map(l => 
                l.id === listing.id 
                  ? { ...l, stock: listing.stock + quantity }
                  : l
              );
              this.listings.set(updatedListings);
              
              this.snackBar.open(
                this.i18n.t('PAGES.MY_LISTINGS.ADD_STOCK_SUCCESS'),                
                this.i18n.t('COMMON.CLOSE'),
                { duration: 3000 }
              );
            },
            error: (error) => {
              console.error('Error agregando stock:', error);
              this.snackBar.open(this.i18n.t('PAGES.MY_LISTINGS.ADD_STOCK_ERROR'), this.i18n.t('COMMON.CLOSE'), { duration: 3000 });
            }
          });
      }
    });
  }

  updateStock(listing: MyListing) {
    const dialogRef = this.dialog.open(StockDialogComponent, {
      width: '500px',
      data: {
        mode: 'update',
        currentStock: listing.stock,
        listingTitle: listing.title
      } as StockDialogData
    });

    dialogRef.afterClosed().subscribe(newStock => {
      if (newStock !== null && newStock !== undefined && newStock !== listing.stock) {
        this.listingService.updateStock(listing.id, newStock)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              // Actualizar el stock local
              const updatedListings = this.listings().map(l => 
                l.id === listing.id 
                  ? { ...l, stock: newStock }
                  : l
              );
              this.listings.set(updatedListings);
              
              this.snackBar.open(
                this.i18n.t('PAGES.MY_LISTINGS.UPDATE_STOCK_SUCCESS'),                
                this.i18n.t('COMMON.CLOSE'),
                { duration: 3000 }
              );
            },
            error: (error) => {
              console.error('Error actualizando stock:', error);
              this.snackBar.open(this.i18n.t('PAGES.MY_LISTINGS.UPDATE_STOCK_ERROR'), this.i18n.t('COMMON.CLOSE'), { duration: 3000 });
            }
          });
      }
    });
  }

  deleteListing(listing: MyListing) {
    // Verificar si tiene ventas
    if (listing.total_sold && listing.total_sold > 0) {
      this.snackBar.open(
        this.i18n.t('PAGES.MY_LISTINGS.CANNOT_DELETE_SOLD_ITEM'),
        this.i18n.t('COMMON.CLOSE'),
        { duration: 4000 }
      );
      return;
    }

    // Mostrar confirmación
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: this.i18n.t('PAGES.MY_LISTINGS.DELETE_TITLE'),
        message: this.i18n.t('PAGES.MY_LISTINGS.DELETE_MESSAGE'),
        confirmText: this.i18n.t('COMMON.DELETE'),
        cancelText: this.i18n.t('COMMON.CANCEL'),
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.listingService.deleteListing(listing.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              const updatedListings = this.listings().filter(l => l.id !== listing.id);
              this.listings.set(updatedListings);
              this.totalItems.set(this.totalItems() - 1);

              this.snackBar.open(this.i18n.t('PAGES.MY_LISTINGS.DELETE_SUCCESS'), this.i18n.t('COMMON.CLOSE'), { duration: 3000 });
            },
            error: (error) => {
              console.error('Error eliminando artículo:', error);
              this.snackBar.open(this.i18n.t('PAGES.MY_LISTINGS.DELETE_ERROR'), this.i18n.t('COMMON.CLOSE'), { duration: 3000 });
            }
          });
      }
    });
  }
}