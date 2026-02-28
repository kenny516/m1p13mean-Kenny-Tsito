import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product, ProductStatus, Shop } from '@/core/models';
import { ZardButtonComponent } from '@/shared/components/button';
import { ZardBadgeComponent } from '@/shared/components/badge';
import { ZardIconComponent } from '@/shared/components/icon';
import { Z_MODAL_DATA, ZardDialogRef } from '@/shared/components/dialog';

type ProductWithShop = Product & {
  shopId: Shop | string;
};

export interface ProductDetailDialogData {
  product: ProductWithShop;
  onModerate?: () => void;
}

@Component({
  selector: 'app-product-detail-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ZardButtonComponent,
    ZardBadgeComponent,
    ZardIconComponent,
  ],
  template: `
    <div class="space-y-6">
      <!-- Image et infos principales -->
      <div class="flex gap-4">
        <!-- Image principale -->
        <div class="shrink-0">
          @if (product.images && product.images.length > 0) {
            <img
              [src]="product.images[0]"
              [alt]="product.title"
              class="w-32 h-32 object-cover rounded-lg border"
            />
          } @else {
            <div
              class="w-32 h-32 bg-muted rounded-lg flex items-center justify-center"
            >
              <z-icon zType="package" class="h-12 w-12 text-muted-foreground" />
            </div>
          }
        </div>

        <!-- Infos principales -->
        <div class="flex-1 space-y-2">
          <div class="flex items-start justify-between">
            <h3 class="text-lg font-semibold text-foreground">
              {{ product.title }}
            </h3>
            <z-badge [zType]="getStatusBadgeType(product.status)" zShape="pill">
              {{ getStatusLabel(product.status) }}
            </z-badge>
          </div>

          <p class="text-2xl font-bold text-primary">
            {{ product.price | number }} MGA
          </p>

          @if (product.originalPrice && product.originalPrice > product.price) {
            <p class="text-sm text-muted-foreground line-through">
              {{ product.originalPrice | number }} MGA
            </p>
          }

          <z-badge zType="secondary" zShape="pill">
            {{ product.category }}
          </z-badge>
        </div>
      </div>

      <!-- Galerie d'images -->
      @if (product.images && product.images.length > 1) {
        <div>
          <h4 class="text-sm font-medium text-muted-foreground mb-2">
            Images ({{ product.images.length }})
          </h4>
          <div class="flex gap-2 overflow-x-auto pb-2">
            @for (image of product.images; track image; let i = $index) {
              <img
                [src]="image"
                [alt]="'Image ' + (i + 1)"
                class="w-16 h-16 object-cover rounded border shrink-0"
              />
            }
          </div>
        </div>
      }

      <!-- Description -->
      <div>
        <h4 class="text-sm font-medium text-muted-foreground mb-2">
          Description
        </h4>
        <p class="text-sm text-foreground whitespace-pre-line">
          {{ product.description }}
        </p>
      </div>

      <!-- Informations boutique -->
      <div class="p-3 bg-muted/50 rounded-lg">
        <h4 class="text-sm font-medium text-muted-foreground mb-2">Boutique</h4>
        <p class="font-medium text-foreground">{{ getShopName() }}</p>
      </div>

      <!-- Tags -->
      @if (product.tags && product.tags.length > 0) {
        <div>
          <h4 class="text-sm font-medium text-muted-foreground mb-2">Tags</h4>
          <div class="flex flex-wrap gap-2">
            @for (tag of product.tags; track tag) {
              <z-badge zType="outline" zShape="pill" class="text-xs">
                {{ tag }}
              </z-badge>
            }
          </div>
        </div>
      }

      <!-- Caractéristiques -->
      @if (product.characteristics && hasCharacteristics()) {
        <div>
          <h4 class="text-sm font-medium text-muted-foreground mb-2">
            Caractéristiques
          </h4>
          <div class="grid grid-cols-2 gap-2">
            @for (char of getCharacteristicsArray(); track char.key) {
              <div class="text-sm">
                <span class="text-muted-foreground">{{ char.key }}:</span>
                <span class="ml-1 font-medium">{{ char.value }}</span>
              </div>
            }
          </div>
        </div>
      }

      <!-- Stock -->
      <div class="grid grid-cols-3 gap-4 p-3 bg-muted/50 rounded-lg">
        <div class="text-center">
          <p class="text-2xl font-bold text-foreground">
            {{ product.stock.cache.total || 0 }}
          </p>
          <p class="text-xs text-muted-foreground">Stock total</p>
        </div>
        <div class="text-center">
          <p class="text-2xl font-bold text-foreground">
            {{ product.stock.cache.available || 0 }}
          </p>
          <p class="text-xs text-muted-foreground">Disponible</p>
        </div>
        <div class="text-center">
          <p class="text-2xl font-bold text-foreground">
            {{ product.stock.cache.reserved || 0 }}
          </p>
          <p class="text-xs text-muted-foreground">Réservé</p>
        </div>
      </div>

      <!-- Raison de rejet -->
      @if (product.status === 'REJECTED' && product.rejectionReason) {
        <div
          class="p-3 bg-destructive/10 rounded-lg border border-destructive/20"
        >
          <div class="flex items-start gap-2">
            <z-icon
              zType="circle-alert"
              class="h-5 w-5 text-destructive mt-0.5"
            />
            <div>
              <p class="text-sm font-medium text-destructive">Raison du rejet</p>
              <p class="text-sm text-destructive/80 mt-1">
                {{ product.rejectionReason }}
              </p>
            </div>
          </div>
        </div>
      }

      <!-- Dates -->
      <div class="flex justify-between text-xs text-muted-foreground pt-2 border-t">
        <span>Créé le {{ product.createdAt | date: 'dd/MM/yyyy à HH:mm' }}</span>
        @if (product.updatedAt) {
          <span>Modifié le {{ product.updatedAt | date: 'dd/MM/yyyy à HH:mm' }}</span>
        }
      </div>

      <!-- Actions -->
      <div class="flex justify-end gap-2 pt-2">
        <button z-button zType="outline" (click)="close()">Fermer</button>
        @if (product.status === 'PENDING' && data.onModerate) {
          <button z-button zType="default" (click)="moderate()">
            <z-icon zType="check" class="mr-2" />
            Modérer
          </button>
        }
      </div>
    </div>
  `,
})
export class ProductDetailDialogComponent {
  private dialogRef = inject(ZardDialogRef);
  readonly data = inject<ProductDetailDialogData>(Z_MODAL_DATA);

