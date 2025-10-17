import { Injectable } from '@angular/core';
import { Observable, switchMap } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { CommunityService } from '../../../core/services/community.service';
import { Listing, ListingDetail } from '../../../core/models/listing.model';

@Injectable({
  providedIn: 'root'
})
export class ListingDetailService {
  
  constructor(
    private apiService: ApiService,
    private communityService: CommunityService
  ) {}

  getListingById(listingId: string): Observable<ListingDetail> {
    return this.communityService.waitForId$().pipe(
      switchMap(communityId => {
        const endpoint = `/communities/${communityId}/listings/${listingId}`;
        return this.apiService.getSimple<ListingDetail>(endpoint);
      })
    );
  }

  getRelatedListings(listingId: string, limit: number = 4): Observable<Listing[]> {    
    /* No hay endpoint específico para listings relacionados,
       así que usamos los listings destacados de la comunidad
       y filtramos el listing actual. */
    return this.communityService.waitForId$().pipe(
      switchMap(communityId => {
        const endpoint = `/communities/${communityId}/listings/featured`;
        return this.apiService.get<Listing[]>(endpoint);
      }),
      switchMap(response => {        
        const filtered = (response.items || [])
          .filter(listing => listing.id !== listingId)
          .slice(0, limit);
        return [filtered];
      })
    );
  }
}