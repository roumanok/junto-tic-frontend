import { Routes } from '@angular/router';
import { authGuard } from '../../core/guards/auth.guard';

export const mySalesRoutes: Routes = [
  {
    path: '',
    loadComponent: () => 
      import('./my-sales-page.component').then(m => m.MySalesPageComponent),
    canActivate: [authGuard]
  }
  ,{
    path: 'orden/:order_id',
    loadComponent: () => 
      import('../sale-detail/sale-detail-page.component').then(m => m.SaleDetailPageComponent),
    canActivate: [authGuard]
  }
];