import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  ProductService,
  CartService,
  ToastService,
  AuthService,
} from '../../../core/services';
import { Shop } from '../../../core/models';
import { ZardCardComponent } from '../../../shared/components/card';
import { ZardButtonComponent } from '../../../shared/components/button';
import { ZardBadgeComponent } from '../../../shared/components/badge';
import { ZardIconComponent } from '../../../shared/components/icon';
import { ZardInputDirective } from '../../../shared/components/input';
import { ZardSkeletonComponent } from '../../../shared/components/skeleton';
import { ZardSeparatorComponent } from '../../../shared/components/separator';
import { ZardSpinnerComponent } from '../../../shared/components/spinner';

/**
 * Page de détail d'un produit
 * Affiche toutes les informations du produit avec possibilité d'ajout au panier
 */
@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ZardCardComponent,
    ZardButtonComponent,
    ZardBadgeComponent,
    ZardIconComponent,
    ZardInputDirective,
    ZardSkeletonComponent,
    ZardSeparatorComponent,
    ZardSpinnerComponent,
  ],
  template: `
    <div class="min-h-screen bg-muted/30 py-8">
      <div class="max-w-7xl mx-auto px-4">
        <!-- Bouton retour -->
        <button z-button zType="ghost" class="mb-4" (click)="goBack()">
          <z-icon zType="arrow-left" class="mr-2 h-4 w-4" />
          Retour aux produits
        </button>

        @if (isLoading()) {
          <!-- Loading state -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <z-skeleton class="aspect-square w-full rounded-lg" />
              <div class="flex gap-2 mt-4">
                @for (i of [1, 2, 3, 4]; track i) {
                  <z-skeleton class="w-20 h-20 rounded-lg" />
                }
              </div>
            </div>
            <div class="space-y-4">
              <z-skeleton class="h-6 w-32" />
              <z-skeleton class="h-10 w-full" />
              <z-skeleton class="h-4 w-24" />
              <z-skeleton class="h-8 w-40" />
              <z-skeleton class="h-24 w-full" />
              <z-skeleton class="h-12 w-full" />
            </div>
          </div>
        } @else if (product(); as p) {
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Galerie d'images -->
            <div>
              <!-- Image principale -->
              <div
                class="aspect-square overflow-hidden rounded-lg bg-muted border border-border"
              >
                @if (selectedImage()) {
                  <img
                    [src]="selectedImage()"
                    [alt]="p.title"
                    class="h-full w-full object-contain"
                  />
                } @else {
                  <div
                    class="flex h-full w-full items-center justify-center text-muted-foreground"
                  >
                    <z-icon zType="image" zSize="xl" />
                  </div>
                }
              </div>

              <!-- Vignettes -->
              @if (p.images && p.images.length > 1) {
                <div class="flex gap-2 mt-4 overflow-x-auto pb-2">
                  @for (img of p.images; track img; let i = $index) {
                    <button
                      class="shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors"
                      [class.border-primary]="selectedImage() === img"
                      [class.border-border]="selectedImage() !== img"
                      (click)="selectImage(img)"
                    >
                      <img
                        [src]="img"
                        [alt]="p.title + ' - Image ' + (i + 1)"
                        class="h-full w-full object-cover"
                      />
                    </button>
                  }
                </div>
              }
            </div>

            <!-- Informations produit -->
            <div>
              <!-- Catégorie -->
              <z-badge zType="secondary" zShape="pill">
                {{ p.category }}
              </z-badge>

              <!-- Titre -->
              <h1 class="mt-3 text-2xl lg:text-3xl font-bold text-foreground">
                {{ p.title }}
              </h1>

              <!-- Rating -->
              @if (p.stats && p.stats.rating > 0) {
                <div class="mt-2 flex items-center gap-2">
                  <div class="flex">
                    @for (star of [1, 2, 3, 4, 5]; track star) {
                      <z-icon
                        zType="star"
                        zSize="sm"
                        [class]="
                          star <= p.stats.rating
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-muted-foreground'
                        "
                      />
                    }
                  </div>
                  <span class="text-sm text-muted-foreground">
                    {{ p.stats.rating.toFixed(1) }} ({{ p.stats.reviewCount }}
                    avis)
                  </span>
                  <z-separator orientation="vertical" class="h-4" />
                  <span class="text-sm text-muted-foreground">
                    {{ p.stats.sales }} vendu(s)
                  </span>
                </div>
              }

              <z-separator class="my-4" />

              <!-- Prix -->
              <div class="flex items-baseline gap-3">
                <span class="text-3xl font-bold text-foreground">
                  {{ p.price | number: '1.0-0' }} MGA
                </span>
                @if (hasDiscount()) {
                  <span class="text-lg text-muted-foreground line-through">
                    {{ p.originalPrice | number: '1.0-0' }} MGA
                  </span>
                  <z-badge zType="destructive">
                    -{{ discountPercentage() }}%
                  </z-badge>
                }
              </div>

              <!-- Stock -->
              <div class="mt-4">
                @if (isOutOfStock()) {
                  <div class="flex items-center gap-2 text-destructive">
                    <z-icon zType="circle-x" class="h-5 w-5" />
                    <span class="font-medium">Rupture de stock</span>
                  </div>
                } @else if (isLowStock()) {
                  <div class="flex items-center gap-2 text-yellow-600">
                    <z-icon zType="triangle-alert" class="h-5 w-5" />
                    <span class="font-medium"
                      >Stock limité ({{ availableStock() }}
                      restant(s))</span
                    >
                  </div>
                } @else {
                  <div class="flex items-center gap-2 text-green-600">
                    <z-icon zType="circle-check" class="h-5 w-5" />
                    <span class="font-medium"
                      >{{ availableStock() }} disponible(s)</span
                    >
                  </div>
                }
              </div>

              <z-separator class="my-4" />

              <!-- Description -->
              <div>
                <h3 class="font-semibold text-foreground mb-2">Description</h3>
                <p class="text-muted-foreground whitespace-pre-line">
                  {{ p.description }}
                </p>
              </div>

              <!-- Caractéristiques -->
              @if (
                p.characteristics && objectKeys(p.characteristics).length > 0
              ) {
                <div class="mt-4">
                  <h3 class="font-semibold text-foreground mb-2">
                    Caractéristiques
                  </h3>
                  <div
                    class="bg-muted/50 rounded-lg p-4 grid grid-cols-2 gap-2"
                  >
                    @for (key of objectKeys(p.characteristics); track key) {
                      <div class="text-sm">
                        <span class="text-muted-foreground">{{ key }}:</span>
                        <span class="ml-1 font-medium text-foreground">
                          {{ p.characteristics[key] }}
                        </span>
                      </div>
                    }
                  </div>
                </div>
              }

              <!-- Tags -->
              @if (p.tags && p.tags.length > 0) {
                <div class="mt-4 flex flex-wrap gap-2">
                  @for (tag of p.tags; track tag) {
                    <z-badge zType="outline" zShape="pill">#{{ tag }}</z-badge>
                  }
                </div>
              }

              <z-separator class="my-6" />

              <!-- Actions -->
              <z-card class="p-4">
                <div class="flex items-center gap-4">
                  <!-- Sélecteur quantité -->
                  <div class="flex items-center gap-2">
                    <span class="text-sm text-muted-foreground">Quantité:</span>
                    <div
                      class="flex items-center border border-border rounded-md"
                    >
                      <button
                        z-button
                        zType="ghost"
                        zSize="sm"
                        zShape="square"
                        [disabled]="quantity() <= minAllowedQuantity()"
                        (click)="decrementQuantity()"
                      >
                        <z-icon zType="minus" class="h-4 w-4" />
                      </button>
                      <input
                        z-input
                        type="number"
                        class="w-16 text-center border-0"
                        [ngModel]="quantity()"
                        (ngModelChange)="setQuantity($event)"
                        [min]="minAllowedQuantity()"
                        [max]="availableStock()"
                        [disabled]="isOutOfStock()"
                      />
                      <button
                        z-button
                        zType="ghost"
                        zSize="sm"
                        zShape="square"
                        [disabled]="quantity() >= availableStock() || isOutOfStock()"
                        (click)="incrementQuantity()"
                      >
                        <z-icon zType="plus" class="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <!-- Bouton ajouter au panier -->
                  <button
                    z-button
                    class="flex-1"
                    zSize="lg"
                    [disabled]="isOutOfStock() || isAddingToCart()"
                    (click)="addToCart()"
                  >
                    @if (isAddingToCart()) {
                      <z-spinner class="mr-2" size="sm" />
                      Ajout en cours...
                    } @else {
                      <z-icon zType="shopping-cart" class="mr-2 h-5 w-5" />
                      Ajouter au panier
                    }
                  </button>
                </div>

                <!-- Total -->
                <div
                  class="mt-4 pt-4 border-t border-border flex justify-between items-center"
                >
                  <span class="text-muted-foreground">Total:</span>
                  <span class="text-xl font-bold text-foreground">
                    {{ p.price * quantity() | number: '1.0-0' }} MGA
                  </span>
                </div>
              </z-card>

              <!-- Informations boutique -->
              @if (shopInfo(); as shop) {
                <z-card class="mt-4 p-4">
                  <div class="flex items-center gap-3">
                    @if (shop.logo) {
                      <img
                        [src]="shop.logo"
                        [alt]="shop.name"
                        class="w-12 h-12 rounded-full object-cover"
                      />
                    } @else {
                      <div
                        class="w-12 h-12 rounded-full bg-muted flex items-center justify-center"
                      >
                        <z-icon
                          zType="store"
                          class="h-6 w-6 text-muted-foreground"
                        />
                      </div>
                    }
                    <div>
                      <h4 class="font-medium text-foreground">
                        {{ shop.name }}
                      </h4>
                      <p class="text-sm text-muted-foreground">
                        Vendeur officiel
                      </p>
                    </div>
                  </div>
                </z-card>
              }
            </div>
          </div>
        } @else {
          <!-- Produit non trouvé -->
          <div class="text-center py-12">
            <z-icon
              zType="circle-x"
              class="mx-auto h-12 w-12 text-muted-foreground"
            />
            <h3 class="mt-4 text-lg font-medium text-foreground">
              Produit non trouvé
            </h3>
            <p class="mt-2 text-sm text-muted-foreground">
              Le produit que vous recherchez n'existe pas ou a été supprimé
            </p>
            <button z-button class="mt-4" (click)="goBack()">
              Retour aux produits
            </button>
          </div>
        }
      </div>
    </div>
  `,
})
export class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);

  // États
  product = computed(() => this.productService.selectedProduct());
  isLoading = computed(() => this.productService.isLoading());
  isAddingToCart = signal(false);
  quantity = signal(1);
  selectedImage = signal<string | null>(null);

  // Extraire les infos de la boutique si peuplée
  shopInfo = computed(() => {
    const p = this.product();
    if (!p) return null;
    if (typeof p.shopId === 'object') {
      return p.shopId as Shop;
    }
    return null;
  });

  // Helper pour Object.keys dans le template
  objectKeys = Object.keys;

  ngOnInit(): void {
    const productId = this.route.snapshot.paramMap.get('id');
    if (productId) {
      this.loadProduct(productId);
    }

    // Charger le panier si connecté et BUYER
    if (
      this.authService.isAuthenticated() &&
      this.authService.userRole() === 'BUYER'
    ) {
      // Ignorer silencieusement les erreurs - le panier se chargera à la prochaine action
      this.cartService.getCart().catch(() => undefined);
    }
  }

  /**
   * Charge le produit
   */
  async loadProduct(id: string): Promise<void> {
    try {
      const product = await this.productService.getProduct(id);
      // Sélectionner la première image
      if (product.images && product.images.length > 0) {
        this.selectedImage.set(product.images[0]);
      }
      this.syncQuantityWithStock();
    } catch {
      this.toastService.error('Produit non trouvé');
    }
  }

  availableStock(): number {
    const p = this.product();
    if (!p) return 0;
    return p.stock?.cache?.available ?? 0;
  }

  isOutOfStock(): boolean {
    const p = this.product();
    if (!p) return true;
    return !!p.isOutOfStock || this.availableStock() <= 0;
  }

  isLowStock(): boolean {
    const p = this.product();
    if (!p || this.isOutOfStock()) {
      return false;
    }

    if (p.isLowStock) {
      return true;
    }

    const threshold = p.stock?.alert?.lowThreshold ?? 5;
    return this.availableStock() <= threshold;
  }

  minAllowedQuantity(): number {
    return this.isOutOfStock() ? 0 : 1;
  }

  private syncQuantityWithStock(): void {
    if (this.isOutOfStock()) {
      this.quantity.set(0);
      return;
    }

    const clampedQty = Math.max(1, Math.min(this.quantity(), this.availableStock()));
    this.quantity.set(clampedQty);
  }

  /**
   * Vérifie si le produit a une réduction
   */
  hasDiscount(): boolean {
    const p = this.product();
    return !!(p && p.originalPrice && p.originalPrice > p.price);
  }

  /**
   * Calcule le pourcentage de réduction
   */
  discountPercentage(): number {
    const p = this.product();
    if (!p || !p.originalPrice || p.originalPrice <= p.price) return 0;
    return Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
  }

  /**
   * Sélectionne une image
   */
  selectImage(img: string): void {
    this.selectedImage.set(img);
  }

  /**
   * Incrémente la quantité
   */
  incrementQuantity(): void {
    if (!this.isOutOfStock() && this.quantity() < this.availableStock()) {
      this.quantity.update((q: number) => q + 1);
    }
  }

  /**
   * Décrémente la quantité
   */
  decrementQuantity(): void {
    if (this.quantity() > this.minAllowedQuantity()) {
      this.quantity.update((q: number) => q - 1);
    }
  }

  /**
   * Définit la quantité
   */
  setQuantity(value: number): void {
    if (this.isOutOfStock()) {
      this.quantity.set(0);
      return;
    }

    const parsedValue = Number(value);
    const safeValue = Number.isFinite(parsedValue) ? parsedValue : 1;
    const newQty = Math.max(1, Math.min(safeValue, this.availableStock()));
    this.quantity.set(newQty);
  }

  /**
   * Ajoute au panier
   */
  async addToCart(): Promise<void> {
    const p = this.product();
    if (!p) return;

    if (this.isOutOfStock()) {
      this.toastService.warning('Produit en rupture de stock');
      return;
    }

    const maxAllowed = this.availableStock();
    if (this.quantity() > maxAllowed) {
      this.quantity.set(maxAllowed);
      this.toastService.warning(`Stock disponible: ${maxAllowed}`);
      return;
    }

    // Vérifier l'authentification
    if (!this.authService.isAuthenticated()) {
      this.toastService.info('Connectez-vous pour ajouter au panier');
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: this.router.url },
      });
      return;
    }

    // Vérifier le rôle
    if (this.authService.userRole() !== 'BUYER') {
      this.toastService.warning(
        'Seuls les acheteurs peuvent utiliser le panier',
      );
      return;
    }

    this.isAddingToCart.set(true);
    try {
      await this.cartService.addItem(p._id, this.quantity());
      this.toastService.success(
        `${this.quantity()} x ${p.title} ajouté(s) au panier`,
      );
    } catch {
      this.toastService.error("Erreur lors de l'ajout au panier");
    } finally {
      this.isAddingToCart.set(false);
    }
  }

  /**
   * Retourne à la page précédente
   */
  goBack(): void {
    this.productService.clearSelectedProduct();
    this.location.back();
  }
}
