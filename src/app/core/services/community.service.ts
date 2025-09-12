import { Injectable, signal, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Community } from '../models/community.model';
import { environment } from '../../../environments/environment';
import { ApiService } from './api.service';
import { HttpParams } from '@angular/common/http';
import { catchError, map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CommunityService {
  private _community = signal<Community | null>(null);
  readonly community = this._community;
  readonly isLoaded = computed(() => this._community() !== null);
  private detectedDomain = environment.cmDomain;

  private _loadPromise: Promise<void> | null = null;
  
  constructor(private apiService: ApiService) {}

  async loadFromDomain(): Promise<void> {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname.toLowerCase();
      
      // Extraer subdomain
      const parts = hostname.split('.');
      if (parts.length >= 3) {
        // Formato: subdomain.domain.com
        this.detectedDomain = parts[0];
      } else if (parts.length === 2) {
        // Formato: domain.com - usar dominio completo
        this.detectedDomain = hostname;
      }

      console.log('Detected domain:', this.detectedDomain);

      const params = new HttpParams()
      .set('domain', this.detectedDomain);

      const data = await firstValueFrom(
        this.apiService.getSimple<Community>('/communities/info', params)
      );

      if (!data?.id) throw new Error('No se pudo resolver comunidad');
      this._community.set(data);            
    }
  }

  getIdOrThrow(): string {
    const c = this._community();
    if (!c) throw new Error('Comunidad no disponible');
    return c.id;
  }

  getCdnUrl(): string {
    const c = this._community();
    if (!c) throw new Error('Comunidad no disponible');
    return c.cdn_domain;
  }

  getSlugOrNull(): string {
    const c = this._community();
    if (!c) throw new Error('Comunidad no disponible');
    return c.slug;
  }

  /** Devuelve toda la info o lanza error si aún no está disponible. */
  getInfoOrThrow(): Community {
    const c = this._community();
    if (!c) throw new Error('Comunidad no disponible');
    return c;
  }

  /** Vuelve a cargar desde el dominio, ignorando caché en memoria. */
  async reload(): Promise<void> {
    this._community.set(null);
    await this.loadFromDomain();
  }

  /**
   * Garantiza que la comunidad esté disponible.
   * Reusa la misma promesa si una carga ya está en curso.
   */
  ensureLoaded(): Promise<void> {
    if (this._community()) return Promise.resolve();
    if (!this._loadPromise) {
      this._loadPromise = this.loadFromDomain().finally(() => {
        // limpiar para permitir futuros reloads si hiciera falta
        this._loadPromise = null;
      });
    }
    return this._loadPromise;
  }
  
}