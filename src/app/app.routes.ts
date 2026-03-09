import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login';
import { LayoutComponent } from './pages/layout/layout';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: 'dashboard',      loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.Dashboard) },
      { path: 'nomina',         loadComponent: () => import('./pages/nomina/nomina').then(m => m.Nomina) },
      { path: 'relevamiento',   loadComponent: () => import('./pages/relevamiento/relevamiento').then(m => m.Relevamiento) },
      { path: 'descriptivos',   loadComponent: () => import('./pages/descriptivos/descriptivos').then(m => m.Descriptivos) },
      { path: 'procedimientos', loadComponent: () => import('./pages/procedimientos/procedimientos').then(m => m.Procedimientos) },
      { path: 'organigrama',    loadComponent: () => import('./pages/organigrama/organigrama').then(m => m.Organigrama) },
      { path: 'usuarios',       loadComponent: () => import('./pages/usuarios/usuarios').then(m => m.Usuarios) },
    ]
  },
  { path: '**', redirectTo: 'login' }
];