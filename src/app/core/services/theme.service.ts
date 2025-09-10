import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { CommunityTheme } from '../models/community.model';
import { CommunityService } from './community.service';

export interface SliderConfig {
  slides: SlideItem[];
}

export interface SlideItem {
  image: string;
  title: string;
  link: string;
  altText?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly cdnBaseUrl = 'https://cdn.jatic.com.ar';
  private currentThemeSubject = new BehaviorSubject<CommunityTheme | null>(null);
  public currentTheme$ = this.currentThemeSubject.asObservable();
  
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  public isLoading$ = this.isLoadingSubject.asObservable();

  constructor(private communityService: CommunityService) {}

  loadCommunityTheme(): Observable<CommunityTheme | null> {
    this.isLoadingSubject.next(true);

    return this.communityService.getCommunityByDomain().pipe(
      map(({ communitySlug, version }) => {
        const cacheKey = `theme_${communitySlug}_${version}`;
        const cachedTheme = this.getCachedTheme(cacheKey);
        
        if (cachedTheme) {
          this.currentThemeSubject.next(cachedTheme);
          this.isLoadingSubject.next(false);
          return cachedTheme;
        }

        this.loadThemeFromCDN(communitySlug, version, cacheKey);
        return null;
      }),
      catchError(error => {
        console.error('Error loading community theme:', error);
        this.loadFallbackTheme();
        this.isLoadingSubject.next(false);
        return of(null);
      })
    );
  }

  private loadThemeFromCDN(communitySlug: string, version: number, cacheKey: string): void {
    this.loadBaseAssets(version);
    
    const resourcesUrl = `${this.cdnBaseUrl}/cmn/${communitySlug}/res-${version}.js`;
    
    (window as any).communityResourcesCallback = (theme: CommunityTheme) => {
      this.applyTheme(theme, communitySlug, version);
      this.setCachedTheme(cacheKey, theme);
      this.currentThemeSubject.next(theme);
      this.isLoadingSubject.next(false);
    };

    this.loadScript(resourcesUrl).catch(error => {
      console.error('Error loading community resources:', error);
      this.loadFallbackTheme();
    });
  }

  private loadBaseAssets(version: number): void {
    if (!document.querySelector(`link[href*="main-${version}.css"]`)) {
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = `${this.cdnBaseUrl}/gen/main-${version}.css`;
      document.head.appendChild(cssLink);
    }
  }

  private applyTheme(theme: CommunityTheme, communitySlug: string, version: number): void {
    if (theme.customCSS) {
      const customCssUrl = `${this.cdnBaseUrl}/cmn/${communitySlug}/${theme.customCSS}`;
      this.loadStylesheet(customCssUrl);
    }

    if (theme.assets.favicon) {
      this.updateFavicon(`${this.cdnBaseUrl}/cmn/${communitySlug}/${theme.assets.favicon}`);
    }
  }

  private loadStylesheet(url: string): void {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link);
  }

  private loadScript(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
      document.head.appendChild(script);
    });
  }

  private updateFavicon(url: string): void {
    const existingFavicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (existingFavicon) {
      existingFavicon.href = url;
    } else {
      const favicon = document.createElement('link');
      favicon.rel = 'icon';
      favicon.href = url;
      document.head.appendChild(favicon);
    }
  }

  private loadFallbackTheme(): void {
    const fallbackTheme: CommunityTheme = {
      communitySlug: 'default',
      version: 1,
      assets: {
        logo: '/assets/images/logo-junto-a-tic.svg',
        favicon: '/favicon.ico'
      }
    };
    
    this.currentThemeSubject.next(fallbackTheme);
    this.isLoadingSubject.next(false);
  }

  private getCachedTheme(key: string): CommunityTheme | null {
    if (typeof localStorage === 'undefined') return null;
    
    try {
      const cached = localStorage.getItem(key);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  }

  private setCachedTheme(key: string, theme: CommunityTheme): void {
    if (typeof localStorage === 'undefined') return;
    
    try {
      localStorage.setItem(key, JSON.stringify(theme));
    } catch (error) {
      console.warn('Could not cache theme:', error);
    }
  }

  getCurrentTheme(): CommunityTheme | null {
    return this.currentThemeSubject.value;
  }

  getAssetUrl(assetPath: string): string {
    const theme = this.getCurrentTheme();
    if (!theme) return `/assets/images/placeholder.png`;
    
    return `${this.cdnBaseUrl}/cmn/${theme.communitySlug}/${assetPath}`;
  }
}