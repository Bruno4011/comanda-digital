import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', loadComponent: () => import('./features/auth/login/login.component').then(m => m.LoginComponent) },
  { path: 'admin', canActivate: [authGuard, roleGuard(['ADMIN'])],
    loadComponent: () => import('./features/admin/admin.component').then(m => m.AdminComponent) },
  { path: 'garcom', canActivate: [authGuard, roleGuard(['GARCOM', 'ADMIN'])],
    loadComponent: () => import('./features/garcom/garcom.component').then(m => m.GarcomComponent) },
  { path: 'cozinha', canActivate: [authGuard, roleGuard(['COZINHA', 'ADMIN'])],
    loadComponent: () => import('./features/cozinha/cozinha.component').then(m => m.CozinhaComponent) },
  { path: 'copa', canActivate: [authGuard, roleGuard(['COPA', 'ADMIN'])],
    loadComponent: () => import('./features/copa/copa.component').then(m => m.CopaComponent) },
  { path: 'prato-quente', canActivate: [authGuard, roleGuard(['PRATO_QUENTE', 'COZINHA', 'ADMIN'])],
    loadComponent: () => import('./features/prato-quente/prato-quente.component').then(m => m.PratoQuenteComponent) },
  { path: 'prato-frio', canActivate: [authGuard, roleGuard(['PRATO_FRIO', 'ADMIN'])],
    loadComponent: () => import('./features/prato-frio/prato-frio.component').then(m => m.PratoFrioComponent) },
  { path: 'cliente', loadComponent: () => import('./features/cliente/cliente.component').then(m => m.ClienteComponent) },
  { path: 'delivery', loadComponent: () => import('./features/delivery/delivery.component').then(m => m.DeliveryComponent) },
  { path: '**', redirectTo: 'login' }
];