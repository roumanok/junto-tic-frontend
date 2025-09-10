import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter, withEnabledBlockingInitialNavigation } from '@angular/router';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideStore } from '@ngrx/store';
import { provideStoreDevtools } from '@ngrx/store-devtools';

import { routes } from './app.routes';
import { appReducer } from './store/app.reducer';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withEnabledBlockingInitialNavigation()),
    provideHttpClient(withFetch()), // ← Agregado withFetch()
    provideClientHydration(),
    provideAnimations(),
    provideStore({ app: appReducer }),
    
    ...(!environment.production ? [
      provideStoreDevtools({
        maxAge: 25,
        logOnly: environment.production,
        autoPause: true,
        trace: false,
        traceLimit: 75
      })
    ] : [])
  ]
};