import {
  Component,
  inject,
  OnInit,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService, UserFilters, ToastService, User } from '../../../core';
import { Pagination } from '../../../core/models/api.model';
import { ZardCardComponent } from '@/shared/components/card';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardBadgeComponent } from '@/shared/components/badge';
import { ZardSelectImports } from '@/shared/components/select';
import { ZardAvatarComponent } from '@/shared/components/avatar';
import { ZardInputDirective } from '@/shared/components/input';
import { ZardIconComponent } from '@/shared/components/icon';
import { ZardLabelComponent } from '@/shared/components/label';
import {
  TanstackDataTableComponent,
  DataTableColumnDef,
  SortChangeEvent,
  CellTemplateContext,
} from '@/shared/components/data-table';
import { ZardDialogService } from '@/shared/components/dialog';
import {
  UserDetailDialogComponent,
  UserDetailDialogData,
} from './user-detail-dialog.component';

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
    ZardAvatarComponent,
    ZardInputDirective,
    ZardIconComponent,
    ZardLabelComponent,
    TanstackDataTableComponent,
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
          <div class="mt-4 sm:mt-0 flex items-center gap-4">
            @if (pendingCount() > 0) {
              <z-badge
                zType="destructive"
                zShape="pill"
                class="text-sm px-3 py-1"
              >
                {{ pendingCount() }} en attente
              </z-badge>
            }
            <a z-button routerLink="/admin/users/new">
              <z-icon zType="plus" class="mr-2" />
              Nouvel utilisateur
            </a>
          </div>
        </div>

        <!-- Filtres -->
        <z-card class="mb-6">
          <div class="p-4">
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <!-- Recherche -->
              <div class="lg:col-span-2">
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

              <!-- Filtre Rôle -->
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

              <!-- Filtre Statut -->
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

              <!-- Tri -->
              <div>
                <z-label>Trier par</z-label>
                <z-select
                  [(zValue)]="selectedSort"
                  (zSelectionChange)="onFilterChange()"
                  zPlaceholder="Date inscription"
                  class="mt-1 w-full"
                >
                  <z-select-item zValue="-createdAt">Plus récent</z-select-item>
                  <z-select-item zValue="createdAt">Plus ancien</z-select-item>
                  <z-select-item zValue="profile.firstName">Prénom A-Z</z-select-item>
                  <z-select-item zValue="-profile.firstName">Prénom Z-A</z-select-item>
                  <z-select-item zValue="email">Email A-Z</z-select-item>
                </z-select>
              </div>
            </div>
          </div>
        </z-card>

        <!-- Table des utilisateurs -->
        <z-card class="overflow-hidden">
          <app-tanstack-data-table
            [data]="users()"
            [columnDefs]="columns"
            [rowActions]="actionsTemplate"
            [cellTemplates]="cellTemplatesMap()"
            [isLoading]="isLoading()"
            [emptyMessage]="'Aucun utilisateur trouvé'"
            [emptyIcon]="'users'"
            (sortChange)="onSortChange($event)"
          />

          <!-- Pagination -->
          @if (pagination() && !isLoading()) {
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
        </z-card>
      </div>
    </div>

    <!-- Template pour la colonne Avatar -->
    <ng-template #avatarCell let-user>
      <z-avatar
        [zAlt]="user.profile.firstName + ' ' + user.profile.lastName"
        [zFallback]="getInitials(user)"
        class="h-10 w-10"
      />
    </ng-template>

    <!-- Template pour la colonne Utilisateur -->
    <ng-template #userCell let-user>
      <div class="flex flex-col">
        <span class="font-medium text-foreground">
          {{ user.profile.firstName }} {{ user.profile.lastName }}
        </span>
        <span class="text-sm text-muted-foreground">
          {{ user.email }}
        </span>
      </div>
    </ng-template>

    <!-- Template pour la colonne Rôle -->
    <ng-template #roleCell let-user>
      <z-badge [zType]="getRoleBadgeType(user.role)" zShape="pill">
        {{ getRoleLabel(user.role) }}
      </z-badge>
    </ng-template>

    <!-- Template pour la colonne Statut -->
    <ng-template #statusCell let-user>
      <div class="flex items-center gap-2">
        <z-badge [zType]="user.isActive ? 'default' : 'destructive'" zShape="pill">
          {{ user.isActive ? 'Actif' : 'Inactif' }}
        </z-badge>
        @if (!user.isValidated) {
          <z-badge zType="outline" zShape="pill">Non validé</z-badge>
        }
      </div>
    </ng-template>

    <!-- Template pour la colonne Date -->
    <ng-template #dateCell let-user>
      {{ user.createdAt | date: 'dd/MM/yyyy' }}
    </ng-template>

    <!-- Template pour les actions -->
    <ng-template #actionsTemplate let-user>
      <div class="flex items-center justify-end space-x-1">
        <button
          z-button
          zType="ghost"
          zSize="sm"
          data-icon-only
          (click)="viewDetails(user)"
          title="Voir détails"
        >
          <z-icon zType="eye" />
        </button>
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
    </ng-template>
  `,
})
export class UserListComponent implements OnInit {
  private userService = inject(UserService);
  private toastService = inject(ToastService);
  private dialogService = inject(ZardDialogService);

  // Signals d'état
  users = signal<User[]>([]);
  pagination = signal<Pagination | null>(null);
  isLoading = signal(false);
  currentPage = signal(1);
  pendingCount = signal(0);

  // Filtres
  searchTerm = '';
  selectedRole = '';
  selectedStatus = '';
  selectedSort = '-createdAt';

  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  Math = Math;

  // ViewChildren pour les templates
  readonly avatarTemplate =
    viewChild<TemplateRef<CellTemplateContext<User>>>('avatarCell');
  readonly userTemplate =
    viewChild<TemplateRef<CellTemplateContext<User>>>('userCell');
  readonly roleTemplate =
    viewChild<TemplateRef<CellTemplateContext<User>>>('roleCell');
  readonly statusTemplate =
    viewChild<TemplateRef<CellTemplateContext<User>>>('statusCell');
  readonly dateTemplate =
    viewChild<TemplateRef<CellTemplateContext<User>>>('dateCell');
  readonly actionsTemplate =
    viewChild<TemplateRef<{ $implicit: User }>>('actionsTemplate');

  // Définition des colonnes
  columns: DataTableColumnDef<User>[] = [
    {
      id: 'avatar',
      header: '',
      accessorKey: 'profile',
      enableSorting: false,
      meta: { headerClass: 'w-16', cellClass: 'w-16' },
    },
    {
      id: 'user',
      header: 'Utilisateur',
      accessorKey: 'profile.firstName',
      enableSorting: true,
    },
    {
      id: 'role',
      header: 'Rôle',
      accessorKey: 'role',
      enableSorting: false,
      meta: { headerClass: 'w-32', cellClass: 'w-32' },
    },
    {
      id: 'status',
      header: 'Statut',
      accessorKey: 'isActive',
      enableSorting: false,
      meta: { headerClass: 'w-40', cellClass: 'w-40' },
    },
    {
      id: 'createdAt',
      header: "Date d'inscription",
      accessorKey: 'createdAt',
      enableSorting: true,
      meta: { headerClass: 'w-36', cellClass: 'w-36' },
    },
  ];

  // Map des templates de cellules
  cellTemplatesMap = signal<
    Record<string, TemplateRef<CellTemplateContext<User>>>
  >({});

  async ngOnInit(): Promise<void> {
    await this.loadUsers();
    await this.loadPendingCount();

    // Initialiser les templates après le rendu
    setTimeout(() => {
      this.cellTemplatesMap.set({
        avatar: this.avatarTemplate()!,
        user: this.userTemplate()!,
        role: this.roleTemplate()!,
        status: this.statusTemplate()!,
        createdAt: this.dateTemplate()!,
      });
    });
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

  async loadPendingCount(): Promise<void> {
    try {
      const response = await this.userService.getUsers(
        { isValidated: false },
        1,
        1,
      );
      this.pendingCount.set(response.pagination.total);
    } catch {
      // Ignorer l'erreur, ce n'est pas critique
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

  onSortChange(event: SortChangeEvent): void {
    if (event.direction === null) {
      this.selectedSort = '-createdAt';
    } else {
      const prefix = event.direction === 'desc' ? '-' : '';
      this.selectedSort = `${prefix}${event.column}`;
    }
    this.loadUsers();
  }

  goToPage(page: number): void {
    this.currentPage.set(page);
    this.loadUsers();
  }

  // === Helpers ===

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

  // === Dialogs ===

  viewDetails(user: User): void {
    const dialogData: UserDetailDialogData = {
      user,
      onValidate: () => this.validateUser(user),
      onToggleActive: () =>
        user.isActive ? this.deactivateUser(user) : this.activateUser(user),
    };

    this.dialogService.create({
      zContent: UserDetailDialogComponent,
      zTitle: "Détails de l'utilisateur",
      zDescription: `${user.profile.firstName} ${user.profile.lastName}`,
      zData: dialogData,
      zWidth: '500px',
      zHideFooter: true,
      zClosable: true,
    });
  }

  // === Actions ===

  async validateUser(user: User): Promise<void> {
    try {
      await this.userService.validateUser(user._id);
      this.toastService.success('Utilisateur validé avec succès');
      await this.loadUsers();
      await this.loadPendingCount();
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
