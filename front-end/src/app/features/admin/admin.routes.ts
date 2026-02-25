import { Routes } from '@angular/router';

export const ADMIN_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./dashboard/admin-dashboard.component').then(
        (m) => m.AdminDashboardComponent,
      ),
  },
  {
    path: 'users',
    loadComponent: () =>
      import('./users/user-list.component').then((m) => m.UserListComponent),
  },
  {
    path: 'users/new',
    loadComponent: () =>
      import('./users/user-form.component').then((m) => m.UserFormComponent),
  },
  {
    path: 'users/:id',
    loadComponent: () =>
      import('./users/user-detail.component').then(
        (m) => m.UserDetailComponent,
      ),
  },
  {
    path: 'users/:id/edit',
    loadComponent: () =>
      import('./users/user-form.component').then((m) => m.UserFormComponent),
  },
  {
    path: 'shops',
    loadComponent: () =>
      import('./shops/shop-list.component').then((m) => m.ShopListComponent),
  },
];
