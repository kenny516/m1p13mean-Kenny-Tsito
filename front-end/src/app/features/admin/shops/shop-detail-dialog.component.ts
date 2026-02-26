import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Shop, ShopStatus } from '@/core/models';
import { ZardBadgeComponent } from '@/shared/components/badge';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardIconComponent } from '@/shared/components/icon';
import { ZardAvatarComponent } from '@/shared/components/avatar';
import { Z_MODAL_DATA, ZardDialogRef } from '@/shared/components/dialog';

type ShopWithSeller = Shop & {
  sellerId: {
    _id: string;
    email?: string;
    profile?: {
      firstName?: string;
      lastName?: string;
    };
  };
};

export interface ShopDetailDialogData {
  shop: ShopWithSeller;
  onModerate?: () => void;
}

@Component({
  selector: 'app-shop-detail-dialog',
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
      <!-- Banner et Logo -->
      <div class="relative">
        @if (shop.banner) {
          <div
            class="h-32 w-full rounded-lg bg-cover bg-center"
            [style.background-image]="'url(' + shop.banner + ')'"
          ></div>
        } @else {
          <div
            class="h-32 w-full rounded-lg bg-linear-to-r from-primary/20 to-primary/10"
          ></div>
        }
        <div class="absolute -bottom-6 left-4">
          <z-avatar
            [zSrc]="shop.logo || ''"
            [zAlt]="shop.name"
            [zFallback]="getShopInitials()"
            class="h-16 w-16 border-4 border-background"
          />
        </div>
      </div>

      <div class="pt-4">
        <!-- Nom et Status -->
        <div class="flex items-start justify-between">
          <div>
            <h3 class="text-lg font-semibold text-foreground">
              {{ shop.name }}
            </h3>
            <p class="text-sm text-muted-foreground">{{ getSellerName() }}</p>
          </div>
          <z-badge [zType]="getStatusBadgeType()" zShape="pill">
            {{ getStatusLabel() }}
          </z-badge>
        </div>

        <!-- Description -->
        @if (shop.description) {
          <p class="mt-4 text-sm text-muted-foreground">
            {{ shop.description }}
          </p>
        }

        <hr class="my-4 border-border" />

        <!-- Informations de contact -->
        @if (shop.contact) {
          <div class="space-y-2">
            <h4 class="text-sm font-medium text-foreground">Contact</h4>
            <div class="grid grid-cols-1 gap-2 text-sm">
              @if (shop.contact.email) {
                <div class="flex items-center gap-2 text-muted-foreground">
                  <z-icon zType="mail" class="h-4 w-4" />
                  <span>{{ shop.contact.email }}</span>
                </div>
              }
              @if (shop.contact.phone) {
                <div class="flex items-center gap-2 text-muted-foreground">
                  <z-icon zType="user" class="h-4 w-4" />
                  <span>{{ shop.contact.phone }}</span>
                </div>
              }
              @if (shop.contact.address) {
                <div class="flex items-center gap-2 text-muted-foreground">
                  <z-icon zType="store" class="h-4 w-4" />
                  <span>{{ shop.contact.address }}</span>
                </div>
              }
            </div>
          </div>

          <hr class="my-4 border-border" />
        }

        <!-- Catégories -->
        @if (shop.categories && shop.categories.length > 0) {
          <div class="space-y-2">
            <h4 class="text-sm font-medium text-foreground">Catégories</h4>
            <div class="flex flex-wrap gap-2">
              @for (category of shop.categories; track category) {
                <z-badge zType="secondary" zShape="pill">{{
                  category
                }}</z-badge>
              }
            </div>
          </div>

          <hr class="my-4 border-border" />
        }

        <!-- Statistiques -->
        <div class="grid grid-cols-3 gap-4">
          <div class="text-center">
            <p class="text-2xl font-bold text-foreground">
              {{ shop.stats.totalProducts }}
            </p>
            <p class="text-xs text-muted-foreground">Produits</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-foreground">
              {{ shop.stats.totalSales }}
            </p>
            <p class="text-xs text-muted-foreground">Ventes</p>
          </div>
          <div class="text-center">
            <p class="text-2xl font-bold text-foreground">
              {{ shop.stats.rating | number: '1.1-1' }}
            </p>
            <p class="text-xs text-muted-foreground">Note</p>
          </div>
        </div>

        <hr class="my-4 border-border" />

        <!-- Commission et dates -->
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-muted-foreground">Commission:</span>
            <span class="ml-2 font-medium">{{ shop.commissionRate }}%</span>
          </div>
          <div>
            <span class="text-muted-foreground">Créée le:</span>
            <span class="ml-2 font-medium">{{
              shop.createdAt | date: 'dd/MM/yyyy'
            }}</span>
          </div>
        </div>

        <!-- Raison de rejet -->
        @if (shop.status === 'REJECTED' && shop.rejectionReason) {
          <div
            class="mt-4 p-3 bg-destructive/10 rounded-lg border border-destructive/20"
          >
            <div class="flex items-start gap-2">
              <z-icon
                zType="circle-alert"
                class="h-5 w-5 text-destructive mt-0.5"
              />
              <div>
                <p class="text-sm font-medium text-destructive">
                  Raison du rejet
                </p>
                <p class="text-sm text-destructive/80 mt-1">
                  {{ shop.rejectionReason }}
                </p>
              </div>
            </div>
          </div>
        }

        <!-- Actions -->
        <div class="mt-6 flex justify-end gap-2">
          <button z-button zType="outline" (click)="close()">Fermer</button>
          @if (shop.status === 'PENDING') {
            <button z-button (click)="moderate()">
              <z-icon zType="check" class="mr-2" />
              Modérer
            </button>
          }
        </div>
      </div>
    </div>
  `,
})
export class ShopDetailDialogComponent {
  private dialogRef = inject(ZardDialogRef);
  private data = inject<ShopDetailDialogData>(Z_MODAL_DATA);

  get shop(): ShopWithSeller {
    return this.data.shop;
  }

  getShopInitials(): string {
    return this.shop.name.substring(0, 2).toUpperCase();
  }

  getSellerName(): string {
    if (typeof this.shop.sellerId === 'string') {
      return 'Vendeur inconnu';
    }
    const seller = this.shop.sellerId;
    if (seller.profile?.firstName || seller.profile?.lastName) {
      return `${seller.profile.firstName || ''} ${seller.profile.lastName || ''}`.trim();
    }
    return seller.email || 'Vendeur inconnu';
  }

  getStatusLabel(): string {
    const labels: Record<ShopStatus, string> = {
      DRAFT: 'Brouillon',
      PENDING: 'En attente',
      ACTIVE: 'Actif',
      REJECTED: 'Rejeté',
      ARCHIVED: 'Archivé',
    };
    return labels[this.shop.status] || this.shop.status;
  }

  getStatusBadgeType(): 'default' | 'secondary' | 'destructive' | 'outline' {
    const types: Record<
      ShopStatus,
      'default' | 'secondary' | 'destructive' | 'outline'
    > = {
      DRAFT: 'secondary',
      PENDING: 'outline',
      ACTIVE: 'default',
      REJECTED: 'destructive',
      ARCHIVED: 'secondary',
    };
    return types[this.shop.status] || 'secondary';
  }

  close(): void {
    this.dialogRef.close();
  }

  moderate(): void {
    this.dialogRef.close();
    if (this.data.onModerate) {
      this.data.onModerate();
    }
  }
}
