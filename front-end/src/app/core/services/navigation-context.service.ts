import { Injectable, signal, computed } from '@angular/core';

/**
 * Types de contexte de navigation
 */
export type NavigationContext = 'public' | 'admin' | 'seller' | 'buyer';

/**
 * Configuration d'un shell (sidebar)
 */
export interface ShellConfig {
  context: NavigationContext;
  title: string;
  icon?: string;
  subtitle?: string;
}

/**
 * Service de gestion du contexte de navigation
 * Permet au header principal de savoir dans quel shell on se trouve
 * et d'afficher les contrôles appropriés (bouton hamburger, titre, etc.)
 */
@Injectable({ providedIn: 'root' })
export class NavigationContextService {
  // Configuration du shell actif (null si pas dans un shell)
  private _shellConfig = signal<ShellConfig | null>(null);

  // État du menu mobile sidebar
  private _mobileMenuOpen = signal(false);

  // Exposer en lecture seule
  readonly shellConfig = this._shellConfig.asReadonly();
  readonly mobileMenuOpen = this._mobileMenuOpen.asReadonly();

  // Computed : est-on dans un shell avec sidebar ?
  readonly hasShell = computed(() => this._shellConfig() !== null);

  // Computed : contexte actuel
  readonly currentContext = computed<NavigationContext>(
    () => this._shellConfig()?.context ?? 'public'
  );

  /**
   * Enregistrer un shell (appelé par AdminShell, SellerShell, etc.)
   */
  registerShell(config: ShellConfig): void {
    this._shellConfig.set(config);
    this._mobileMenuOpen.set(false);
  }

  /**
   * Désenregistrer le shell (appelé au ngOnDestroy du shell)
   */
  unregisterShell(): void {
    this._shellConfig.set(null);
    this._mobileMenuOpen.set(false);
  }

  /**
   * Toggle du menu mobile sidebar
   */
  toggleMobileMenu(): void {
    this._mobileMenuOpen.update((open) => !open);
  }

  /**
   * Ouvrir le menu mobile
   */
  openMobileMenu(): void {
    this._mobileMenuOpen.set(true);
  }

  /**
   * Fermer le menu mobile
   */
  closeMobileMenu(): void {
    this._mobileMenuOpen.set(false);
  }
}
