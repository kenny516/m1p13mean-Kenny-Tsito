import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService, ToastService, User } from '../../../core';
import { ZardCardComponent } from '@/shared/components/card';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardBadgeComponent } from '@/shared/components/badge';
import { ZardAvatarComponent } from '@/shared/components/avatar';
import { ZardIconComponent } from '@/shared/components/icon';
import { ZardSkeletonComponent } from '@/shared/components/skeleton';
import { ZardLabelComponent } from '@/shared/components/label';
import { ZardInputDirective } from '@/shared/components/input';
import { ZardSeparatorComponent } from '@/shared/components/separator';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    ZardCardComponent,
    ZardButtonComponent,
    ZardBadgeComponent,
    ZardAvatarComponent,
    ZardIconComponent,
    ZardSkeletonComponent,
    ZardLabelComponent,
    ZardInputDirective,
    ZardSeparatorComponent,
  ],
  template: `
    <div class="min-h-screen bg-muted/30 py-8">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Back Button -->
        <div class="mb-6">
          <a z-button zType="ghost" routerLink="/admin/users">
            <z-icon zType="arrow-left" class="mr-2" />
            Retour à la liste
          </a>
        </div>

        @if (isLoading()) {
          <!-- Loading State -->
          <z-card class="p-8">
            <div class="flex items-center space-x-6">
              <z-skeleton class="w-20 h-20 rounded-full" />
              <div class="flex-1 space-y-2">
                <z-skeleton class="h-6 w-1/3" />
                <z-skeleton class="h-4 w-1/4" />
              </div>
            </div>
          </z-card>
        } @else if (user()) {
          <!-- User Header -->
          <z-card class="p-6 mb-6">
            <div
              class="flex flex-col sm:flex-row sm:items-center sm:justify-between"
            >
              <div class="flex items-center">
                <z-avatar
                  [zAlt]="
                    user()!.profile.firstName + ' ' + user()!.profile.lastName
                  "
                  [zFallback]="getInitials(user()!)"
                  class="h-20 w-20 text-2xl"
                />
                <div class="ml-6">
                  <h1 class="text-2xl font-bold text-foreground">
                    {{ user()!.profile.firstName }}
                    {{ user()!.profile.lastName }}
                  </h1>
                  <p class="text-muted-foreground">{{ user()!.email }}</p>
                  <div class="flex items-center mt-2 space-x-2">
                    <z-badge [zType]="getRoleBadgeType(user()!.role)">
                      {{ getRoleLabel(user()!.role) }}
                    </z-badge>
                    <z-badge
                      [zType]="user()!.isActive ? 'default' : 'destructive'"
                    >
                      {{ user()!.isActive ? 'Actif' : 'Inactif' }}
                    </z-badge>
                    @if (!user()!.isValidated) {
                      <z-badge zType="outline">Non validé</z-badge>
                    }
                  </div>
                </div>
              </div>
              <div class="mt-4 sm:mt-0 flex space-x-3">
                <a
                  z-button
                  [routerLink]="['/admin/users', user()!._id, 'edit']"
                >
                  <z-icon zType="file-text" class="mr-2" />
                  Modifier
                </a>
                <button z-button zType="destructive" (click)="deleteUser()">
                  <z-icon zType="trash" class="mr-2" />
                  Supprimer
                </button>
              </div>
            </div>
          </z-card>

          <!-- User Details -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Profile Information -->
            <z-card class="p-6">
              <h2 class="text-lg font-semibold text-foreground mb-4">
                Informations personnelles
              </h2>
              <dl class="space-y-4">
                <div>
                  <dt class="text-sm font-medium text-muted-foreground">
                    Prénom
                  </dt>
                  <dd class="mt-1 text-sm text-foreground">
                    {{ user()!.profile.firstName || '-' }}
                  </dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-muted-foreground">Nom</dt>
                  <dd class="mt-1 text-sm text-foreground">
                    {{ user()!.profile.lastName || '-' }}
                  </dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-muted-foreground">
                    Email
                  </dt>
                  <dd class="mt-1 text-sm text-foreground">
                    {{ user()!.email }}
                  </dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-muted-foreground">
                    Téléphone
                  </dt>
                  <dd class="mt-1 text-sm text-foreground">
                    {{ user()!.profile.phone || '-' }}
                  </dd>
                </div>
              </dl>
            </z-card>

            <!-- Address -->
            <z-card class="p-6">
              <h2 class="text-lg font-semibold text-foreground mb-4">
                Adresse
              </h2>
              <dl class="space-y-4">
                <div>
                  <dt class="text-sm font-medium text-muted-foreground">Rue</dt>
                  <dd class="mt-1 text-sm text-foreground">
                    {{ user()!.profile.address?.street || '-' }}
                  </dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-muted-foreground">
                    Ville
                  </dt>
                  <dd class="mt-1 text-sm text-foreground">
                    {{ user()!.profile.address?.city || '-' }}
                  </dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-muted-foreground">
                    Code postal
                  </dt>
                  <dd class="mt-1 text-sm text-foreground">
                    {{ user()!.profile.address?.postalCode || '-' }}
                  </dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-muted-foreground">
                    Pays
                  </dt>
                  <dd class="mt-1 text-sm text-foreground">
                    {{ user()!.profile.address?.country || 'Madagascar' }}
                  </dd>
                </div>
              </dl>
            </z-card>

            <!-- Wallet Information -->
            @if (user()!.wallet) {
              <z-card class="p-6">
                <h2 class="text-lg font-semibold text-foreground mb-4">
                  Portefeuille
                </h2>
                <div
                  class="bg-gradient-to-br from-primary to-primary/60 rounded-lg p-6 text-primary-foreground"
                >
                  <p class="text-sm opacity-80">Solde disponible</p>
                  <p class="text-3xl font-bold mt-1">
                    {{ user()!.wallet!.balance | number: '1.0-0' }}
                    {{ user()!.wallet!.currency }}
                  </p>
                  @if (user()!.wallet!.pendingBalance) {
                    <z-separator class="my-4 bg-primary-foreground/20" />
                    <p class="text-sm opacity-80">En attente</p>
                    <p class="text-xl font-semibold">
                      {{ user()!.wallet!.pendingBalance | number: '1.0-0' }}
                      {{ user()!.wallet!.currency }}
                    </p>
                  }
                </div>
                <div class="mt-4 grid grid-cols-2 gap-4">
                  <div class="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <p class="text-sm text-green-600 dark:text-green-400">
                      Total gagné
                    </p>
                    <p
                      class="text-lg font-semibold text-green-800 dark:text-green-200"
                    >
                      {{ user()!.wallet!.totalEarned || 0 | number: '1.0-0' }}
                      {{ user()!.wallet!.currency }}
                    </p>
                  </div>
                  <div class="p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                    <p class="text-sm text-red-600 dark:text-red-400">
                      Total dépensé
                    </p>
                    <p
                      class="text-lg font-semibold text-red-800 dark:text-red-200"
                    >
                      {{ user()!.wallet!.totalSpent || 0 | number: '1.0-0' }}
                      {{ user()!.wallet!.currency }}
                    </p>
                  </div>
                </div>
              </z-card>
            }

            <!-- Account Information -->
            <z-card class="p-6">
              <h2 class="text-lg font-semibold text-foreground mb-4">
                Informations du compte
              </h2>
              <dl class="space-y-4">
                <div>
                  <dt class="text-sm font-medium text-muted-foreground">
                    Date d'inscription
                  </dt>
                  <dd class="mt-1 text-sm text-foreground">
                    {{ user()!.createdAt | date: 'dd MMMM yyyy à HH:mm' }}
                  </dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-muted-foreground">
                    Dernière mise à jour
                  </dt>
                  <dd class="mt-1 text-sm text-foreground">
                    {{ user()!.updatedAt | date: 'dd MMMM yyyy à HH:mm' }}
                  </dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-muted-foreground">
                    ID utilisateur
                  </dt>
                  <dd class="mt-1 text-sm text-muted-foreground font-mono">
                    {{ user()!._id }}
                  </dd>
                </div>
              </dl>
            </z-card>
          </div>

          <!-- Quick Actions -->
          <z-card class="p-6 mt-6">
            <h2 class="text-lg font-semibold text-foreground mb-4">
              Actions rapides
            </h2>
            <div class="flex flex-wrap gap-3">
              @if (!user()!.isValidated) {
                <button
                  z-button
                  (click)="validateUser()"
                  class="bg-green-600 hover:bg-green-700"
                >
                  <z-icon zType="check" class="mr-2" />
                  Valider le compte
                </button>
              }
              @if (user()!.isActive) {
                <button z-button zType="secondary" (click)="deactivateUser()">
                  <z-icon zType="ban" class="mr-2" />
                  Désactiver le compte
                </button>
              } @else {
                <button
                  z-button
                  (click)="activateUser()"
                  class="bg-green-600 hover:bg-green-700"
                >
                  <z-icon zType="circle-check" class="mr-2" />
                  Activer le compte
                </button>
              }
              <button
                z-button
                zType="outline"
                (click)="showResetPasswordModal = true"
              >
                <z-icon zType="shield" class="mr-2" />
                Réinitialiser le mot de passe
              </button>
            </div>
          </z-card>

          <!-- Reset Password Modal -->
          @if (showResetPasswordModal) {
            <div
              class="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
              (click)="showResetPasswordModal = false"
            >
              <z-card
                class="w-full max-w-md mx-4 p-6"
                (click)="$event.stopPropagation()"
              >
                <div class="flex justify-between items-center mb-4">
                  <h3 class="text-lg font-semibold text-foreground">
                    Réinitialiser le mot de passe
                  </h3>
                  <button
                    z-button
                    zType="ghost"
                    zSize="sm"
                    data-icon-only
                    (click)="showResetPasswordModal = false"
                  >
                    <z-icon zType="x" />
                  </button>
                </div>
                <p class="text-sm text-muted-foreground mb-4">
                  Entrez un nouveau mot de passe pour cet utilisateur.
                </p>
                <div class="mb-4">
                  <z-label for="newPassword">Nouveau mot de passe</z-label>
                  <input
                    z-input
                    type="password"
                    id="newPassword"
                    [(ngModel)]="newPassword"
                    class="mt-1 w-full"
                    placeholder="Minimum 8 caractères"
                  />
                </div>
                <div class="flex justify-end space-x-3">
                  <button
                    z-button
                    zType="outline"
                    (click)="showResetPasswordModal = false"
                  >
                    Annuler
                  </button>
                  <button
                    z-button
                    (click)="resetPassword()"
                    [disabled]="newPassword.length < 8"
                  >
                    Réinitialiser
                  </button>
                </div>
              </z-card>
            </div>
          }
        }
      </div>
    </div>
  `,
})
export class UserDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private userService = inject(UserService);
  private toastService = inject(ToastService);

  user = signal<User | null>(null);
  isLoading = signal(false);
  showResetPasswordModal = false;
  newPassword = '';

  async ngOnInit(): Promise<void> {
    const userId = this.route.snapshot.paramMap.get('id');
    if (userId) {
      await this.loadUser(userId);
    }
  }

  async loadUser(userId: string): Promise<void> {
    this.isLoading.set(true);
    try {
      const user = await this.userService.getUserById(userId);
      this.user.set(user);
    } catch (error) {
      this.toastService.error("Erreur lors du chargement de l'utilisateur");
      this.router.navigate(['/admin/users']);
    } finally {
      this.isLoading.set(false);
    }
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

  async validateUser(): Promise<void> {
    try {
      await this.userService.validateUser(this.user()!._id);
      this.toastService.success('Utilisateur validé avec succès');
      await this.loadUser(this.user()!._id);
    } catch (error) {
      this.toastService.error('Erreur lors de la validation');
    }
  }

  async activateUser(): Promise<void> {
    try {
      await this.userService.activateUser(this.user()!._id);
      this.toastService.success('Utilisateur activé avec succès');
      await this.loadUser(this.user()!._id);
    } catch (error) {
      this.toastService.error("Erreur lors de l'activation");
    }
  }

  async deactivateUser(): Promise<void> {
    if (confirm('Êtes-vous sûr de vouloir désactiver cet utilisateur ?')) {
      try {
        await this.userService.deactivateUser(this.user()!._id);
        this.toastService.success('Utilisateur désactivé avec succès');
        await this.loadUser(this.user()!._id);
      } catch (error) {
        this.toastService.error('Erreur lors de la désactivation');
      }
    }
  }

  async resetPassword(): Promise<void> {
    if (this.newPassword.length < 8) return;

    try {
      await this.userService.resetPassword(this.user()!._id, this.newPassword);
      this.toastService.success('Mot de passe réinitialisé avec succès');
      this.showResetPasswordModal = false;
      this.newPassword = '';
    } catch (error) {
      this.toastService.error(
        'Erreur lors de la réinitialisation du mot de passe',
      );
    }
  }

  async deleteUser(): Promise<void> {
    if (
      confirm(
        'Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.',
      )
    ) {
      try {
        await this.userService.deleteUser(this.user()!._id);
        this.toastService.success('Utilisateur supprimé avec succès');
        this.router.navigate(['/admin/users']);
      } catch (error) {
        this.toastService.error('Erreur lors de la suppression');
      }
    }
  }
}
