import { Routes } from '@angular/router';
import { ShellLayoutComponent, NavItem } from '../../shared/components/shell-layout/shell-layout.component';

const customerNav: NavItem[] = [
  { label: 'Home', route: '/portal', icon: 'home' },
  { label: 'Catalog', route: '/portal/catalog', icon: 'medication' },
  { label: 'My Orders', route: '/portal/orders', icon: 'shopping_cart' },
  { label: 'View Invoices', route: '/portal/invoices', icon: 'receipt' },
];

export const customerRoutes: Routes = [
  {
    path: '',
    component: ShellLayoutComponent,
    data: { title: 'Customer Portal', nav: customerNav },
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/customer-home.component').then((m) => m.CustomerHomeComponent),
      },
      {
        path: 'catalog',
        loadComponent: () =>
          import('./pages/customer-catalog.component').then((m) => m.CustomerCatalogComponent),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./pages/customer-orders.component').then((m) => m.CustomerOrdersComponent),
      },
      {
        path: 'invoices',
        loadComponent: () =>
          import('./pages/customer-invoices.component').then((m) => m.CustomerInvoicesComponent),
      },
    ],
  },
];
