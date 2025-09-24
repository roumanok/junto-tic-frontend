import { Routes } from '@angular/router';

export const offersRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./offers-page.component').then(m => m.OffersPageComponent)
  }
];