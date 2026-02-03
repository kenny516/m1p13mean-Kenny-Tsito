import { Routes } from '@angular/router';
import { authGuard } from '../../core';

export const PROFILE_ROUTES: Routes = [
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./profile.component').then((m) => m.ProfileComponent),
  },
];
