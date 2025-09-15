import { ApplicationConfig, provideZoneChangeDetection, APP_INITIALIZER } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withFetch  } from '@angular/common/http';
import { provideClientHydration } from '@angular/platform-browser';
import { provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { CommunityService } from './core/services/community.service';
import { ThemeService } from './core/services/theme.service';

import { routes } from './app.routes';
import { appReducer } from './store/app.reducer';
import { environment } from '../environments/environment';


export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideClientHydration(),
    provideStore({ app: appReducer }),
    provideStoreDevtools({
      maxAge: 25,
      logOnly: environment.production,
    }),
    provideHttpClient(withFetch()),
    {
      provide: APP_INITIALIZER,
      useFactory: (cs: CommunityService) => () => cs.ensureLoaded(),
      deps: [CommunityService, ThemeService],
      multi: true,
    } 

  ],
};