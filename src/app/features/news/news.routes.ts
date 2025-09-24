import { Routes } from '@angular/router';

export const newsRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./news-page.component').then(m => m.NewsPageComponent)
  }
];