import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { switchMap, map } from 'rxjs/operators';
import { ApiPaginatedResponse, ApiService } from './api.service';
import { CommunityService } from './community.service';
import { Listing } from '../models/listing.model';
import { Advertiser } from '../models/advertiser.model';

@Injectable({
  providedIn: 'root'
})
export class AdvertiserService {
  private apiService = inject(ApiService);
  private communityService = inject(CommunityService);

  /**
   * Obtiene los anunciantes destacados de la comunidad
   */
  getFeaturedAdvertisers(): Observable<Advertiser[]> {
    return this.communityService.waitForId$().pipe(
      switchMap((communityId: string) => {
        const endpoint = `/communities/${communityId}/advertisers/`; //Cambiar por endpoint de destacados
        return this.apiService.getPaginated<Advertiser>(endpoint);
      }),
      map((response) => response.items || [])
    );
  }

  /**
   * Obtiene todos los anunciantes de la comunidad
   */
  getAllAdvertisers(): Observable<Advertiser[]> {
    return this.communityService.waitForId$().pipe(
      switchMap((communityId: string) => {
        const endpoint = `/communities/${communityId}/advertisers`;
        return this.apiService.getPaginated<Advertiser>(endpoint);
      }),
      map((response) => response.items || [])
    );
  }

  /**
   * Obtiene un anunciante por su ID
   */
  getAdvertiserById(advertiserId: string): Observable<Advertiser> {
    return this.communityService.waitForId$().pipe(
      switchMap((communityId: string) => {
        const endpoint = `/communities/${communityId}/advertisers/${advertiserId}`;
        return this.apiService.getSimple<Advertiser>(endpoint);
      })
    );
  }

  getAdvertiserListings(advertiserId: string, page: number = 1, itemsPerPage: number = 12): Observable<ApiPaginatedResponse<Listing>> {
    return this.communityService.waitForId$().pipe(
      switchMap((communityId: string) => {
          const endpoint = `/communities/${communityId}/advertisers/${advertiserId}/listings`;
          const params = new HttpParams()
          .set('page', page.toString())
          .set('limit', itemsPerPage);
          return this.apiService.getPaginated<Listing>(endpoint, params);
      })
    );
  }
}