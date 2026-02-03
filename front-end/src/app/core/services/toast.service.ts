import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

/**
 * Service de notification toast
 * Permet d'afficher des messages temporaires à l'utilisateur
 */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private toastsSignal = signal<ToastMessage[]>([]);
  private counter = 0;

  readonly toasts = this.toastsSignal.asReadonly();

  /**
   * Affiche un toast de succès
   */
  success(message: string, duration = 3000): void {
    this.addToast('success', message, duration);
  }

  /**
   * Affiche un toast d'erreur
   */
  error(message: string, duration = 5000): void {
    this.addToast('error', message, duration);
  }

  /**
   * Affiche un toast d'information
   */
  info(message: string, duration = 3000): void {
    this.addToast('info', message, duration);
  }

  /**
   * Affiche un toast d'avertissement
   */
  warning(message: string, duration = 4000): void {
    this.addToast('warning', message, duration);
  }

  /**
   * Ajoute un toast à la liste
   */
  private addToast(
    type: ToastMessage['type'],
    message: string,
    duration: number,
  ): void {
    const id = ++this.counter;
    const toast: ToastMessage = { id, type, message, duration };

    this.toastsSignal.update((toasts) => [...toasts, toast]);

    // Supprimer automatiquement après la durée
    if (duration > 0) {
      setTimeout(() => this.removeToast(id), duration);
    }
  }

  /**
   * Supprime un toast de la liste
   */
  removeToast(id: number): void {
    this.toastsSignal.update((toasts) => toasts.filter((t) => t.id !== id));
  }

  /**
   * Supprime tous les toasts
   */
  clearAll(): void {
    this.toastsSignal.set([]);
  }
}
