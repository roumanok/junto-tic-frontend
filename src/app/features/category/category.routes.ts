import { Routes } from '@angular/router';

export const categoryRoutes: Routes = [
  {
    path: ':slug',
    loadComponent: () => import('./category-page.component').then(m => m.CategoryPageComponent)
  }
];