  get product(): ProductWithShop {
    return this.data.product;
  }

  getShopName(): string {
    if (typeof this.product.shopId === 'string') {
      return 'Boutique inconnue';
    }
    return this.product.shopId.name || 'Boutique inconnue';
  }

  getStatusLabel(status: ProductStatus): string {
    const labels: Record<ProductStatus, string> = {
      DRAFT: 'Brouillon',
      PENDING: 'En attente',
      ACTIVE: 'Actif',
      REJECTED: 'Rejeté',
      ARCHIVED: 'Archivé',
    };
    return labels[status] || status;
  }

  getStatusBadgeType(
    status: ProductStatus,
  ): 'default' | 'secondary' | 'destructive' | 'outline' {
    const types: Record<
      ProductStatus,
      'default' | 'secondary' | 'destructive' | 'outline'
    > = {
      DRAFT: 'secondary',
      PENDING: 'outline',
      ACTIVE: 'default',
      REJECTED: 'destructive',
      ARCHIVED: 'secondary',
    };
    return types[status] || 'secondary';
  }

  hasCharacteristics(): boolean {
    const chars = this.product.characteristics;
    if (!chars) return false;
    if (chars instanceof Map) return chars.size > 0;
    return Object.keys(chars).length > 0;
  }

  getCharacteristicsArray(): { key: string; value: string }[] {
    const chars = this.product.characteristics;
    if (!chars) return [];
    if (chars instanceof Map) {
      return Array.from(chars.entries()).map(([key, value]) => ({
        key,
        value: String(value),
      }));
    }
    return Object.entries(chars).map(([key, value]) => ({
      key,
      value: String(value),
    }));
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
