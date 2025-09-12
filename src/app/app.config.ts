import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors  } from '@angular/common/http';
import { provideClientHydration } from '@angular/platform-browser';
import { provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { CommunityService } from './core/services/community.service';
import { ThemeService } from './core/services/theme.service';
import { communityInterceptor } from './core/interceptors/community-interceptor';

import { routes } from './app.routes';
import { appReducer } from './store/app.reducer';
import { environment } from '../environments/environment';


function initCommunity(cs: CommunityService) {
  return () => cs.loadFromDomain();
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(),
    provideHttpClient(withFetch()),
    provideStore({ app: appReducer }),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: environment.production,
    }),
    provideHttpClient(withInterceptors([communityInterceptor])),
    {
      provide: APP_INITIALIZER,
      useFactory: (cs: CommunityService) => () => cs.ensureLoaded(),
      deps: [CommunityService, ThemeService],
      multi: true,
    } 

  ],
};