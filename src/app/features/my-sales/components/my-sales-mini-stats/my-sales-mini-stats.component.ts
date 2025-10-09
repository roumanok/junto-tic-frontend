import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ListingService } from 'src/app/core/services/listing.service';
import { TranslatePipe } from 'src/app/shared/pipes/translate.pipe';

interface SalesStats {
  total_sales: number;
  estimated_revenue: number;
  inventory_value: number;
  average_price: number;
}

@Component({
  selector: 'app-my-sales-mini-stats',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatTooltipModule,
    TranslatePipe
  ],
  templateUrl: './my-sales-mini-stats.component.html',
  styleUrl: './my-sales-mini-stats.component.css'
})
export class MySalesMiniStatsComponent implements OnInit {
  stats = signal<SalesStats | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  private listingService = inject(ListingService);

  ngOnInit(): void {
    this.loadStats();
  }

  private loadStats(): void {
    this.loading.set(true);
    this.listingService.getDashboardStats(false).subscribe({
      next: (stats) => {
        this.stats.set({
          total_sales: stats.total_sales || 0,
          estimated_revenue: stats.estimated_revenue || 0,
          inventory_value: stats.inventory_value || 0,
          average_price: stats.average_price || 0
        });
        this.loading.set(false);
        console.log('✅ Sales stats cargadas:', stats);
      },
      error: (error) => {
        console.error('❌ Error cargando stats:', error);
        this.error.set('Error al cargar estadísticas');
        this.loading.set(false);
      }
    });
  }

  refresh(): void {
    this.error.set(null);
    this.listingService.getDashboardStats(true).subscribe({
      next: (stats) => {
        this.stats.set({
          total_sales: stats.total_sales || 0,
          estimated_revenue: stats.estimated_revenue || 0,
          inventory_value: stats.inventory_value || 0,
          average_price: stats.average_price || 0
        });
        this.loading.set(false);
      },
      error: (error) => {
        console.error('❌ Error refrescando stats:', error);
        this.error.set('Error al cargar estadísticas');
        this.loading.set(false);
      }
    });
  }

  getformattedNumber(value: string | number): string{
    return this.listingService.getformattedNumber(value);
  }

  getformattedPrice(value: string |number): string {
    return this.listingService.getformattedPrice(value);
  }
}