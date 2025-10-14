import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const myListingsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => 
      import('./my-listings-page.component')
        .then(m => m.MyListingsPageComponent),
    canActivate: [authGuard],
    data: { roles: ['advertiser'] }
  },
  {
    path: 'crear',
    loadComponent: () => 
      import('./create-listing-page.component')
        .then(m => m.CreateListingPageComponent),
    canActivate: [authGuard],
    data: { roles: ['advertiser'] }
  },
  {
    path: ':id/editar',
    loadComponent: () => 
      import('./edit-listing-page.component')
        .then(m => m.EditListingPageComponent),
    canActivate: [authGuard],
    data: { roles: ['advertiser'] }
  }
];