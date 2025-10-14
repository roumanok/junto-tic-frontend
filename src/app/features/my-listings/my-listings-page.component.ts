// src/app/features/my-listings/pages/my-listings-page/my-listings-page.component.ts
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
    MyListingsMiniStatsComponent
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
  listings = signal<MyListing[]>([]);
  totalItems = signal(0);
  currentPage = signal(1);
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
  
  private loadMyListings() {
    this.loading.set(true);
    
    this.listingService.getMyListings(this.currentPage(), this.pageSize)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.listings.set(response.listings || response);
          this.totalItems.set(response.pagination?.total || 0);
          this.loading.set(false);

          this.setupSEO();
          
          console.log('✅ Artículos cargados:', response);
        },
        error: (error) => {
          this.loading.set(false);
          console.error('❌ Error cargando artículos:', error);
          this.snackBar.open('Error al cargar artículos', 'Cerrar', {
            duration: 4000
          });
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

  onPageChange(event: PageEvent): void {
    this.currentPage.set(event.pageIndex + 1);
    this.pageSize = event.pageSize;
    this.loadMyListings();
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
    const actionCapitalized = isActive ? 'Inactivar' : 'Activar';
    
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: `${actionCapitalized} artículo`,
        message: `¿Está seguro que desea ${action} el artículo?`,
        confirmText: actionCapitalized,
        cancelText: 'Cancelar',
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
              
              const statusText = !isActive ? 'activado' : 'inactivado';
              this.snackBar.open(`Artículo ${statusText}`, 'Cerrar', { duration: 2000 });
            },
            error: (error) => {
              console.error('Error cambiando estado:', error);
              this.snackBar.open('Error al cambiar el estado', 'Cerrar', { duration: 3000 });
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
                `Se agregaron ${quantity} unidades. Stock actual: ${listing.stock + quantity}`,
                'Cerrar',
                { duration: 3000 }
              );
            },
            error: (error) => {
              console.error('Error agregando stock:', error);
              this.snackBar.open('Error al agregar stock', 'Cerrar', { duration: 3000 });
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
                `Stock actualizado a ${newStock} unidades`,
                'Cerrar',
                { duration: 3000 }
              );
            },
            error: (error) => {
              console.error('Error actualizando stock:', error);
              this.snackBar.open('Error al actualizar stock', 'Cerrar', { duration: 3000 });
            }
          });
      }
    });
  }

  deleteListing(listing: MyListing) {
    // Verificar si tiene ventas
    if (listing.total_sold && listing.total_sold > 0) {
      this.snackBar.open(
        'No se puede eliminar un artículo con ventas',
        'Cerrar',
        { duration: 4000 }
      );
      return;
    }

    // Mostrar confirmación
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Eliminar artículo',
        message: '¿Está seguro que desea eliminar este artículo? Esta acción no se puede deshacer.',
        confirmText: 'Eliminar',
        cancelText: 'Cancelar',
        confirmColor: 'warn'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.listingService.deleteListing(listing.id)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: () => {
              // Remover el artículo de la lista local
              const updatedListings = this.listings().filter(l => l.id !== listing.id);
              this.listings.set(updatedListings);
              this.totalItems.set(this.totalItems() - 1);
              
              this.snackBar.open('Artículo eliminado correctamente', 'Cerrar', { duration: 3000 });
            },
            error: (error) => {
              console.error('Error eliminando artículo:', error);
              this.snackBar.open('Error al eliminar el artículo', 'Cerrar', { duration: 3000 });
            }
          });
      }
    });
  }
}