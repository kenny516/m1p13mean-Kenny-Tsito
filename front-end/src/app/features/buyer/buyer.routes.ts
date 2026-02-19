import { Routes } from '@angular/router';

export const BUYER_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'cart',
    pathMatch: 'full',
  },
  {
    path: 'cart',
    loadComponent: () =>
      import('./cart/cart.component').then((m) => m.CartComponent),
  },
  {
    path: 'orders',
    loadComponent: () =>
      import('./orders/orders.component').then((m) => m.OrdersComponent),
  },
];
