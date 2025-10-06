import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const myOrdersRoutes: Routes = [
  {
    path: '',
    loadComponent: () => 
      import('./my-orders-page.component').then(m => m.MyOrdersPageComponent),
    canActivate: [authGuard]
  }
];