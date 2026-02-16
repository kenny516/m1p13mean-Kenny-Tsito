import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../../core/models';
import { ZardCardComponent } from '../../../shared/components/card';
import { ZardButtonComponent } from '../../../shared/components/button';
import { ZardBadgeComponent } from '../../../shared/components/badge';
import { ZardIconComponent } from '../../../shared/components/icon';

/**
 * Composant carte produit réutilisable
 * Affiche les informations d'un produit de manière compacte
 */
@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [
    CommonModule,
    ZardCardComponent,
    ZardButtonComponent,
    ZardBadgeComponent,
    ZardIconComponent,
  ],
  template: `
    <z-card
      class="group cursor-pointer transition-all duration-200 hover:shadow-lg h-full flex flex-col"
      (click)="onViewDetails()"
    >
      <!-- Image du produit -->
      <div class="relative aspect-square overflow-hidden rounded-t-lg bg-muted">
        @if (product().images && product().images.length > 0) {
          <img
            [src]="product().images[0]"
            [alt]="product().title"
            class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        } @else {
          <div
            class="flex h-full w-full items-center justify-center bg-muted text-muted-foreground"
          >
            <z-icon zType="image" zSize="xl" />
          </div>
        }

        <!-- Badges -->
        <div class="absolute left-2 top-2 flex flex-col gap-1">
          @if (hasDiscount()) {
            <z-badge zType="destructive" zShape="pill">
              -{{ discountPercentage() }}%
            </z-badge>
          }
          @if (product().isOutOfStock) {
            <z-badge zType="secondary" zShape="pill"> Rupture </z-badge>
          } @else if (product().isLowStock) {
            <z-badge zType="outline" zShape="pill"> Stock limité </z-badge>
          }
        </div>
      </div>

      <!-- Contenu -->
      <div class="flex flex-1 flex-col p-4">
        <!-- Catégorie -->
        <span class="text-xs text-muted-foreground uppercase tracking-wide">
          {{ product().category }}
        </span>

        <!-- Titre -->
        <h3
          class="mt-1 font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors"
        >
          {{ product().title }}
        </h3>

        <!-- Rating -->
        @if (product().stats && product().stats.rating > 0) {
          <div class="mt-2 flex items-center gap-1">
            @for (star of [1, 2, 3, 4, 5]; track star) {
              <z-icon
                zType="star"
                zSize="sm"
                [class]="
                  star <= product().stats.rating
                    ? 'text-yellow-400 fill-yellow-400'
                    : 'text-muted-foreground'
                "
              />
            }
            <span class="ml-1 text-xs text-muted-foreground">
              ({{ product().stats.reviewCount }})
            </span>
          </div>
        }

        <!-- Prix -->
        <div class="mt-auto pt-3">
          <div class="flex items-baseline gap-2">
            <span class="text-lg font-bold text-foreground">
              {{ product().price | number: '1.0-0' }} MGA
            </span>
            @if (hasDiscount()) {
              <span class="text-sm text-muted-foreground line-through">
                {{ product().originalPrice | number: '1.0-0' }} MGA
              </span>
            }
          </div>
        </div>

        <!-- Actions -->
        <div
          class="mt-3 flex gap-2"
          role="group"
          tabindex="-1"
          (click)="$event.stopPropagation()"
          (keydown)="$event.stopPropagation()"
        >
          <button
            z-button
            class="flex-1"
            zSize="sm"
            [disabled]="product().isOutOfStock || isAddingToCart()"
            (click)="onAddToCart()"
          >
            @if (isAddingToCart()) {
              <z-icon zType="loader-circle" class="mr-1 h-4 w-4 animate-spin" />
            } @else {
              <z-icon zType="shopping-cart" class="mr-1 h-4 w-4" />
            }
            Ajouter
          </button>
          <button
            z-button
            zType="outline"
            zSize="sm"
            zShape="square"
            (click)="onViewDetails()"
          >
            <z-icon zType="eye" class="h-4 w-4" />
          </button>
        </div>
      </div>
    </z-card>
  `,
})
export class ProductCardComponent {
  // Inputs
  product = input.required<Product>();
  isAddingToCart = input<boolean>(false);

  // Outputs
  addToCart = output<Product>();
  viewDetails = output<Product>();

  /**
   * Vérifie si le produit a une réduction
   */
  hasDiscount(): boolean {
    const p = this.product();
    return !!(p.originalPrice && p.originalPrice > p.price);
  }

  /**
   * Calcule le pourcentage de réduction
   */
  discountPercentage(): number {
    const p = this.product();
    if (!p.originalPrice || p.originalPrice <= p.price) return 0;
    return Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
  }

  /**
   * Émet l'événement d'ajout au panier
   */
  onAddToCart(): void {
    if (!this.product().isOutOfStock) {
      this.addToCart.emit(this.product());
    }
  }

  /**
   * Émet l'événement de visualisation des détails
   */
  onViewDetails(): void {
    this.viewDetails.emit(this.product());
  }
}
