import { Routes } from '@angular/router';
import { authGuard } from '../app/core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => 
      import('./layouts/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      {
        path: '',
        loadChildren: () => import('./features/home/home.routes').then(m => m.homeRoutes)
      },
      {
        path: 'articulo',
        loadChildren: () => import('./features/listing-detail/listing-detail.routes').then(m => m.listingDetailRoutes)
      },
      {
        path: 'categoria',
        loadChildren: () => import('./features/category/category.routes').then(m => m.categoryRoutes)
      },
      {
        path: 'anunciante',
        loadChildren: () => import('./features/advertiser/advertiser.routes').then(m => m.advertiserRoutes)
      },
      {
        path: 'novedades',
        loadChildren: () => import('./features/news/news.routes').then(m => m.newsRoutes)
      },
      {
        path: 'ofertas',
        loadChildren: () => import('./features/offers/offers.routes').then(m => m.offersRoutes)
      },
      {
        path: 'buscar',
        loadChildren: () => import('./features/search/search.routes').then(m => m.searchRoutes)
      },
      {
        path: 'login-required',
        loadComponent: () => import('./features/login-required/login-required.component').then(c => c.LoginRequiredComponent)          
      },
      {
        path: 'checkout',
        loadComponent: () => import('./features/checkout/checkout-page.component').then(c => c.CheckoutPageComponent),
          canActivate: [authGuard]
      },
      {
        path: 'auth/callback',
        loadComponent: () => import('./features/auth-callback/auth-callback.component').then(c => c.AuthCallbackComponent)
      },
      {
        path: 'mi-cuenta/mis-compras',
        loadChildren: () => import('./features/my-orders/my-orders.routes').then(m => m.myOrdersRoutes)
      },
      {
        path: 'mi-cuenta/mis-articulos',
        loadChildren: () => import('./features/my-listings/my-listings.routes').then(m => m.myListingsRoutes),
        canActivate: [authGuard]
      },
      {
        path: 'mi-cuenta/mis-ventas',
        loadChildren: () => import('./features/my-sales/my-sales.routes').then(m => m.mySalesRoutes),
        canActivate: [authGuard]
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];