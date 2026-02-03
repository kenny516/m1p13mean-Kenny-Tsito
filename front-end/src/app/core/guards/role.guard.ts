import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models';

/**
 * Factory pour créer un guard de rôle
 * Vérifie si l'utilisateur a le rôle requis pour accéder à la route
 * @param allowedRoles - Liste des rôles autorisés
 */
export const roleGuard = (allowedRoles: UserRole[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const user = authService.currentUser();

    if (!user) {
      router.navigate(['/auth/login']);
      return false;
    }

    if (allowedRoles.includes(user.role)) {
      return true;
    }

    router.navigate(['/unauthorized']);
    return false;
  };
};

/**
 * Guard pour les administrateurs uniquement
 */
export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.currentUser();

  if (!user) {
    router.navigate(['/auth/login']);
    return false;
  }

  if (user.role === 'ADMIN') {
    return true;
  }

  router.navigate(['/unauthorized']);
  return false;
};

/**
 * Guard pour les vendeurs uniquement
 */
export const sellerGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.currentUser();

  if (!user) {
    router.navigate(['/auth/login']);
    return false;
  }

  if (user.role === 'SELLER') {
    return true;
  }

  router.navigate(['/unauthorized']);
  return false;
};

/**
 * Guard pour les acheteurs uniquement
 */
export const buyerGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.currentUser();

  if (!user) {
    router.navigate(['/auth/login']);
    return false;
  }

  if (user.role === 'BUYER') {
    return true;
  }

  router.navigate(['/unauthorized']);
  return false;
};

/**
 * Guard pour les vendeurs et administrateurs
 */
export const sellerOrAdminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const user = authService.currentUser();

  if (!user) {
    router.navigate(['/auth/login']);
    return false;
  }

  if (user.role === 'SELLER' || user.role === 'ADMIN') {
    return true;
  }

  router.navigate(['/unauthorized']);
  return false;
};
