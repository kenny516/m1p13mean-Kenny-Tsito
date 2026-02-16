import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard d'authentification
 * Protège les routes qui nécessitent une authentification
 */
export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  }

  // Rediriger vers la page de connexion
  router.navigate(['/auth/login']);
  return false;
};

/**
 * Guard pour les utilisateurs non authentifiés
 * Empêche les utilisateurs connectés d'accéder aux pages de login/register
 */
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);

  if (!authService.isAuthenticated()) {
    return true;
  }

  // Rediriger vers la page d'accueil selon le rôle
  authService.redirectByRole();
  return false;
};
