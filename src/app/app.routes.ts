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
        loadComponent: () => import('./features/login-required/login-required.component')
          .then(c => c.LoginRequiredComponent)          
      },
      {
        path: 'checkout',
        loadComponent: () => import('./features/checkout/checkout-page.component')
          .then(c => c.CheckoutPageComponent),
          canActivate: [authGuard]
      },
      {
        path: 'auth/callback',  // ✅ IMPORTANTE: Agregar esta ruta
        loadComponent: () => import('./features/auth-callback/auth-callback.component')
          .then(c => c.AuthCallbackComponent)
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];