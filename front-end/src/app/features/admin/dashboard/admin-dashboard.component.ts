import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserService, ToastService, UserStats } from '../../../core';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900">
            Tableau de bord administrateur
          </h1>
          <p class="mt-2 text-gray-600">
            Vue d'ensemble de la plateforme et gestion des utilisateurs
          </p>
        </div>

        @if (isLoading()) {
          <!-- Loading State -->
          <div
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            @for (i of [1, 2, 3, 4]; track i) {
              <div class="bg-white rounded-xl shadow-sm p-6 animate-pulse">
                <div class="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div class="h-8 bg-gray-200 rounded w-1/3"></div>
              </div>
            }
          </div>
        } @else if (stats()) {
          <!-- Stats Cards -->
          <div
            class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          >
            <!-- Total Utilisateurs -->
            <div
              class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-blue-500"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-500">
                    Total Utilisateurs
                  </p>
                  <p class="text-3xl font-bold text-gray-900 mt-1">
                    {{ stats()!.total }}
                  </p>
                </div>
                <div class="p-3 bg-blue-100 rounded-full">
                  <svg
                    class="w-6 h-6 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <!-- Acheteurs -->
            <div
              class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-green-500"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-500">Acheteurs</p>
                  <p class="text-3xl font-bold text-gray-900 mt-1">
                    {{ stats()!.byRole.buyers }}
                  </p>
                </div>
                <div class="p-3 bg-green-100 rounded-full">
                  <svg
                    class="w-6 h-6 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <!-- Vendeurs -->
            <div
              class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-purple-500"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-500">Vendeurs</p>
                  <p class="text-3xl font-bold text-gray-900 mt-1">
                    {{ stats()!.byRole.sellers }}
                  </p>
                </div>
                <div class="p-3 bg-purple-100 rounded-full">
                  <svg
                    class="w-6 h-6 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <!-- En attente -->
            <div
              class="bg-white rounded-xl shadow-sm p-6 border-l-4 border-yellow-500"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-sm font-medium text-gray-500">
                    En attente de validation
                  </p>
                  <p class="text-3xl font-bold text-gray-900 mt-1">
                    {{ stats()!.pendingValidation }}
                  </p>
                </div>
                <div class="p-3 bg-yellow-100 rounded-full">
                  <svg
                    class="w-6 h-6 text-yellow-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Stats Row -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div class="bg-white rounded-xl shadow-sm p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">
                Statut des comptes
              </h3>
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-gray-600">Actifs</span>
                  <span
                    class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                  >
                    {{ stats()!.active }}
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-600">Inactifs</span>
                  <span
                    class="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium"
                  >
                    {{ stats()!.inactive }}
                  </span>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-xl shadow-sm p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">
                Répartition des rôles
              </h3>
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-gray-600">Administrateurs</span>
                  <span
                    class="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium"
                  >
                    {{ stats()!.byRole.admins }}
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-600">Vendeurs</span>
                  <span
                    class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                  >
                    {{ stats()!.byRole.sellers }}
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-gray-600">Acheteurs</span>
                  <span
                    class="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium"
                  >
                    {{ stats()!.byRole.buyers }}
                  </span>
                </div>
              </div>
            </div>

            <div class="bg-white rounded-xl shadow-sm p-6">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">
                Actions rapides
              </h3>
              <div class="space-y-3">
                <a
                  routerLink="/admin/users"
                  class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <span class="text-gray-700">Gérer les utilisateurs</span>
                  <svg
                    class="w-5 h-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </a>
                <a
                  routerLink="/admin/shops"
                  class="flex items-center justify-between p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <span class="text-purple-700">Gérer les boutiques</span>
                  <svg
                    class="w-5 h-5 text-purple-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </a>
                <a
                  routerLink="/admin/users/new"
                  class="flex items-center justify-between p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <span class="text-blue-700">Créer un utilisateur</span>
                  <svg
                    class="w-5 h-5 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class AdminDashboardComponent implements OnInit {
  private userService = inject(UserService);
  private toastService = inject(ToastService);

  stats = signal<UserStats | null>(null);
  isLoading = signal(false);

  async ngOnInit(): Promise<void> {
    await this.loadStats();
  }

  async loadStats(): Promise<void> {
    this.isLoading.set(true);
    try {
      const stats = await this.userService.getStats();
      this.stats.set(stats);
    } catch (error) {
      this.toastService.error('Erreur lors du chargement des statistiques');
      console.error(error);
    } finally {
      this.isLoading.set(false);
    }
  }
}
