// src/app/core/services/category.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { CommunityService } from './community.service';
import { ApiService, ApiSimpleListResponse, ApiPaginatedResponse } from './api.service';
import { toObservable } from '@angular/core/rxjs-interop';
import { Category } from '../models/category.model';
import { Listing } from '../models/listing.model';
import { Observable, firstValueFrom } from 'rxjs';
import { switchMap, map, tap, distinctUntilChanged, catchError, take } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private readonly api = inject(ApiService);
  private readonly community = inject(CommunityService);

  // signals (null mientras no cargó)
  private _all = signal<Category[] | null>(null);
  private _featured = signal<Category[] | null>(null);

  // observables para templates
  readonly all$ : Observable<Category[]> = toObservable(this._all).pipe(
    map(v => v ?? []),
    distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
  );
  readonly featured$ : Observable<Category[]> = toObservable(this._featured).pipe(
    map(v => v ?? []),
    distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
  );

  /** Pre-carga categorías (todas) después de que haya comunidad */
  preloadAll(): Promise<void> {
    return firstValueFrom(
      this.community.waitForId$().pipe(
        switchMap(id => this.fetch(id, false)),
        tap(cats => this._all.set(cats)),
        catchError(err => {
          console.error('Category preloadAll error:', err);
          this._all.set([]);
          return [];
        }),
        map(() => void 0)
      )
    );
  }

  /** Pre-carga categorías destacadas (include_featured_only=true) */
  preloadFeatured(): Promise<void> {
    return firstValueFrom(
      this.community.waitForId$().pipe(
        switchMap(id => this.fetch(id, true)),
        tap(cats => this._featured.set(cats)),
        catchError(err => {
          console.error('Category preloadFeatured error:', err);
          this._featured.set([]);
          return [];
        }),
        map(() => void 0)
      )
    );
  }

  /** Obtiene productos de una categoría específica con paginación */
  getCategoryListings(categoryId: string, page: number = 1, limit: number = 20): Observable<ApiPaginatedResponse<Listing>> {
    return this.community.waitForId$().pipe(
      switchMap(communityId => {
        const params = new HttpParams()
          .set('page', page.toString())
          .set('limit', limit.toString());
        
        const endpoint = `/communities/${communityId}/listings/categories/${categoryId}/listings`;
        return this.api.getPaginated<Listing>(endpoint, params);
      })
    );
  }

    /** Asegura que las categorías estén cargadas */
  ensureCategoriesLoaded(): Promise<Category[]> {
    return new Promise((resolve) => {
      this.all$.pipe(take(1)).subscribe(categories => {
        if (categories.length === 0) {
          // Si no están cargadas, forzar la carga
          this.preloadAll().then(() => {
            this.all$.pipe(take(1)).subscribe(loadedCategories => {
              resolve(loadedCategories);
            });
          });
        } else {
          resolve(categories);
        }
      });
    });
  }

  /** Busca una categoría por slug */
  getCategoryBySlug(slug: string): Observable<Category | null> {
    return this.all$.pipe(
      map(categories => categories.find(cat => cat.slug === slug) || null)
    );
  }  

  /** Forzá recarga manual (p.ej. si cambia comunidad en runtime) */
  async refresh(): Promise<void> {
    this._all.set(null);
    this._featured.set(null);
    await Promise.all([this.preloadAll(), this.preloadFeatured()]);
  }

  // ---------- helpers ----------

  private fetch(communityId: string, featuredOnly: boolean): Observable<Category[]> {
    //console.log('CategoryService: fetching categories (featuredOnly=', featuredOnly, ') for community', communityId);
    const params = new HttpParams().set('include_featured_only', featuredOnly);     
    return this.api
      .getSimpleList<Category>(
        `/communities/${communityId}/listings/categories`, params
      )
      .pipe(
        map((res: ApiSimpleListResponse<Category>) => res)
      );
  }

}
