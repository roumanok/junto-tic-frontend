import { Injectable, inject, signal } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, of, map, tap, catchError } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { Listing } from '../models/listing.model';
import { CommunityService } from './community.service';


@Injectable({
  providedIn: 'root'
})
export class ListingService {

  constructor(
    private communityService: CommunityService
  ) {}

  private currentListingSubject = new BehaviorSubject<Listing | null>(null);
  public currentListing$ = this.currentListingSubject.asObservable();

  private apiService =inject(ApiService);        

  // Signals para manejo de estado
  private loading = signal(false);
  private error = signal<string | null>(null);  

  // Getters públicos para los signals
  get isLoading() { return this.loading.asReadonly(); }
  get errorMessage() { return this.error.asReadonly(); }

  getFeaturedListings(limit: number = 15, strategy: string = ''): Observable<Listing[]> {
    this.loading.set(true);
    this.error.set(null);      

    const community = this.communityService.getCurrentCommunity();
    const communityId = community?.id || 0;

    const params = new HttpParams()
      .set('page', '1')
      .set('limit', limit.toString())
      .set('strategy', strategy);    

    const endpoint = `/communities/${communityId}/listings/featured`;
    //console.log('📡 Calling endpoint:', endpoint);
    
    return this.apiService.get<Listing[]>(endpoint, params).pipe(      
      map(response => {        
        return response.items; //falta mapear primary image con la url de la cdn
      }),
      catchError(error => {
        console.log('❌ API Error caught:', error);
        console.error('API call failed, using mock data:', error);
        return of([]);
      }),
      tap(() => this.loading.set(false))
    );    
  }  
  
}