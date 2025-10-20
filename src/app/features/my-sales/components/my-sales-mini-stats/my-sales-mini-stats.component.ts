import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ListingService } from 'src/app/core/services/listing.service';
import { I18nService } from 'src/app/core/services/i18n.service';
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
  private i18n = inject(I18nService);

  ngOnInit(): void {
    this.loadStats();
  }
  
  private loadStats(forceRefresh = false): void {
    this.loading.set(true);
    this.error.set(null);

    this.listingService.getDashboardStats(forceRefresh).subscribe({
      next: (data) => {
        this.stats.set(data);
        this.loading.set(false);        
      },
      error: (error) => {
        console.error('Error cargando stats:', error);
        this.error.set(this.i18n.t('PAGES.MY_SALES.STATS.LOADING_ERROR'));
        this.loading.set(false);
      }
    });
  }

  refresh(): void {
    this.loadStats(true);
  }

  getformattedNumber(value: string | number): string{
    return this.listingService.getformattedNumber(value);
  }

  getformattedPrice(value: string |number): string {
    return this.listingService.getformattedPrice(value);
  }
}