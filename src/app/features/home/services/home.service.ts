import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, take, finalize } from 'rxjs/operators';

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

  private isLoading = false;

  getHomeListings(limit: number = 15): Observable<Listing[]> {
    if (this.isLoading) {
      console.log('⚠️ Already loading, skipping...');
      return of([]);
    }
    this.isLoading = true;
    console.log('🚀 HomeService: Starting API call');    
    /*
    return of(MOCK_LISTINGS.slice(0, limit)).pipe(
      take(1)
    );
    */

    const params = new HttpParams()
      .set('page', '1')
      .set('limit', limit.toString())
      .set('strategy', 'featured_first');

    const endpoint = `/communities/${this.communityId}/listings/featured`;
    console.log('📡 Calling endpoint:', endpoint);
    
    return this.apiService.get<Listing[]>(endpoint, params).pipe(
      take(1),
      map(response => {
        console.log('✅ API Response received:', response);
        return response.items || [];
      }),
      catchError(error => {
        console.log('❌ API Error caught:', error);
        console.error('API call failed, using mock data:', error);
        // Fallback a datos mock si falla la API
        return of(MOCK_LISTINGS.slice(0, limit));
      }),
      finalize(() => {
        //console.log('🏁 Finalize called, resetting isLoading');
        this.isLoading = false;
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
      map(response => response.items || []),
      catchError(error => {
        console.error('API call failed, using mock data:', error);
        return of(MOCK_LISTINGS.slice(0, limit));
      })
    );
  }

  getCategories(): Observable<any[]> {
    const endpoint = `/communities/${this.communityId}/categories`;
    
    return this.apiService.get<any[]>(endpoint).pipe(
      map(response => response.items || []),
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