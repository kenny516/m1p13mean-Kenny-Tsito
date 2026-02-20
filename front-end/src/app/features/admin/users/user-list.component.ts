import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService, UserFilters, ToastService, User } from '../../../core';
import { Pagination } from '../../../core/models/api.model';
import { ZardCardComponent } from '@/shared/components/card';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardBadgeComponent } from '@/shared/components/badge';
import { ZardSelectImports } from '@/shared/components/select';
import { ZardSkeletonComponent } from '@/shared/components/skeleton';
import { ZardAvatarComponent } from '@/shared/components/avatar';
import { ZardInputDirective } from '@/shared/components/input';
import { ZardIconComponent } from '@/shared/components/icon';
import { ZardLabelComponent } from '@/shared/components/label';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    ZardCardComponent,
    ZardButtonComponent,
    ZardBadgeComponent,
    ...ZardSelectImports,
    ZardSkeletonComponent,
    ZardAvatarComponent,
    ZardInputDirective,
    ZardIconComponent,
    ZardLabelComponent,
  ],
  template: `
    <div class="min-h-screen bg-muted/30 py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div
          class="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8"
        >
          <div>
            <h1 class="text-2xl font-bold text-foreground">
              Gestion des utilisateurs
            </h1>
            <p class="mt-1 text-muted-foreground">
              Gérez tous les utilisateurs de la plateforme
            </p>
          </div>
          <div class="mt-4 sm:mt-0">
            <a z-button routerLink="/admin/users/new">
              <z-icon zType="plus" class="mr-2" />
              Nouvel utilisateur
            </a>
          </div>
        </div>

        <!-- Filters -->
        <z-card class="mb-6">
          <div class="p-4">
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <!-- Search -->
              <div class="md:col-span-2">
                <z-label for="search">Rechercher</z-label>
                <input
                  z-input
                  id="search"
                  type="text"
                  [(ngModel)]="searchTerm"
                  (input)="onSearch()"
                  placeholder="Nom, prénom ou email..."
                  class="mt-1"
                />
              </div>

              <!-- Role Filter -->
              <div>
                <z-label>Rôle</z-label>
                <z-select
                  [(zValue)]="selectedRole"
                  (zSelectionChange)="onFilterChange()"
                  zPlaceholder="Tous les rôles"
                  class="mt-1 w-full"
                >
                  <z-select-item zValue="">Tous les rôles</z-select-item>
                  <z-select-item zValue="BUYER">Acheteur</z-select-item>
                  <z-select-item zValue="SELLER">Vendeur</z-select-item>
                  <z-select-item zValue="ADMIN">Administrateur</z-select-item>
                </z-select>
              </div>

              <!-- Status Filter -->
              <div>
                <z-label>Statut</z-label>
                <z-select
                  [(zValue)]="selectedStatus"
                  (zSelectionChange)="onFilterChange()"
                  zPlaceholder="Tous les statuts"
                  class="mt-1 w-full"
                >
                  <z-select-item zValue="">Tous les statuts</z-select-item>
                  <z-select-item zValue="active">Actif</z-select-item>
                  <z-select-item zValue="inactive">Inactif</z-select-item>
                  <z-select-item zValue="pending">En attente</z-select-item>
                </z-select>
              </div>
            </div>
          </div>
        </z-card>

        <!-- Users Table -->
        <z-card class="overflow-hidden">
          @if (isLoading()) {
            <!-- Loading State -->
            <div class="p-8 space-y-4">
              @for (i of [1, 2, 3, 4, 5]; track i) {
                <div class="flex items-center space-x-4">
                  <z-skeleton class="w-10 h-10 rounded-full" />
                  <div class="flex-1 space-y-2">
                    <z-skeleton class="h-4 w-1/4" />
                    <z-skeleton class="h-3 w-1/3" />
                  </div>
                </div>
              }
            </div>
          } @else if (users().length === 0) {
            <!-- Empty State -->
            <div class="p-12 text-center">
              <z-icon
                zType="users"
                class="mx-auto h-12 w-12 text-muted-foreground"
              />
              <h3 class="mt-4 text-lg font-medium text-foreground">
                Aucun utilisateur trouvé
              </h3>
              <p class="mt-2 text-muted-foreground">
                Modifiez vos filtres ou créez un nouvel utilisateur
              </p>
            </div>
          } @else {
            <!-- Table -->
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-border">
                <thead class="bg-muted/50">
                  <tr>
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                    >
                      Utilisateur
                    </th>
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                    >
                      Rôle
                    </th>
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                    >
                      Statut
                    </th>
                    <th
                      class="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                    >
                      Date d'inscription
                    </th>
                    <th
                      class="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-card divide-y divide-border">
                  @for (user of users(); track user._id) {
                    <tr class="hover:bg-muted/50 transition-colors">
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                          <z-avatar
                            [zAlt]="
                              user.profile.firstName +
                              ' ' +
                              user.profile.lastName
                            "
                            [zFallback]="getInitials(user)"
                            class="h-10 w-10"
                          />
                          <div class="ml-4">
                            <div class="text-sm font-medium text-foreground">
                              {{ user.profile.firstName }}
                              {{ user.profile.lastName }}
                            </div>
                            <div class="text-sm text-muted-foreground">
                              {{ user.email }}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <z-badge [zType]="getRoleBadgeType(user.role)">
                          {{ getRoleLabel(user.role) }}
                        </z-badge>
                      </td>
                      <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center space-x-2">
                          <z-badge
                            [zType]="user.isActive ? 'default' : 'destructive'"
                          >
                            {{ user.isActive ? 'Actif' : 'Inactif' }}
                          </z-badge>
                          @if (!user.isValidated) {
                            <z-badge zType="outline"> Non validé </z-badge>
                          }
                        </div>
                      </td>
                      <td
                        class="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground"
                      >
                        {{ user.createdAt | date: 'dd/MM/yyyy' }}
                      </td>
                      <td
                        class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium"
                      >
                        <div class="flex items-center justify-end space-x-1">
                          <a
                            z-button
                            zType="ghost"
                            zSize="sm"
                            data-icon-only
                            [routerLink]="['/admin/users', user._id]"
                            title="Voir"
                          >
                            <z-icon zType="eye" />
                          </a>
                          <a
                            z-button
                            zType="ghost"
                            zSize="sm"
                            data-icon-only
                            [routerLink]="['/admin/users', user._id, 'edit']"
                            title="Modifier"
                          >
                            <z-icon zType="settings" />
                          </a>
                          @if (!user.isValidated) {
                            <button
                              z-button
                              zType="ghost"
                              zSize="sm"
                              data-icon-only
                              (click)="validateUser(user)"
                              title="Valider"
                              class="text-green-600 hover:text-green-700"
                            >
                              <z-icon zType="check" />
                            </button>
                          }
                          @if (user.isActive) {
                            <button
                              z-button
                              zType="ghost"
                              zSize="sm"
                              data-icon-only
                              (click)="deactivateUser(user)"
                              title="Désactiver"
                              class="text-destructive hover:text-destructive/80"
                            >
                              <z-icon zType="ban" />
                            </button>
                          } @else {
                            <button
                              z-button
                              zType="ghost"
                              zSize="sm"
                              data-icon-only
                              (click)="activateUser(user)"
                              title="Activer"
                              class="text-green-600 hover:text-green-700"
                            >
                              <z-icon zType="circle-check" />
                            </button>
                          }
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Pagination -->
            @if (pagination()) {
              <div
                class="px-6 py-4 border-t border-border flex items-center justify-between"
              >
                <div class="text-sm text-muted-foreground">
                  Affichage de
                  <span class="font-medium text-foreground">
                    {{ (pagination()!.page - 1) * pagination()!.limit + 1 }}
                  </span>
                  à
                  <span class="font-medium text-foreground">
                    {{
                      Math.min(
                        pagination()!.page * pagination()!.limit,
                        pagination()!.total
                      )
                    }}
                  </span>
                  sur
                  <span class="font-medium text-foreground">{{
                    pagination()!.total
                  }}</span>
                  résultats
                </div>
                <div class="flex space-x-2">
                  <button
                    z-button
                    zType="outline"
                    zSize="sm"
                    (click)="goToPage(currentPage() - 1)"
                    [disabled]="currentPage() === 1"
                  >
                    <z-icon zType="chevron-left" class="mr-1" />
                    Précédent
                  </button>
                  <button
                    z-button
                    zType="outline"
                    zSize="sm"
                    (click)="goToPage(currentPage() + 1)"
                    [disabled]="currentPage() >= pagination()!.pages"
                  >
                    Suivant
                    <z-icon zType="chevron-right" class="ml-1" />
                  </button>
                </div>
              </div>
            }
          }
        </z-card>
      </div>
    </div>
  `,
})
export class UserListComponent implements OnInit {
  private userService = inject(UserService);
  private toastService = inject(ToastService);

