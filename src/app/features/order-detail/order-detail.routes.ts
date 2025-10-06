import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const orderDetailRoutes: Routes = [
  {
    path: ':order_id',
    loadComponent: () => 
      import('./order-detail-page.component').then(m => m.OrderDetailPageComponent),
    canActivate: [authGuard]
  }
];