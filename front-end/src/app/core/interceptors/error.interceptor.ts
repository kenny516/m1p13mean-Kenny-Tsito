import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

/**
 * Interceptor HTTP pour gérer les erreurs
 * Intercepte les erreurs HTTP et affiche des messages appropriés
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const toastService = inject(ToastService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'Une erreur est survenue';

      if (error.error?.error?.message) {
        errorMessage = error.error.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      switch (error.status) {
        case 0:
          errorMessage = 'Impossible de se connecter au serveur';
          toastService.error(errorMessage);
          break;

        case 401:
          // Non authentifié - rediriger vers login
          authService.logout();
          toastService.error('Session expirée, veuillez vous reconnecter');
          router.navigate(['/auth/login']);
          break;

        case 403:
          // Accès refusé
          toastService.error('Accès non autorisé');
          router.navigate(['/']);
          break;

        case 404:
          // Ressource non trouvée
          toastService.error('Ressource non trouvée');
          break;

        case 409:
          // Conflit (ex: email existe déjà)
          toastService.error(errorMessage);
          break;

        case 422:
          // Erreur de validation
          toastService.error(errorMessage);
          break;

        case 429:
          // Trop de requêtes
          toastService.error('Trop de requêtes, veuillez réessayer plus tard');
          break;

        case 500:
          // Erreur serveur
          toastService.error('Erreur serveur, veuillez réessayer plus tard');
          break;

        default:
          toastService.error(errorMessage);
      }

      return throwError(() => error);
    }),
  );
};
