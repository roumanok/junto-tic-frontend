import { Routes } from '@angular/router';

export const checkoutRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./checkout-page.component').then(m => m.CheckoutPageComponent)
  }
];