  users = signal<User[]>([]);
  pagination = signal<Pagination | null>(null);
  isLoading = signal(false);
  currentPage = signal(1);

  searchTerm = '';
  selectedRole = '';
  selectedStatus = '';

  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  Math = Math;

  async ngOnInit(): Promise<void> {
    await this.loadUsers();
  }

  async loadUsers(): Promise<void> {
    this.isLoading.set(true);
    try {
      const filters: UserFilters = {};

      if (this.searchTerm) filters.search = this.searchTerm;
      if (this.selectedRole) filters.role = this.selectedRole;
      if (this.selectedStatus === 'active') filters.isActive = true;
      if (this.selectedStatus === 'inactive') filters.isActive = false;
      if (this.selectedStatus === 'pending') filters.isValidated = false;

      const response = await this.userService.getUsers(
        filters,
        this.currentPage(),
        10,
      );

      this.users.set(response.users);
      this.pagination.set(response.pagination);
    } catch (err) {
      this.toastService.error('Erreur lors du chargement des utilisateurs');
      console.error(err);
    } finally {
      this.isLoading.set(false);
    }
  }

  onSearch(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
    this.searchTimeout = setTimeout(() => {
      this.currentPage.set(1);
      this.loadUsers();
    }, 300);
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadUsers();
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadUsers();
  }

