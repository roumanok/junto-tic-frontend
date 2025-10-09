import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const myOrdersRoutes: Routes = [
  {
    path: '',
    loadComponent: () => 
      import('./my-orders-page.component').then(m => m.MyOrdersPageComponent),
    canActivate: [authGuard]
  
  },
  {
    path: 'orden/:order_id', 
    loadComponent: () => 
      import('../order-detail/order-detail-page.component').then(m => m.OrderDetailPageComponent),
    canActivate: [authGuard]
  },
  {
    path: 'orden',  
    loadComponent: () => 
      import('../order-detail/order-detail-page.component').then(m => m.OrderDetailPageComponent),
    canActivate: [authGuard]
  }
];