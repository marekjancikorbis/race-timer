import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.page').then(m => m.DashboardPage)
  },
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'map',
    loadComponent: () => import('./map-route/map-route.page').then(m => m.MapRoutePage)
  },
  {
    path: '',
    redirectTo: 'map',
    pathMatch: 'full'
  }
];