  getInitials(user: User): string {
    const first = user.profile?.firstName?.charAt(0) || '';
    const last = user.profile?.lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || user.email.charAt(0).toUpperCase();
  }

  getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      BUYER: 'Acheteur',
      SELLER: 'Vendeur',
      ADMIN: 'Administrateur',
    };
    return labels[role] || role;
  }

  getRoleBadgeType(
    role: string,
  ): 'default' | 'secondary' | 'destructive' | 'outline' {
    const types: Record<
      string,
      'default' | 'secondary' | 'destructive' | 'outline'
    > = {
      BUYER: 'secondary',
      SELLER: 'default',
      ADMIN: 'outline',
    };
    return types[role] || 'secondary';
  }

  async validateUser(user: User): Promise<void> {
    try {
      await this.userService.validateUser(user._id);
      this.toastService.success('Utilisateur validé avec succès');
      await this.loadUsers();
    } catch {
      this.toastService.error("Erreur lors de la validation de l'utilisateur");
    }
  }

  async activateUser(user: User): Promise<void> {
    try {
      await this.userService.activateUser(user._id);
      this.toastService.success('Utilisateur activé avec succès');
      await this.loadUsers();
    } catch {
      this.toastService.error("Erreur lors de l'activation de l'utilisateur");
    }
  }

  async deactivateUser(user: User): Promise<void> {
    if (confirm('Êtes-vous sûr de vouloir désactiver cet utilisateur ?')) {
      try {
        await this.userService.deactivateUser(user._id);
        this.toastService.success('Utilisateur désactivé avec succès');
        await this.loadUsers();
      } catch {
        this.toastService.error(
          "Erreur lors de la désactivation de l'utilisateur",
        );
      }
    }
  }
}
