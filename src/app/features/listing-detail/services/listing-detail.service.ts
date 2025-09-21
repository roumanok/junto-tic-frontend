import { Injectable } from '@angular/core';
import { Observable, switchMap } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { CommunityService } from '../../../core/services/community.service';
import { Listing } from '../../../core/models/listing.model';

export interface ListingDetail {
  id: string;
  public_token: string;
  title: string;
  short_description?: string;
  long_description?: string;
  price: string;
  list_price?: string;
  type: 'product' | 'service';
  max_quantity_per_order: number;
  stock_quantity: number;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  images: ListingImage[];
  advertiser: {
    id: string;
    name: string;
    slug: string;
    logo_url?: string;
  };
  category: {
    id: string;
    name: string;
    slug: string;
    description?: string;
    parent_id?: string;
    icon_url?: string;
    is_featured?: boolean;
    sort_order: number;
  };
  delivery_methods?: DeliveryMethod[];
}

export interface ListingImage {
  id: string;
  image_url: string;
  alt_text?: string;
  is_primary: boolean;
  sort_order: number;
}

export interface DeliveryMethod {
  id: string;
  type: 'pickup' | 'delivery';
  name: string;
  description?: string;
  cost: string;
  address?: string;
}

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
    return this.communityService.waitForId$().pipe(
      switchMap(communityId => {
        // Como no tenemos endpoint específico de relacionados, 
        // podemos usar el de featured y filtrar (temporal)
        const endpoint = `/communities/${communityId}/listings/featured`;
        return this.apiService.get<Listing[]>(endpoint);
      }),
      switchMap(response => {
        // Filtrar el listing actual y tomar solo el límite
        const filtered = (response.items || [])
          .filter(listing => listing.id !== listingId)
          .slice(0, limit);
        return [filtered];
      })
    );
  }
}