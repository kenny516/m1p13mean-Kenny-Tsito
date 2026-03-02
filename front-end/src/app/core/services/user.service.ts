import { Injectable, inject, signal } from '@angular/core';
import { ApiService } from './api.service';
import {
  User,
  UserStats,
  CommissionStats,
  CommissionChartStats,
  CreateUserRequest,
  UpdateUserRequest,
} from '../models';
import { Pagination } from '../models/api.model';

/**
 * Interface pour les filtres de recherche utilisateurs
 */
export interface UserFilters {
  role?: string;
  isActive?: boolean;
  isValidated?: boolean;
  search?: string;
}

/**
 * Interface pour la réponse paginée des utilisateurs
 */
export interface UsersResponse {
  users: User[];
  pagination: Pagination;
}

/**
 * Service de gestion des utilisateurs (Admin)
 * Fournit les méthodes CRUD pour la gestion des utilisateurs
 */
@Injectable({ providedIn: 'root' })
export class UserService {
  private api = inject(ApiService);

  // Signals pour l'état réactif
  private usersSignal = signal<User[]>([]);
  private statsSignal = signal<UserStats | null>(null);
  private isLoadingSignal = signal(false);

  // Computeds publics
  readonly users = this.usersSignal.asReadonly();
  readonly stats = this.statsSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();

  /**
   * Récupère la liste des utilisateurs avec pagination et filtres
   */
  async getUsers(
    filters: UserFilters = {},
    page = 1,
    limit = 10,
  ): Promise<UsersResponse> {
    this.isLoadingSignal.set(true);
    try {
      const params: Record<string, string> = {
        page: page.toString(),
        limit: limit.toString(),
      };

      if (filters.role) params['role'] = filters.role;
      if (filters.isActive !== undefined)
        params['isActive'] = filters.isActive.toString();
      if (filters.isValidated !== undefined)
        params['isValidated'] = filters.isValidated.toString();
      if (filters.search) params['search'] = filters.search;

      const response = await this.api.getWithPagination<User[]>(
        '/admin/users',
        params,
      );

      const users = response.data || [];
      this.usersSignal.set(users);

      return {
        users,
        pagination: response.pagination!,
      };
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  /**
   * Récupère un utilisateur par son ID
   */
  async getUserById(userId: string): Promise<User> {
    return this.api.get<User>(`/admin/users/${userId}`);
  }

  /**
   * Crée un nouvel utilisateur
   */
  async createUser(data: CreateUserRequest): Promise<User> {
    this.isLoadingSignal.set(true);
    try {
      const user = await this.api.post<User>('/admin/users', data);
      // Rafraîchir la liste
      const currentUsers = this.usersSignal();
      this.usersSignal.set([user, ...currentUsers]);
      return user;
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  /**
   * Met à jour un utilisateur
   */
  async updateUser(userId: string, data: UpdateUserRequest): Promise<User> {
    this.isLoadingSignal.set(true);
    try {
      const user = await this.api.put<User>(`/admin/users/${userId}`, data);
      // Mettre à jour la liste
      const currentUsers = this.usersSignal();
      this.usersSignal.set(
        currentUsers.map((u) => (u._id === userId ? user : u)),
      );
      return user;
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  /**
   * Réinitialise le mot de passe d'un utilisateur
   */
  async resetPassword(userId: string, newPassword: string): Promise<void> {
    await this.api.put<void>(`/admin/users/${userId}/password`, {
      newPassword,
    });
  }

  /**
   * Active un utilisateur
   */
  async activateUser(userId: string): Promise<User> {
    const user = await this.api.patch<User>(
      `/admin/users/${userId}/activate`,
      {},
    );
    // Mettre à jour la liste
    const currentUsers = this.usersSignal();
    this.usersSignal.set(
      currentUsers.map((u) => (u._id === userId ? user : u)),
    );
    return user;
  }

  /**
   * Désactive un utilisateur
   */
  async deactivateUser(userId: string): Promise<User> {
    const user = await this.api.patch<User>(
      `/admin/users/${userId}/deactivate`,
      {},
    );
    // Mettre à jour la liste
    const currentUsers = this.usersSignal();
    this.usersSignal.set(
      currentUsers.map((u) => (u._id === userId ? user : u)),
    );
    return user;
  }

  /**
   * Valide un utilisateur
   */
  async validateUser(userId: string): Promise<User> {
    const user = await this.api.patch<User>(
      `/admin/users/${userId}/validate`,
      {},
    );
    // Mettre à jour la liste
    const currentUsers = this.usersSignal();
    this.usersSignal.set(
      currentUsers.map((u) => (u._id === userId ? user : u)),
    );
    return user;
  }

  /**
   * Supprime un utilisateur
   */
  async deleteUser(userId: string): Promise<void> {
    await this.api.delete<void>(`/admin/users/${userId}`);
    // Retirer de la liste
    const currentUsers = this.usersSignal();
    this.usersSignal.set(currentUsers.filter((u) => u._id !== userId));
  }

  /**
   * Récupère les statistiques des utilisateurs
   */
  async getStats(): Promise<UserStats> {
    const stats = await this.api.get<UserStats>('/admin/users/stats');
    this.statsSignal.set(stats);
    return stats;
  }

  /**
   * Récupère les statistiques de commission par boutique
   * Aggrège les commissions des ventes livrées (DELIVERED)
   */
  async getCommissionStats(): Promise<CommissionStats> {
    return this.api.get<CommissionStats>('/admin/stats/commissions');
  }

  /**
   * Récupère les statistiques de commission par période pour les charts
   * @param groupBy - Groupement par 'day', 'week' ou 'month'
   * @param startDate - Date de début (optionnel)
   * @param endDate - Date de fin (optionnel)
   */
  async getCommissionChartStats(
    groupBy: 'day' | 'week' | 'month' = 'day',
    startDate?: string,
    endDate?: string
  ): Promise<CommissionChartStats> {
    let url = `/admin/stats/commissions/chart?groupBy=${groupBy}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    return this.api.get<CommissionChartStats>(url);
  }
}
