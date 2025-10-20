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
    //console.log('Setting page title:', translatedTitle);
    //console.log('Using params:', params);
    this.title.setTitle(translatedTitle);
  }

  setPageMeta(titleKey: string, descriptionKey?: string, params?: Record<string, any>): void {
    this.setPageTitle(titleKey, params);

    if (descriptionKey) {
      const description = this.i18n.t(descriptionKey, params);
      this.meta.updateTag({ name: 'description', content: description });
    }

    const keywords = this.i18n.t('SEO.HOME.KEYWORDS');
    this.meta.updateTag({ name: 'keywords', content: keywords });
    
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

}