import { Routes } from '@angular/router';

export const advertiserRoutes: Routes = [
  {
    path: ':slug',
    loadComponent: () => import('./advertiser-page.component').then(m => m.AdvertiserPageComponent)
  }
];