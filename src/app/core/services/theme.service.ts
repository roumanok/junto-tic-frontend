// src/app/services/theme.service.ts
import { Injectable, signal, computed, inject, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import { ApiService } from './api.service';
import { CommunityService } from './community.service';
import { CommunityTheme } from '../models/community.model';
import { environment } from '../../../environments/environment';

type Dict<T = any> = Record<string, T>;

declare global {
  interface Window {
    javascriptcommunityResourcesCallback?: (data: {
      assets?: { logo?: string; favicon?: string };
      customCSS?: string;
      customJS?: string;
      i18nOverride?: string;
      slider?: string;
    }) => void;

    javascriptsliderConfigCallback?: (data: {
      slides: Array<{ image: string; title?: string; link?: string }>;
    }) => void;
  }
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private api = inject(ApiService);
  private community = inject(CommunityService);

  // ---- STATE (signals)
  private _state = signal<CommunityTheme>({
    slug: '',
    genVersion: 0,
    resVersion: 0,
    cdn: '',
    assets: {},
    i18n: {},
    slider: { slides: [] },
    ready: false,
  });

  readonly state = this._state.asReadonly();
  readonly isReady = computed(() => this._state().ready);
  readonly i18n = computed(() => this._state().i18n);
  readonly slider = computed(() => this._state().slider);
  readonly assets = computed(() => this._state().assets);

  constructor(    
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(DOCUMENT) private document: Document
  ) {}

  // ---- PUBLIC API
  async init(): Promise<void> {
    await this.community.ensureLoaded?.(); 
    const info = this.community.community();

    if (!info) {
      throw new Error('ThemeService: comunidad no disponible tras ensureLoaded()');
    }

    const slug = info.slug;
    const genVersion = info.gen_version;
    const resVersion = info.res_version;
    const cdn = (info.cdn_domain ?? environment.cdnUrl).replace(/\/+$/, '') + '/';

    if (!slug || !genVersion || !resVersion) {
      throw new Error('ThemeService: faltan datos de comunidad (slug/genVersion/resVersion)');
    }

    // 2) cache key
    const cacheKey = this.cacheKey(slug, genVersion, resVersion);
    const cached = this.readCache(cacheKey);

    // 3) Setear base del state
    this._state.update(s => ({
      ...s,
      slug,
      genVersion,
      resVersion,
      cdn,
      assets: cached?.assets ?? {},
      i18n: cached?.i18n ?? {},
      slider: cached?.slider ?? { slides: [] },
      ready: false,
    }));

    // 4) Cargar BASE gen (CSS/JS)
    console.log('Cargando assets base desde CDN...');
    await this.loadBaseAssets(cdn, genVersion);

    // 5) Cargar recursos de comunidad via JSONP (res-{version}.js)
    const res = await this.loadCommunityResourcesJSONP(cdn, slug, resVersion);

    // 6) Overrides opcionales (custom CSS, JS, slider, i18n)
    await this.applyCommunityOverrides(cdn, slug, res, resVersion);

    // 7) Aplicar favicon/logo si existen
    this.applyFaviconIfAny();
    // (si querés, también podrías setear <img> globalmente si usás un id en el layout)

    // 8) Guardar en cache y marcar ready
    const current = this._state();
    this.writeCache(cacheKey, {
      assets: current.assets,
      i18n: current.i18n,
      slider: current.slider,
      at: Date.now(),
    });

    this._state.update(s => ({ ...s, ready: true }));
  }

  // ---- HELPERS

   async loadComponentStyles(name: 'home' | string): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    const info = this.community.community?.();
    if (!info) return;

    const cdn = (info as any).cdn_domain || (info as any).cdnUrl; // según tu modelo
    const slug = (info as any).slug;
    const res  = (info as any).res_version;

    const href = `${cdn}/cmn/${slug}/${res}/styles/${name}.css`;
    this.injectStylesheet(`theme-css-${name}`, href);
  }

  private injectStylesheet(id: string, href: string) {
    let link = this.document.getElementById(id) as HTMLLinkElement | null;
    if (link) {
      if (link.href !== href) link.href = href;
      return;
    }
    link = this.document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = href;
    this.document.head.appendChild(link);
  }

  private cacheKey(slug: string, genV: number, resV: number) {
    return `theme_${slug}_${genV}_${resV}`;
  }

  private readCache(key: string): Partial<CommunityTheme> | null {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  private writeCache(key: string, data: any) {
    try { localStorage.setItem(key, JSON.stringify(data)); } catch { /* ignore */ }
  }

  private loadCSS(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = url;
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`No se pudo cargar CSS: ${url}`));
      document.head.appendChild(link);
    });
  }

  private loadScript(url: string, isModule = false): Promise<void> {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      if (isModule) s.type = 'module';
      s.src = url;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error(`No se pudo cargar JS: ${url}`));
      document.head.appendChild(s);
    });
  }

  private async fetchJSON<T>(url: string): Promise<T> {
    const res = await fetch(url, { credentials: 'omit' });
    if (!res.ok) throw new Error(`fetchJSON ${url} -> ${res.status}`);
    return res.json() as Promise<T>;
  }

  private applyFaviconIfAny() {    
    const { assets, cdn, slug, resVersion } = this._state();
    if (!assets.favicon) return;
    console.log('Aplicando favicon:', assets.favicon);
    const href = this.cdnURL(cdn, `cmn/${slug}/${assets.favicon.replace('{version}', String(resVersion))}`);
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = href;
  }

  private cdnURL(cdn: string, path: string) {
    return `${cdn.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
  }

  private async loadBaseAssets(cdn: string, genVersion: number): Promise<void> {    
    // Base CSS
    //await this.loadCSS(this.cdnURL(cdn, `gen/main-${genVersion}.css`));
    // Base JS (si lo usás)
    //await this.loadScript(this.cdnURL(cdn, `gen/main-${genVersion}.js`));
    // i18n base
    console.log('Cargando i18n base desde CDN...');
    console.log('CDN:', cdn);
    console.log('genVersion:', genVersion); 
    const baseI18n = await this.fetchJSON<Dict<string>>(this.cdnURL(cdn, `gen/i18n/es.json?v=1.0.1`));
    this._state.update(s => ({ ...s, i18n: { ...baseI18n, ...s.i18n } }));    
  }

  private loadCommunityResourcesJSONP(
    cdn: string,
    slug: string,
    resVersion: number
  ): Promise<{
    assets?: { logo?: string; favicon?: string };
    customCSS?: string;
    customJS?: string;
    i18nOverride?: string;
    slider?: string;
  }> {
    return new Promise((resolve, reject) => {
      // Registrar callback temporal
      window.javascriptcommunityResourcesCallback = (data) => {
        // Actualizar assets en state (paths relativos al folder de la comunidad)
        if (data.assets) {
          this._state.update(s => ({
            ...s,
            assets: {
              ...s.assets,
              ...data.assets,
            },
          }));
        }
        resolve(data);
        // limpiar callback
        setTimeout(() => { delete window.javascriptcommunityResourcesCallback; }, 0);
      };

      const url = this.cdnURL(cdn, `cmn/${slug}/res-${resVersion}.js`);
      console.log('Cargando recursos de comunidad desde:', url);
      const tag = document.createElement('script');
      tag.src = url;
      tag.async = true;
      tag.onerror = () => {
        delete window.javascriptcommunityResourcesCallback;
        reject(new Error(`No se pudo cargar ${url}`));
      };
      document.head.appendChild(tag);
    });
  }

  private async applyCommunityOverrides(
    cdn: string,
    slug: string,
    res: {
      assets?: { logo?: string; favicon?: string };
      customCSS?: string;
      customJS?: string;
      i18nOverride?: string;
      slider?: string;
    },
    resVersion: number
  ): Promise<void> {
    // custom CSS
    if (res.customCSS) {
      const cssUrl = this.cdnURL(cdn, `cmn/${slug}/${res.customCSS.replace('{version}', String(resVersion))}`);
      await this.loadCSS(cssUrl);
    }

    // custom JS
    if (res.customJS) {
      const jsUrl = this.cdnURL(cdn, `cmn/${slug}/${res.customJS.replace('{version}', String(resVersion))}`);
      await this.loadScript(jsUrl);
    }

    // i18n override
    if (res.i18nOverride) {
      const i18nUrl = this.cdnURL(cdn, `cmn/${slug}/${res.i18nOverride}`);
      try {
        const override = await this.fetchJSON<Dict<string>>(i18nUrl);
        this._state.update(s => ({ ...s, i18n: { ...s.i18n, ...override } }));
      } catch { /* ignorar si no existe */ }
    }

    // slider via JSONP
    if (res.slider) {
      /*
      await new Promise<void>((resolve, reject) => {
        window.javascriptsliderConfigCallback = (data) => {
          this._state.update(s => ({ ...s, slider: data ?? { slides: [] } }));
          resolve();
          setTimeout(() => { delete window.javascriptsliderConfigCallback; }, 0);
        };
        const sliderUrl = this.cdnURL(cdn, `cmn/${slug}/${res.slider.replace('{version}', String(resVersion))}`);
        const tag = document.createElement('script');
        tag.src = sliderUrl;
        tag.async = true;
        tag.onerror = () => {
          delete window.javascriptsliderConfigCallback;
          reject(new Error(`No se pudo cargar slider ${sliderUrl}`));
        };
        document.head.appendChild(tag);        
      });
      */
    }
  }

  // ---- UTILS PÚBLICOS

  /** Devuelve URL absoluta en CDN para un asset de comunidad (ej: "med/logo.png"). */
  assetUrl(relPath: string): string {
    const { cdn, slug } = this._state();
    return this.cdnURL(cdn, `cmn/${slug}/${relPath.replace(/^\/+/, '')}`);
  }

  getLogoUrl(): string {    
    if (this.assets().logo) {
      return this.assetUrl(this.assets().logo ? this.assets().logo as string : '/med/logo.png');
    }
    return 'placeholder.png';
  }
}
