import { Routes } from '@angular/router';

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
        path: 'listing',
        loadChildren: () => import('./features/listing-detail/listing-detail.routes').then(m => m.listingDetailRoutes)
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];