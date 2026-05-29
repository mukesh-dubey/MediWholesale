import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { staffGuard, customerGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'staff',
    canActivate: [authGuard, staffGuard],
    loadChildren: () => import('./features/staff/staff.routes').then((m) => m.staffRoutes),
  },
  {
    path: 'portal',
    canActivate: [authGuard, customerGuard],
    loadChildren: () => import('./features/customer/customer.routes').then((m) => m.customerRoutes),
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
