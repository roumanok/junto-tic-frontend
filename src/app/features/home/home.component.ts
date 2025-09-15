import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Observable, of, Subject } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { PLATFORM_ID } from '@angular/core';

import { HomeService } from './services/home.service';
import { CommunityService } from '../../core/services/community.service';
import { ListingService } from '../../core/services/listing.service';
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
export class HomeComponent implements OnInit, OnDestroy {
  listings: Listing[] = [];
  isLoading = false;
  error: string | null = null;
  
  private destroy$ = new Subject<void>();    
  private isBrowser: boolean;

  constructor(
    private homeService: HomeService,
    private listingService: ListingService,
    private community: CommunityService,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  ngOnInit(): void {
    //No dispares cargas en SSR
    if (!this.isBrowser) {
      return;
    }

    // Asegurá comunidad primero
    this.community.ensureLoaded()
      .then(() => {
        // Ya estamos en browser; ahora sí pedimos los destacados
        this.isLoading = true;
        this.listingService.getFeaturedListings(15, 'featured_first')
          .pipe(
            takeUntil(this.destroy$),
            catchError(err => {
              console.error('Error loading listings:', err);
              this.error = err?.message || 'Error al cargar los listados';
              this.isLoading = false;
              return of<Listing[]>([]);
            })
          )
          .subscribe(items => {
            this.listings = items;
            this.isLoading = false;
          });
      })
      .catch(err => {
        console.warn('No se pudo garantizar comunidad al iniciar:', err);
        // Podés optar por reintentar o dejar el estado vacío
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onListingClick(listing: Listing): void {
    console.log('Listing clicked:', listing);
    alert(`Navegando a: ${listing.title}`);
  }

  trackByListing(index: number, listing: Listing): string {
    return listing.id;
  }
}