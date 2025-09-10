import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, take } from 'rxjs/operators';

import { ApiService } from '../../../core/services/api.service';
import { CommunityService } from '../../../core/services/community.service';
import { Listing } from '../../../core/models/listing.model';
import { MOCK_LISTINGS } from './mock-data';

@Injectable({
  providedIn: 'root'
})
export class HomeService {
  private communityId = '550e8400-e29b-41d4-a716-446655440001'; // Hardcoded para evitar loops

  constructor(
    private apiService: ApiService,
    private communityService: CommunityService
  ) {}

  getHomeListings(limit: number = 15): Observable<Listing[]> {
    console.log('HomeService: Getting real listings from API');
    
    const params = new HttpParams()
      .set('page', '1')
      .set('limit', limit.toString())
      .set('strategy', 'featured_first');

    const endpoint = `/communities/${this.communityId}/listings/featured`;
    
    return this.apiService.get<Listing[]>(endpoint, params).pipe(
      map(response => {
        console.log('API Response:', response);
        return response.data || [];
      }),
      catchError(error => {
        console.error('API call failed, using mock data:', error);
        // Fallback a datos mock si falla la API
        return of(MOCK_LISTINGS.slice(0, limit));
      })
    );
  }

  getFeaturedListings(limit: number = 10): Observable<Listing[]> {
    const params = new HttpParams()
      .set('page', '1')
      .set('limit', limit.toString())
      .set('strategy', 'featured_only');

    const endpoint = `/communities/${this.communityId}/listings/featured`;
    
    return this.apiService.get<Listing[]>(endpoint, params).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('API call failed, using mock data:', error);
        return of(MOCK_LISTINGS.slice(0, limit));
      })
    );
  }

  getCategories(): Observable<any[]> {
    const endpoint = `/communities/${this.communityId}/categories`;
    
    return this.apiService.get<any[]>(endpoint).pipe(
      map(response => response.data || []),
      catchError(error => {
        console.error('Categories API failed, using mock data:', error);
        return of([
          { id: 'indumentaria', name: 'Indumentaria', slug: 'indumentaria' },
          { id: 'accesorios', name: 'Accesorios', slug: 'accesorios' },
          { id: 'servicios', name: 'Servicios', slug: 'servicios' }
        ]);
      })
    );
  }
}