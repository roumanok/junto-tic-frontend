// src/app/features/my-listings/components/my-listings-mini-stats/my-listings-mini-stats.component.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { DashboardStats } from '../../../../core/models/listing.model';
import { ListingService } from '../../../../core/services/listing.service';
import { TranslatePipe } from 'src/app/shared/pipes/translate.pipe';

@Component({
  selector: 'app-my-listings-mini-stats',
  standalone: true,
  imports: [
    CommonModule,
    TranslatePipe,
    MatCardModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatButtonModule,
    MatTooltipModule
  ],
  templateUrl: './my-listings-mini-stats.component.html',
  styleUrl: './my-listings-mini-stats.component.scss'
})
export class MyListingsMiniStatsComponent implements OnInit {
  private listingsService = inject(ListingService);
  
  stats = signal<DashboardStats | null>(null);
  loading = signal<boolean>(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.loadStats();
  }

  private loadStats(): void {
    this.loading.set(true);
    this.error.set(null);
    
    this.listingsService.getDashboardStats(false).subscribe({
      next: (data) => {
        this.stats.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Error al cargar estadísticas');
        this.loading.set(false);
        console.error('Error loading mini stats:', err);
      }
    });
  }

  refresh(): void {
    this.loadStats();
  }

  hasLowStock(): boolean {
    return (this.stats()?.low_stock_count || 0) > 0;
  }

  hasNoStock(): boolean {
    return (this.stats()?.out_of_stock_listings || 0) > 0;
  }

  getformattedNumber(value: string | number): string{
    return this.listingsService.getformattedNumber(value);
  }
}