import { Injectable } from '@angular/core';
import { Observable, switchMap } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { ApiService, ApiPaginatedResponse } from '../../../core/services/api.service';
import { CommunityService } from '../../../core/services/community.service';
import { Listing } from '../../../core/models/listing.model';

export interface SearchFilters {
  category_id?: string;
  min_price?: number;
  max_price?: number;
  page?: number;
  limit?: number;
}

export interface SearchResult {
  items: Listing[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
  query: string;
  filters?: SearchFilters;
}

@Injectable({
  providedIn: 'root'
})
export class SearchService {
  
  constructor(
    private apiService: ApiService,
    private communityService: CommunityService
  ) {}

  searchListings(searchTerm: string, filters: SearchFilters = {}): Observable<SearchResult> {
    return this.communityService.waitForId$().pipe(
      switchMap(communityId => {
        let params = new HttpParams()
          .set('q', searchTerm)
          .set('page', (filters.page || 1).toString())
          .set('limit', (filters.limit || 15).toString());

        // Agregar filtros opcionales
        if (filters.category_id) {
          params = params.set('category_id', filters.category_id);
        }
        if (filters.min_price !== undefined) {
          params = params.set('min_price', filters.min_price.toString());
        }
        if (filters.max_price !== undefined) {
          params = params.set('max_price', filters.max_price.toString());
        }

        const endpoint = `/communities/${communityId}/listings/search`;
        
        return this.apiService.getPaginated<Listing>(endpoint, params);
      }),
      switchMap(response => {
        const result: SearchResult = {
          items: response.items,
          pagination: response.pagination,
          query: searchTerm,
          filters
        };
        return [result];
      })
    );
  }

  getSearchSuggestions(query: string): Observable<string[]> {
    /* NO IMPLEMENTADA */
    if (query.length < 2) {
      return new Observable(observer => observer.next([]));
    }

    return this.communityService.waitForId$().pipe(
      switchMap(communityId => {
        const params = new HttpParams()
          .set('q', query)
          .set('limit', '5');

        const endpoint = `/communities/${communityId}/listings/search/suggestions`;
        
        return this.apiService.getSimpleList<string>(endpoint, params);
      })
    );
  }
}