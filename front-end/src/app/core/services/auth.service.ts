import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from './api.service';
import {
  User,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  UpdateProfileRequest,
  ChangePasswordRequest,
  CheckEmailResponse,
} from '../models';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

/**
 * Service d'authentification
 * Gère la connexion, l'inscription, le profil et les tokens JWT
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private api = inject(ApiService);
  private router = inject(Router);

  // Signals pour l'état réactif
  private currentUserSignal = signal<User | null>(this.getStoredUser());
  private isLoadingSignal = signal(false);

  // Computeds publics
  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentUserSignal());
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly userRole = computed(() => this.currentUserSignal()?.role ?? null);

  constructor() {
    // Vérifier le token au démarrage
    this.checkAuthStatus();
  }

  /**
   * Récupère l'utilisateur stocké dans localStorage
   */
  private getStoredUser(): User | null {
    try {
      const userStr = localStorage.getItem(USER_KEY);
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }

  /**
   * Récupère le token stocké
   */
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  }

  /**
   * Vérifie le statut d'authentification au démarrage
   * Ne clear pas si on a déjà un user valide en localStorage et que l'erreur n'est pas un 401
   */
  private async checkAuthStatus(): Promise<void> {
    const token = this.getToken();
    const storedUser = this.getStoredUser();

    // Pas de token = pas d'auth
    if (!token) {
      this.clearAuth();
      return;
    }

    // Si on a un user stocké, on le garde tant que le token n'est pas explicitement invalide
    if (storedUser) {
      this.currentUserSignal.set(storedUser);
    }

    try {
      // Vérifier le token avec l'API et mettre à jour les données
      const user = await this.api.get<User>('/auth/me');
      this.currentUserSignal.set(user);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (error: unknown) {
      // Seulement clear si erreur d'authentification (401/403)
      // Pour les erreurs réseau, on garde la session
      const errorMsg = error instanceof Error ? error.message : '';
      const isAuthError =
        errorMsg.includes('non authentifié') ||
        errorMsg.includes('Token') ||
        errorMsg.includes('401') ||
        errorMsg.includes('403');

      if (isAuthError || !storedUser) {
        this.clearAuth();
      }
      // Sinon on garde le storedUser
    }
  }

  /**
   * Connexion utilisateur
   * @param credentials - Email et mot de passe
   */
  async login(credentials: LoginRequest): Promise<User> {
    this.isLoadingSignal.set(true);
    try {
      const response = await this.api.post<AuthResponse>(
        '/auth/login',
        credentials,
      );

      // Stocker le token et l'utilisateur
      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      this.currentUserSignal.set(response.user);

      return response.user;
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  /**
   * Inscription utilisateur
   * @param data - Données d'inscription
   */
  async register(data: RegisterRequest): Promise<User> {
    this.isLoadingSignal.set(true);
    try {
      const response = await this.api.post<AuthResponse>(
        '/auth/register',
        data,
      );

      // Stocker le token et l'utilisateur
      localStorage.setItem(TOKEN_KEY, response.token);
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      this.currentUserSignal.set(response.user);

      return response.user;
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  /**
   * Déconnexion
   */
  logout(): void {
    this.clearAuth();
    this.router.navigate(['/auth/login']);
  }

  /**
   * Efface les données d'authentification
   */
  private clearAuth(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.currentUserSignal.set(null);
  }

  /**
   * Récupère le profil utilisateur depuis l'API
   */
  async getProfile(): Promise<User> {
    const user = await this.api.get<User>('/auth/me');
    this.currentUserSignal.set(user);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  }

  /**
   * Met à jour le profil utilisateur
   * @param data - Données du profil à mettre à jour
   */
  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    this.isLoadingSignal.set(true);
    try {
      const user = await this.api.put<User>('/auth/profile', data);
      this.currentUserSignal.set(user);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return user;
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  /**
   * Change le mot de passe
   * @param data - Mot de passe actuel et nouveau
   */
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    this.isLoadingSignal.set(true);
    try {
      await this.api.put<void>('/auth/password', data);
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  /**
   * Vérifie si un email existe déjà
   * @param email - Email à vérifier
   */
  async checkEmail(email: string): Promise<boolean> {
    const response = await this.api.post<CheckEmailResponse>(
      '/auth/check-email',
      { email },
    );
    return response.exists;
  }

  /**
   * Redirige l'utilisateur selon son rôle
   */
  redirectByRole(): void {
    const user = this.currentUserSignal();
    if (!user) {
      this.router.navigate(['/auth/login']);
      return;
    }

    switch (user.role) {
      case 'ADMIN':
        this.router.navigate(['/admin']);
        break;
      case 'SELLER':
        this.router.navigate(['/seller']);
        break;
      case 'BUYER':
      default:
        this.router.navigate(['/buyer/products']);
        break;
    }
  }

  /**
   * Vérifie si l'utilisateur a un rôle spécifique
   * @param roles - Rôles autorisés
   */
  hasRole(...roles: string[]): boolean {
    const user = this.currentUserSignal();
    return user ? roles.includes(user.role) : false;
  }
}
