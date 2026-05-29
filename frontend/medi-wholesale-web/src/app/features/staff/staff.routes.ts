import { Routes } from '@angular/router';
import { ShellLayoutComponent, NavItem } from '../../shared/components/shell-layout/shell-layout.component';

const staffNav: NavItem[] = [
  { label: 'Dashboard', route: '/staff', icon: 'dashboard' },
  { label: 'Customers', route: '/staff/customers', icon: 'groups' },
  { label: 'Products', route: '/staff/products', icon: 'medication' },
  { label: 'Inventory', route: '/staff/inventory', icon: 'inventory_2' },
  { label: 'Orders', route: '/staff/orders', icon: 'shopping_cart' },
];

export const staffRoutes: Routes = [
  {
    path: '',
    component: ShellLayoutComponent,
    data: { title: 'Staff Portal', nav: staffNav },
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/staff-dashboard.component').then((m) => m.StaffDashboardComponent),
      },
      {
        path: 'customers',
        loadComponent: () =>
          import('./pages/staff-customers.component').then((m) => m.StaffCustomersComponent),
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./pages/staff-products.component').then((m) => m.StaffProductsComponent),
      },
      {
        path: 'inventory',
        loadComponent: () =>
          import('./pages/staff-inventory.component').then((m) => m.StaffInventoryComponent),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./pages/staff-orders.component').then((m) => m.StaffOrdersComponent),
      },
    ],
  },
];
