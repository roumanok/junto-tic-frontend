import { Routes } from '@angular/router';

export const listingDetailRoutes: Routes = [
  {
    path: ':slug',
    loadComponent: () => import('./listing-detail.component').then(m => m.ListingDetailComponent)
  }
];