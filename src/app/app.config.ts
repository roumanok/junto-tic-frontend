import { ApplicationConfig, provideZoneChangeDetection, inject, APP_INITIALIZER, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async'
import { provideClientHydration } from '@angular/platform-browser';
import { provideOAuthClient } from 'angular-oauth2-oidc';
import { CommunityService } from './core/services/community.service';
import { ThemeService } from './core/services/theme.service';
import { CategoryService } from './core/services/category.service';
import { AuthService } from './core/services/auth.service';
import { AppLoadingService } from './core/services/app-loading.service';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';

function initApp() {
  const platformId  = inject(PLATFORM_ID);
  const community   = inject(CommunityService);
  const theme       = inject(ThemeService);
  const categories  = inject(CategoryService);
  const auth        = inject(AuthService);
  const appLoading  = inject(AppLoadingService); 


  return async () => {
    appLoading.startLoading();

    await community.ensureLoaded().catch(err => {
      console.warn('ensureLoaded() no resolvió comunidad todavía (ok en SSR):', err);
    });

    if (isPlatformBrowser(platformId)) {      
      await Promise.all([
        theme.init().catch(err => console.error('Theme init error:', err)),
        categories.preloadAll().catch(err => console.error('Cats all error:', err)),
        categories.preloadFeatured().catch(err => console.error('Cats featured error:', err)),
      ]);
    }
    
    appLoading.finishLoading();
  };
}


export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimationsAsync(),
    provideClientHydration(),    
    provideHttpClient(
      withFetch(),
      withInterceptors([authInterceptor])
    ),
    provideOAuthClient(),
    {
      provide: APP_INITIALIZER,
      useFactory: initApp,      
      multi: true,
    } 

  ],
};