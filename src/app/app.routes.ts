import type { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'health'
  },
  {
    path: 'health',
    loadComponent: () => import('./features/health/health.page').then((m) => m.HealthPage)
  },
  {
    path: '**',
    loadComponent: () => import('./features/not-found/not-found.page').then((m) => m.NotFoundPage)
  }
];
