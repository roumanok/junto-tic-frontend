import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Observable, of, Subject } from 'rxjs';
import { catchError, takeUntil } from 'rxjs/operators';
import { PLATFORM_ID } from '@angular/core';

import { HomeService } from './services/home.service';
import { CommunityService } from '../../core/services/community.service';
import { ListingService } from '../../core/services/listing.service';
import { Listing } from '../../core/models/listing.model';
import { ListingCardComponent } from '../../shared/components/listing-card/listing-card.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    ListingCardComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
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