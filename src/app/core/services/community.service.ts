import { Injectable, Inject, signal, computed } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { Community } from '../models/community.model';
import { environment } from '../../../environments/environment';
import { ApiService } from './api.service';
import { HttpParams } from '@angular/common/http';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { catchError, map, tap, filter, shareReplay, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class CommunityService {
  private _community = signal<Community | null>(null);  
  readonly community = this._community;
  private readonly _community$ = toObservable(this.community);
  readonly isLoaded = computed(() => this._community() !== null);
  private detectedDomain = environment.cmDomain ?? null;

  private _loadPromise: Promise<void> | null = null;
  
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private apiService: ApiService
  ) {}

  readonly communityId$: Observable<string> = this._community$.pipe(
    map(c => c?.id ?? null),
    filter((id): id is string => !!id),
    shareReplay(1)
  );

  waitForId$(): Observable<string> {
    return this.communityId$.pipe(take(1));
  }

  get communityId(): string | null {
    return this._community()?.id ?? null;
  }

  async loadFromDomain(): Promise<void> {    
    const host = this.getHostSafe();
    console.log('Cargando comunidad desde dominio:', host);    

    if (!host) {
      return;
    }

    const params = new HttpParams().set('domain', host);

    const community = await firstValueFrom(
      this.apiService.getSimple('/communities/info', params).pipe(
        map(res => res as Community),
        tap(c => console.log('Comunidad resuelta:', c)),
        catchError((err) => { throw err; })
      )
    );

    this._community.set(community);

  }

  /**
   * Garantiza que la comunidad esté cargada (idempotente).
  */
  ensureLoaded(): Promise<void> {
    if (this._community()) return Promise.resolve();
    if (!this._loadPromise) {
      this._loadPromise = this.loadFromDomain()
        .catch((e) => {
          // No rompas el flujo: dejá que el cliente lo resuelva luego.
          console.warn('No se pudo resolver comunidad en este entorno:', e);
        })
        .finally(() => { this._loadPromise = null; });
    }
    return this._loadPromise;
  }

    /**
   * Hostname SSR-safe:
   * - Browser: window.location.hostname
   * - SSR: (si tuvieras REQUEST) this.req.headers.host.split(':')[0]
   * - Fallback: environment.cmDomain (si lo definiste)
   */
  private getHostSafe(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      try {
        const hostname = window.location.hostname.toLowerCase();
        console.log('Hostname detectado:', hostname);
        if (!hostname) return this.detectedDomain;
        // Si es localhost o IP, usar el del enviroment
        if (hostname === 'localhost' || /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname)) {
          return this.detectedDomain;
        }
        return hostname;
      } catch {
        return this.detectedDomain;
      }
    } else {
      // SSR: si inyectás REQUEST, podés leer el host real
      // const h = this.req?.headers?.host ? String(this.req.headers.host).split(':')[0] : null;
      // return h ?? this.detectedDomain;
      console.log('No estamos en browser; usando domain de environment');
      return this.detectedDomain;
    }
  }
 
}