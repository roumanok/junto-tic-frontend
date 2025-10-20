import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { CommunityService } from './community.service';
import { Observable, of, merge } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class CdnService {
  constructor(private community: CommunityService) {}

  /**
   * Versión síncrona: resuelve ahora mismo.
   * - Si fileUrl es absoluta, la devuelve tal cual.
   * - Si la comunidad ya está cargada, usa su cdnUrl.
   * - Si no, usa environment.cdnUrl (fallback).
   */
  getCdnUrl(fileUrl: string = ''): string {
    if (this.isAbsolute(fileUrl)) return fileUrl;
    const base = this.currentBase();
    return this.join(base, fileUrl);
  }

  /**
   * Versión reactiva:
   * - Emite una primera vez con base actual (comunidad si está, o env).
   * - Re-emite automáticamente cuando la comunidad se cargue.
   *
   * Uso en template: [src]="cdn.getCdnUrl$('img/foo.jpg') | async"
   */
  getCdnUrl$(fileUrl: string = ''): Observable<string> {
    if (this.isAbsolute(fileUrl)) return of(fileUrl);

    // Emisión inicial (estado actual)
    const initial$ = of(this.join(this.currentBase(), fileUrl));

    // Re-emite cuando la comunidad tenga id (ya cargada)
    const onLoaded$ = this.community.communityId$.pipe(
      map(() => this.join(this.currentBase(), fileUrl)),
      distinctUntilChanged()
    );

    return merge(initial$, onLoaded$);
  }

  /** Base actual: cdn de comunidad si está, si no environment.cdnUrl */
  private currentBase(): string {
    // community es un Signal<Community|null>. Se lee invocándolo:
    const c = this.community.community();
    const base =
      (c as any)?.cdn_domain ??      
      environment.cdnUrl;

    return this.trimTrailingSlash(String(base || ''));
  }

  private isAbsolute(url: string): boolean {
    return /^https?:\/\//i.test(url);
  }

  /** Une base y path evitando dobles barras */
  private join(base: string, path: string): string {
    const cleanBase = this.trimTrailingSlash(base || '');
    const cleanPath = path ? (path.startsWith('/') ? path : `/${path}`) : '';
    return `${cleanBase}${cleanPath}`;
  }

  private trimTrailingSlash(s: string): string {
    return s.replace(/\/+$/, '');
  }
}
