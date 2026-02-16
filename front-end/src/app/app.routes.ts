import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards';

export const routes: Routes = [
  // Page d'accueil
  {
    path: '',
    loadComponent: () =>
      import('./features/home/home.component').then((m) => m.HomeComponent),
  },
  // Routes d'authentification
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  // Page de profil
  {
    path: 'profile',
    loadChildren: () =>
      import('./features/profile/profile.routes').then((m) => m.PROFILE_ROUTES),
  },
  // Routes Acheteur (BUYER)
  {
    path: 'buyer',
    loadChildren: () =>
      import('./features/buyer/buyer.routes').then((m) => m.BUYER_ROUTES),
    canActivate: [authGuard, roleGuard(['BUYER'])],
  },
  // Routes d'administration
  {
    path: 'admin',
    loadChildren: () =>
      import('./features/admin/admin.routes').then((m) => m.ADMIN_ROUTES),
    canActivate: [authGuard, roleGuard(['ADMIN'])],
  },
  // Page non autorisée
  {
    path: 'unauthorized',
    loadComponent: () =>
      import('./features/unauthorized/unauthorized.component').then(
        (m) => m.UnauthorizedComponent,
      ),
  },
  // Redirection par défaut
  {
    path: '**',
    redirectTo: '',
  },
];
