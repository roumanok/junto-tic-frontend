import { ApplicationConfig, provideZoneChangeDetection, inject, APP_INITIALIZER, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch  } from '@angular/common/http';
import { provideClientHydration } from '@angular/platform-browser';
import { CommunityService } from './core/services/community.service';
import { ThemeService } from './core/services/theme.service';
import { CategoryService } from './core/services/category.service';
import { routes } from './app.routes';
import { environment } from '../environments/environment';



function initApp() {
  const platformId = inject(PLATFORM_ID);
  const community  = inject(CommunityService);
  const theme      = inject(ThemeService);
  const categories   = inject(CategoryService);

  return async () => {
    // 1) Siempre intentá resolver comunidad (SSR y browser)
    await community.ensureLoaded().catch(err => {
      console.warn('ensureLoaded() no resolvió comunidad todavía (ok en SSR):', err);
    });

    // 2) Solo en browser: inicializá el theme (puede tocar DOM / cargar assets)
    if (isPlatformBrowser(platformId)) {      
      await Promise.all([
        theme.init().catch(err => console.error('Theme init error:', err)),
        categories.preloadAll().catch(err => console.error('Cats all error:', err)),
        categories.preloadFeatured().catch(err => console.error('Cats featured error:', err)),
      ]);
    }
  };
}


export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(),    
    provideHttpClient(withFetch()),
    {
      provide: APP_INITIALIZER,
      useFactory: initApp,      
      multi: true,
    } 

  ],
};