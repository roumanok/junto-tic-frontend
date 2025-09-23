// src/app/core/services/seo.service.ts
import { Injectable, inject } from '@angular/core';
import { Title, Meta } from '@angular/platform-browser';
import { I18nService } from './i18n.service';
import { ThemeService } from './theme.service';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private title = inject(Title);
  private meta = inject(Meta);
  private i18n = inject(I18nService);
  private theme = inject(ThemeService);

  setPageTitle(key: string, params?: Record<string, any>): void {
    const translatedTitle = this.i18n.t(key, params);
    console.log('Setting page title:', translatedTitle);
    console.log('Using params:', params);
    this.title.setTitle(translatedTitle);
  }

  setPageMeta(titleKey: string, descriptionKey?: string, params?: Record<string, any>): void {
    // Setear title
    this.setPageTitle(titleKey, params);

    // Setear meta description si se proporciona
    if (descriptionKey) {
      const description = this.i18n.t(descriptionKey, params);
      this.meta.updateTag({ name: 'description', content: description });
    }

    // Meta tags adicionales
    const keywords = this.i18n.t('SEO.HOME.KEYWORDS');
    this.meta.updateTag({ name: 'keywords', content: keywords });
    
    // Open Graph tags
    const title = this.title.getTitle();
    this.meta.updateTag({ property: 'og:title', content: title });
    if (descriptionKey) {
      const ogDescription = this.i18n.t(descriptionKey, params);
      this.meta.updateTag({ property: 'og:description', content: ogDescription });
    }
  }

  setCommunitySpecificMeta(): void {
    const assets = this.theme.assets();
    const communityName = this.i18n.t('COMMUNITY.NAME'); 

    this.setPageMeta(
      'SEO.HOME.TITLE',
      'SEO.HOME.DESCRIPTION',
      { communityName }
    );
  }

  private getCommunityName(): string {
    // Obtener el nombre des la comunidad desde el theme o donde lo tengas
    return this.theme.state().slug || 'Junto a TIC';
  }
}