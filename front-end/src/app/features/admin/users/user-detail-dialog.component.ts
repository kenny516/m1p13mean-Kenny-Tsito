import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User } from '@/core/models';
import { ZardBadgeComponent } from '@/shared/components/badge';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardIconComponent } from '@/shared/components/icon';
import { ZardAvatarComponent } from '@/shared/components/avatar';
import { Z_MODAL_DATA, ZardDialogRef } from '@/shared/components/dialog';

export interface UserDetailDialogData {
  user: User;
  onValidate?: () => void;
  onToggleActive?: () => void;
}

@Component({
  selector: 'app-user-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ZardBadgeComponent,
    ZardButtonComponent,
    ZardIconComponent,
    ZardAvatarComponent,
  ],
  template: `
    <div class="space-y-6">
      <!-- Avatar et infos principales -->
      <div class="flex items-start gap-4">
        <z-avatar
          [zAlt]="user.profile.firstName + ' ' + user.profile.lastName"
          [zFallback]="getInitials()"
          class="h-16 w-16"
        />
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <h3 class="text-lg font-semibold text-foreground">
              {{ user.profile.firstName }} {{ user.profile.lastName }}
            </h3>
            <z-badge [zType]="getRoleBadgeType()" zShape="pill">
              {{ getRoleLabel() }}
            </z-badge>
          </div>
          <p class="text-sm text-muted-foreground mt-1">{{ user.email }}</p>
          <div class="flex items-center gap-2 mt-2">
            <z-badge [zType]="user.isActive ? 'default' : 'destructive'">
              {{ user.isActive ? 'Actif' : 'Inactif' }}
            </z-badge>
            @if (!user.isValidated) {
              <z-badge zType="outline">Non validé</z-badge>
            }
          </div>
        </div>
      </div>

      <hr class="border-border" />

      <!-- Informations de profil -->
      <div class="space-y-4">
        <h4 class="text-sm font-medium text-foreground">
          Informations du profil
        </h4>
        <div class="grid grid-cols-2 gap-4 text-sm">
          @if (user.profile.phone) {
            <div class="flex items-center gap-2 text-muted-foreground">
              <z-icon zType="user" class="h-4 w-4" />
              <span>{{ user.profile.phone }}</span>
            </div>
          }
          @if (user.profile.address?.street) {
            <div class="flex items-center gap-2 text-muted-foreground col-span-2">
              <z-icon zType="store" class="h-4 w-4" />
              <span>
                {{ user.profile.address?.street }}
                @if (user.profile.address?.city) {
                  , {{ user.profile.address?.city }}
                }
                @if (user.profile.address?.postalCode) {
                  {{ user.profile.address?.postalCode }}
                }
              </span>
            </div>
          }
        </div>
      </div>

      <hr class="border-border" />

      <!-- Dates -->
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span class="text-muted-foreground">Inscrit le:</span>
          <span class="ml-2 font-medium">{{
            user.createdAt | date: 'dd/MM/yyyy HH:mm'
          }}</span>
        </div>
        <div>
          <span class="text-muted-foreground">Mis à jour:</span>
          <span class="ml-2 font-medium">{{
            user.updatedAt | date: 'dd/MM/yyyy HH:mm'
          }}</span>
        </div>
      </div>

      <!-- Statistiques selon le rôle -->
      @if (user.role === 'BUYER' || user.role === 'SELLER') {
        <hr class="border-border" />
        <div class="grid grid-cols-3 gap-4">
          @if (user.role === 'BUYER') {
            <div class="text-center p-3 bg-muted/50 rounded-lg">
              <p class="text-2xl font-bold text-foreground">-</p>
              <p class="text-xs text-muted-foreground">Commandes</p>
            </div>
            <div class="text-center p-3 bg-muted/50 rounded-lg">
              <p class="text-2xl font-bold text-foreground">-</p>
              <p class="text-xs text-muted-foreground">Dépensé</p>
            </div>
            <div class="text-center p-3 bg-muted/50 rounded-lg">
              <p class="text-2xl font-bold text-foreground">-</p>
              <p class="text-xs text-muted-foreground">Wallet</p>
            </div>
          } @else {
            <div class="text-center p-3 bg-muted/50 rounded-lg">
              <p class="text-2xl font-bold text-foreground">-</p>
              <p class="text-xs text-muted-foreground">Produits</p>
            </div>
            <div class="text-center p-3 bg-muted/50 rounded-lg">
              <p class="text-2xl font-bold text-foreground">-</p>
              <p class="text-xs text-muted-foreground">Ventes</p>
            </div>
            <div class="text-center p-3 bg-muted/50 rounded-lg">
              <p class="text-2xl font-bold text-foreground">-</p>
              <p class="text-xs text-muted-foreground">CA</p>
            </div>
          }
        </div>
      }

      <!-- Actions -->
      <div class="mt-6 flex justify-end gap-2">
        <button z-button zType="outline" (click)="close()">Fermer</button>
        @if (!user.isValidated) {
          <button
            z-button
            zType="default"
            (click)="validate()"
            class="bg-green-600 hover:bg-green-700"
          >
            <z-icon zType="check" class="mr-2" />
            Valider
          </button>
        }
        @if (user.isActive) {
          <button z-button zType="destructive" (click)="toggleActive()">
            <z-icon zType="ban" class="mr-2" />
            Désactiver
          </button>
        } @else {
          <button
            z-button
            zType="default"
            (click)="toggleActive()"
            class="bg-green-600 hover:bg-green-700"
          >
            <z-icon zType="circle-check" class="mr-2" />
            Activer
          </button>
        }
      </div>
    </div>
  `,
})
export class UserDetailDialogComponent {
  private dialogRef = inject(ZardDialogRef);
  private data = inject<UserDetailDialogData>(Z_MODAL_DATA);

  get user(): User {
    return this.data.user;
  }

  getInitials(): string {
    const first = this.user.profile?.firstName?.charAt(0) || '';
    const last = this.user.profile?.lastName?.charAt(0) || '';
    return (first + last).toUpperCase() || this.user.email.charAt(0).toUpperCase();
  }

  getRoleLabel(): string {
    const labels: Record<string, string> = {
      BUYER: 'Acheteur',
      SELLER: 'Vendeur',
      ADMIN: 'Administrateur',
    };
    return labels[this.user.role] || this.user.role;
  }

  getRoleBadgeType(): 'default' | 'secondary' | 'destructive' | 'outline' {
    const types: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      BUYER: 'secondary',
      SELLER: 'default',
      ADMIN: 'outline',
    };
    return types[this.user.role] || 'secondary';
  }

  close(): void {
    this.dialogRef.close();
  }

  validate(): void {
    this.dialogRef.close();
    if (this.data.onValidate) {
      this.data.onValidate();
    }
  }

  toggleActive(): void {
    this.dialogRef.close();
    if (this.data.onToggleActive) {
      this.data.onToggleActive();
    }
  }
}
