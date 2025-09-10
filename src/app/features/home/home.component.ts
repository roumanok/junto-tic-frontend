import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { HomeService } from './services/home.service';
import { Listing } from '../../core/models/listing.model';
import { ListingCardComponent } from '../../shared/components/listing-card/listing-card-component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    ListingCardComponent
  ],
  template: `
    <div class="home-page">
      <section class="hero">
        <div class="hero-container">
          <h1>Bienvenido a Junto a TIC</h1>
          <p>Conectamos comunidades con sus emprendedores locales</p>
        </div>
      </section>
      
      <section class="listings-section">
        <div class="container">
          <h2>Productos y Servicios Destacados</h2>
          
          <!-- Loading state -->
          <div *ngIf="isLoading" class="loading">
            <p>Cargando productos...</p>
          </div>
          
          <!-- Error state -->
          <div *ngIf="error" class="error">
            <p>{{ error }}</p>
            <button (click)="loadListings()" class="btn-retry">Reintentar</button>
          </div>
          
          <!-- Listings grid -->
          <div *ngIf="!isLoading && !error && listings && listings.length > 0" class="listings-grid">
            <app-listing-card
              *ngFor="let listing of listings; trackBy: trackByListing"
              [listing]="listing"
              (cardClick)="onListingClick($event)"
              (viewMore)="onListingClick($event)">
            </app-listing-card>
          </div>
          
          <!-- Empty state -->
          <div *ngIf="!isLoading && !error && listings && listings.length === 0" class="empty-state">
            <p>No hay productos disponibles en este momento</p>
          </div>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .hero {
      background: linear-gradient(135deg, #4A90A4 0%, #2C5F6F 100%);
      color: white;
      padding: 4rem 0;
      text-align: center;
    }
    
    .hero-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 2rem;
    }
    
    .hero h1 {
      font-size: 3rem;
      margin-bottom: 1rem;
      font-weight: 700;
    }
    
    .hero p {
      font-size: 1.2rem;
      opacity: 0.9;
    }
    
    .listings-section {
      padding: 4rem 0;
      background: #f8f9fa;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 2rem;
    }
    
    .container h2 {
      text-align: center;
      margin-bottom: 3rem;
      font-size: 2.5rem;
      color: #333;
    }
    
    .listings-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 2rem;
    }
    
    .loading, .error, .empty-state {
      text-align: center;
      padding: 3rem;
    }
    
    .btn-retry {
      background: #4A90A4;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      transition: all 0.3s ease;
    }
    
    .btn-retry:hover {
      background: #2C5F6F;
      transform: translateY(-2px);
    }
    
    @media (max-width: 768px) {
      .hero h1 {
        font-size: 2rem;
      }
      
      .listings-grid {
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 1.5rem;
      }
    }
    
    @media (max-width: 480px) {
      .listings-grid {
        grid-template-columns: 1fr;
        gap: 1rem;
      }
    }
  `]
})
export class HomeComponent implements OnInit {
  listings: Listing[] = [];
  isLoading = false;
  error: string | null = null;

  constructor(private homeService: HomeService) {}

  ngOnInit(): void {
    this.loadListings();
  }

  loadListings(): void {
    this.isLoading = true;
    this.error = null;

    this.homeService.getHomeListings(15).pipe(
      catchError(error => {
        console.error('Error loading listings:', error);
        this.error = 'No se pudieron cargar los productos.';
        return of([]);
      })
    ).subscribe({
      next: (listings) => {
        console.log('Listings loaded:', listings);
        this.listings = listings || [];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Subscribe error:', error);
        this.error = 'Error inesperado al cargar productos.';
        this.isLoading = false;
        this.listings = [];
      }
    });
  }

  onListingClick(listing: Listing): void {
    console.log('Listing clicked:', listing);
    alert(`Navegando a: ${listing.title}`);
  }

  trackByListing(index: number, listing: Listing): string {
    return listing.id;
  }
}