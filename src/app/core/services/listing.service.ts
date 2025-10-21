import { Injectable, inject, signal } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, map, tap, catchError, switchMap, of } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Listing, MyListing, DashboardStats } from '../models/listing.model';
import { CommunityService } from './community.service';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})

export class ListingService {

  private readonly community = inject(CommunityService);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private apiService =inject(ApiService);    
   
  private loading = signal(false);
  private error = signal<string | null>(null);  

  get isLoading() { return this.loading.asReadonly(); }
  get errorMessage() { return this.error.asReadonly(); }


  getFeaturedListings(limit = 15, strategy = ''): Observable<Listing[]> {
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

  generateSlugWithId(title: string, id: string): string {
    const baseSlug = title
      .toLowerCase()
      .normalize('NFD')                    // Descompone caracteres con tildes
      .replace(/[\u0300-\u036f]/g, '')     // Elimina las tildes
      .replace(/ñ/g, 'n')                  // Reemplaza ñ por n
      .replace(/[^a-z0-9 -]/g, '')         // Elimina caracteres especiales
      .replace(/\s+/g, '-')                // Espacios a guiones
      .replace(/-+/g, '-')                 // Múltiples guiones a uno solo
      .trim();                             // Quita espacios al inicio/fin
      
    // Formato: {slug}-lid-{id}
    return `${baseSlug}-lid-${id}`;
  }

  getformattedPrice(price: string | number): string {    
    return this ? parseInt(price as string).toLocaleString(environment.locale) : '0';
  }
  
  getformattedNumber(price: string | number): string {    
    return this ? parseInt(price as string).toLocaleString(environment.locale) : '0';
  }
  
  getMyListings(page: number = 1, limit: number = 10): Observable<any> {
    this.loading.set(true);
    this.error.set(null);

    const params = new HttpParams()
          .set('page', String(page))
          .set('limit', String(limit));
    
    return this.apiService.get<any>('/my-listings', params).pipe(
      map((response: any) => {
        let processedListings: MyListing[] = [];
        
        if (response.listings) {
          processedListings = response.listings.map(this.mapBackendToFrontend);
          return {
            listings: processedListings,
            pagination: response.pagination
          };
        } else if (Array.isArray(response)) {
          processedListings = response.map(this.mapBackendToFrontend);
          return {
            listings: processedListings,
            pagination: { total: processedListings.length }
          };
        }
        
        return { listings: [] as MyListing[], pagination: { total: 0 } };
      }),
      tap(() => this.loading.set(false)),
      catchError((error) => {
        this.loading.set(false);
        this.error.set('Error al cargar tus publicaciones');
        console.error('Error getting my listings:', error);
        throw error;
      })
    );
  }

  getMyListingsStats(): Observable<any> {
    return this.apiService.get<any>('/listings/my-stats').pipe(
      catchError((error) => {
        console.error('Error getting listings stats:', error);
        return of({ total: 0, active: 0, inactive: 0, draft: 0 });
      })
    );
  }

  updateListing(id: string, updates: Partial<MyListing>): Observable<MyListing> {
    return this.apiService.put<any>(`/my-listings/${id}/`, updates).pipe(
      map(this.mapBackendToFrontend),
      tap(() => {
        //console.log('Publicación actualizada exitosamente');
      }),
      catchError((error) => {
        console.error('Error updating listing:', error);
        throw error;
      })
    );
  }

  deleteListing(id: string): Observable<void> {
    return this.apiService.delete<void>(`/my-listings/${id}/`).pipe(
      tap(() => {
        //console.log('Publicación eliminada exitosamente');
      }),
      catchError((error) => {
        console.error('Error deleting listing:', error);
        throw error;
      })
    );
  }

  getListing(id: string): Observable<any> {
    return this.apiService.get<any>(`/my-listings/${id}`).pipe(
      tap(() => {
        //console.log('Listing cargado');
      }),
      catchError((error) => {
        console.error('Error getting listing:', error);
        throw error;
      })
    );
  }
  
  getListingById(listingId: string): Observable<any> {
    return this.apiService.get<any>(`/my-listings/${listingId}`).pipe(
      catchError((error) => {
        console.error('Error getting listings stats:', error);        
        return of(null);
      })
    );
  }

  toggleListingStatus(id: string, active: boolean): Observable<any> {
    return this.apiService.put<any>(`/stock/${id}/status`, { 
      is_active: active
    }).pipe(
      tap(() => {
        //console.log(`Publicación ${active ? 'activada' : 'desactivada'}`);
      }),
      catchError((error) => {
        console.error('Error toggling listing status:', error);
        throw error;
      })
    );
  }

  updateStock(id: string, newStock: number): Observable<any> {
    return this.apiService.post<any>(`/stock/${id}/adjust`, { 
      new_quantity: newStock,
      reason: "Actualización manual desde panel de advertiser"
    }).pipe(
      tap(() => {
        //console.log('Stock actualizado exitosamente');
      }),
      catchError((error) => {
        console.error('Error updating stock:', error);
        throw error;
      })
    );
  }

  addStock(id: string, quantity: number): Observable<any> {
    return this.apiService.post<any>(`/stock/${id}/add`, { 
      quantity: quantity,
      reason: "Reposición de stock desde panel de advertiser"
    }).pipe(
      tap(() => {
        //console.log('Stock agregado exitosamente');
      }),
      catchError((error) => {
        console.error('Error adding stock:', error);
        throw error;
      })
    );
  }

  getMyDeliveryMethods(): Observable<any[]> {
    return this.apiService.getSimpleList<any[]>('/delivery-methods/my').pipe(
      tap(() => {
        //console.log('Métodos de entrega cargados');
      }),
      catchError((error) => {
        console.error('Error getting delivery methods:', error);
        throw error;
      })
    );
  }

  createListing(listingData: any): Observable<any> {
    return this.apiService.post<any>('/my-listings/', listingData).pipe(
      tap(() => {
        //console.log('Publicación creada exitosamente');
      }),
      catchError((error) => {
        console.error('Error creating listing:', error);
        throw error;
      })
    );
  }

  getDashboardStats(forceRefresh: boolean = false): Observable<DashboardStats> {
    const params = new HttpParams()
      .set('refresh', forceRefresh ? '1': '0');      

    return this.apiService.getSimple<DashboardStats>('/my-listings/dashboard-stats', params).pipe(
      tap((stats) => {
        const source = forceRefresh ? '(refreshed)' : '(cached)';
        //console.log(`Dashboard stats cargadas ${source}:`, stats);
      }),
      catchError((error) => {
        console.error('Error getting dashboard stats:', error);
        throw error;
      })
    );
  }

  private mapBackendToFrontend = (item: any): MyListing => {
    return {
      id: item.id,
      title: item.title,
      description: item.short_description || item.description,
      price: parseFloat(item.price),
      list_price: item.list_price ? parseFloat(item.list_price) : undefined,
      stock: item.stock_quantity || 0,
      total_sold: item.total_sold || 0,
      status: item.is_active ? 'active' : 'inactive',
      type: item.type || 'product',
      image_url: item.primary_image?.image_url,
      created_at: item.created_at,
      updated_at: item.updated_at
    };
  }

  setLoading(loading: boolean): void {
    this.loading.set(loading);
  }

  setError(error: string | null): void {
    this.error.set(error);
  }

  clearError(): void {
    this.error.set(null);
  }

}