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
import { HighlightsComponent } from './components/highlights/highlights.component';
import { FeaturedCategoriesComponent } from './components/featured-categories/featured-categories.component';
import { CarouselComponent } from '../../shared/components/carousel/carousel.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    HighlightsComponent,
    ListingCardComponent,
    FeaturedCategoriesComponent,
    CarouselComponent
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit, OnDestroy {
  newestListings: Listing[] = [];
  offerListings: Listing[] = [];
  error: string | null = null;
  
  private destroy$ = new Subject<void>();    
  private isBrowser: boolean;  

  constructor(
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
        this.listingService.getFeaturedListings(15, 'newest_first')
          .pipe(
            takeUntil(this.destroy$),
            catchError(err => {
              console.error('Error loading listings:', err);
              this.error = err?.message || 'Error al cargar los listados';
              return of<Listing[]>([]);
            })
          )
          .subscribe(items => {
            this.newestListings = items;            
          });
        this.listingService.getFeaturedListings(15, 'offers_first')
          .pipe(
            takeUntil(this.destroy$),
            catchError(err => {
              console.error('Error loading listings:', err);
              this.error = err?.message || 'Error al cargar los listados';
              return of<Listing[]>([]);
            })
          )
          .subscribe(items => {
            this.offerListings = items;            
          });
      })
      .catch(err => {
        console.warn('No se pudo garantizar comunidad al iniciar:', err);                
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
}