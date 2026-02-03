import { User } from './user.model';

/**
 * Interface pour la réponse d'erreur API
 */
export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

/**
 * Interface générique pour les réponses API
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: ApiError;
  pagination?: Pagination;
}

/**
 * Interface pour la pagination
 */
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

/**
 * Interface pour la réponse d'authentification
 */
export interface AuthResponse {
  user: User;
  token: string;
}

/**
 * Interface pour la requête de connexion
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * Interface pour la requête d'inscription
 */
export interface RegisterRequest {
  email: string;
  password: string;
  confirmPassword: string;
  role: 'BUYER' | 'SELLER';
  profile: {
    firstName: string;
    lastName: string;
    phone?: string;
    address?: {
      street?: string;
      city?: string;
      postalCode?: string;
      country?: string;
    };
  };
}

/**
 * Interface pour la mise à jour du profil
 */
export interface UpdateProfileRequest {
  profile: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatar?: string;
    address?: {
      street?: string;
      city?: string;
      postalCode?: string;
      country?: string;
    };
  };
}

/**
 * Interface pour le changement de mot de passe
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Interface pour vérifier l'email
 */
export interface CheckEmailResponse {
  exists: boolean;
}
