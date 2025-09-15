import { Injectable, inject, signal } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, map, tap, catchError, switchMap } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Listing } from '../models/listing.model';
import { CommunityService } from './community.service';


type FeaturedResponse = { items: Listing[] };

@Injectable({
  providedIn: 'root'
})

export class ListingService {

  constructor(
    private communityService: CommunityService
  ) {}

  private readonly community = inject(CommunityService);

  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private apiService =inject(ApiService);    
   
  // Signals para manejo de estado
  private loading = signal(false);
  private error = signal<string | null>(null);  

  // Getters públicos para los signals
  get isLoading() { return this.loading.asReadonly(); }
  get errorMessage() { return this.error.asReadonly(); }


  getFeaturedListings(limit = 15, strategy = ''): Observable<Listing[]> {
    console.log('Cargando destacados con limit=', limit, 'strategy=', strategy);

    return this.community.waitForId$().pipe(
      switchMap((communityId) => {
        const params = new HttpParams()
          .set('page', '1')
          .set('limit', String(limit))
          .set('strategy', strategy);
        return this.apiService.get(
          `/communities/${communityId}/listings/featured`,
          params 
        );
      }),
      map(res => res.items as Listing[]),     
      catchError((err) => {
        console.error('Error loading listings:', err);
        throw err;
      })
    );
  }
  
}