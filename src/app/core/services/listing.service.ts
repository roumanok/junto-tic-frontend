import { Injectable, inject, signal } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, of, map, finalize, catchError, switchMap, from, defer } from 'rxjs';
import { ApiService } from '../../core/services/api.service';
import { Listing } from '../models/listing.model';
import { CommunityService } from './community.service';


interface ApiResponse<T> {
  items?: T;
}

interface FeaturedResponse {
  items: Listing[];
}

function unwrap<T>(r: ApiResponse<T> | T): T {
  // adapta si tu ApiResponse usa otra clave
  return (r as ApiResponse<T>)?.items
      ?? (r as T);
}

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
  
  /** Espera a que haya comunidad y ejecuta la llamada */
  private withCommunity<T>(fn: (communityId: string) => Observable<T>): Observable<T> {
    return defer(() => from(this.communityService.ensureLoaded())).pipe(
      switchMap(() => fn(this.communityService.getIdOrThrow()))
    );
  }

  // Signals para manejo de estado
  private loading = signal(false);
  private error = signal<string | null>(null);  

  // Getters públicos para los signals
  get isLoading() { return this.loading.asReadonly(); }
  get errorMessage() { return this.error.asReadonly(); }

  getFeaturedListings(limit = 15, strategy = ''): Observable<Listing[]> {
    this.loading.set(true);
    this.error.set(null);

    const params = new HttpParams()
      .set('page', '1')
      .set('limit', String(limit))
      .set('strategy', strategy);

    return this.withCommunity<Listing[]>(id =>
      // OBLIGATORIO: tipar el GET para que el stream sea FeaturedResponse
      this.apiService
        .get<FeaturedResponse>(`/communities/${id}/listings/featured`, params)
        .pipe(          
          map((res) => unwrap<FeaturedResponse>(res).items),

          // mantener el tipo del stream: siempre devolvemos Listing[]
          catchError(err => {
            console.error('❌ Error en featured listings:', err);
            this.error.set('No se pudieron cargar los destacados');
            return of<Listing[]>([]);
          }),

          finalize(() => this.loading.set(false)),
        )
    );
  }

  
}