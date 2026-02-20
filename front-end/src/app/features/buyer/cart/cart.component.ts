import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  CartService,
  ToastService,
  AuthService,
  WalletService,
} from '../../../core/services';
import { CartItem, PaymentMethod, DeliveryAddress } from '../../../core/models';
import { ZardCardComponent } from '../../../shared/components/card';
import { ZardButtonComponent } from '../../../shared/components/button';
import { ZardIconComponent } from '../../../shared/components/icon';
import { ZardSkeletonComponent } from '../../../shared/components/skeleton';
import { ZardSeparatorComponent } from '../../../shared/components/separator';
import { ZardSpinnerComponent } from '../../../shared/components/spinner';
import {
  ZardSelectComponent,
  ZardSelectItemComponent,
} from '../../../shared/components/select';
import { ZardInputDirective } from '../../../shared/components/input';
import { ZardLabelComponent } from '../../../shared/components/label';
import {
  ZardTableComponent,
  ZardTableHeaderComponent,
  ZardTableBodyComponent,
  ZardTableRowComponent,
  ZardTableHeadComponent,
  ZardTableCellComponent,
} from '../../../shared/components/table';
import { ZardDialogService } from '../../../shared/components/dialog';

/**
 * Page du panier d'achat
 * Affiche les items du panier avec possibilité de modifier les quantités
 */
@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    ZardCardComponent,
    ZardButtonComponent,
    ZardIconComponent,
    ZardSkeletonComponent,
    ZardSeparatorComponent,
    ZardSpinnerComponent,
    ZardSelectComponent,
    ZardSelectItemComponent,
    ZardInputDirective,
    ZardLabelComponent,
    ZardTableComponent,
    ZardTableHeaderComponent,
    ZardTableBodyComponent,
    ZardTableRowComponent,
    ZardTableHeadComponent,
    ZardTableCellComponent,
  ],
  template: `
    <div class="min-h-screen bg-muted/30 py-8">
      <div class="max-w-7xl mx-auto px-4">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-foreground">Mon Panier</h1>
            <p class="text-sm text-muted-foreground mt-1">
              @if (cartService.cartItemCount(); as count) {
                {{ count }} article(s) dans votre panier
              } @else {
                Votre panier est vide
              }
            </p>
          </div>
          <button z-button zType="outline" routerLink="/buyer/products">
            <z-icon zType="arrow-left" class="mr-2 h-4 w-4" />
            Continuer les achats
          </button>
        </div>

        @if (cartService.isLoading() && !cart()) {
          <!-- Loading state -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2">
              <z-card class="p-4">
                @for (i of [1, 2, 3]; track i) {
                  <div
                    class="flex gap-4 py-4 border-b border-border last:border-0"
                  >
                    <z-skeleton class="w-24 h-24 rounded-lg" />
                    <div class="flex-1">
                      <z-skeleton class="h-5 w-3/4" />
                      <z-skeleton class="h-4 w-1/2 mt-2" />
                      <z-skeleton class="h-6 w-24 mt-2" />
                    </div>
                  </div>
                }
              </z-card>
            </div>
            <div>
              <z-skeleton class="h-64 w-full rounded-lg" />
            </div>
          </div>
        } @else if (cartService.isCartEmpty()) {
          <!-- Panier vide -->
          <div class="text-center py-16">
            <div
              class="mx-auto w-24 h-24 rounded-full bg-muted flex items-center justify-center"
            >
              <z-icon
                zType="shopping-cart"
                class="h-12 w-12 text-muted-foreground"
              />
            </div>
            <h2 class="mt-6 text-xl font-semibold text-foreground">
              Votre panier est vide
            </h2>
            <p class="mt-2 text-muted-foreground max-w-md mx-auto">
              Parcourez notre catalogue et ajoutez des produits à votre panier
            </p>
            <button z-button class="mt-6" routerLink="/buyer/products">
              <z-icon zType="shopping-bag" class="mr-2 h-4 w-4" />
              Découvrir les produits
            </button>
          </div>
        } @else {
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Liste des items -->
            <div class="lg:col-span-2">
              <z-card class="overflow-hidden">
                <!-- Version desktop -->
                <div class="hidden md:block">
                  <table z-table class="w-full">
                    <thead z-table-header>
                      <tr z-table-row>
                        <th z-table-head class="w-1/2">Produit</th>
                        <th z-table-head class="text-center">Prix unitaire</th>
                        <th z-table-head class="text-center">Quantité</th>
                        <th z-table-head class="text-right">Total</th>
                        <th z-table-head class="w-12"></th>
                      </tr>
                    </thead>
                    <tbody z-table-body>
                      @for (item of cart()?.items; track item.productId) {
                        <tr z-table-row>
                          <!-- Produit -->
                          <td z-table-cell>
                            <div class="flex items-center gap-3">
                              <div
                                class="w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0"
                              >
                                @if (item.productSnapshot.images.length) {
                                  <img
                                    [src]="item.productSnapshot.images[0]"
                                    [alt]="item.productSnapshot.title"
                                    class="w-full h-full object-cover"
                                  />
                                } @else {
                                  <div
                                    class="w-full h-full flex items-center justify-center"
                                  >
                                    <z-icon
                                      zType="image"
                                      class="text-muted-foreground"
                                    />
                                  </div>
                                }
                              </div>
                              <div>
                                <p
                                  class="font-medium text-foreground line-clamp-2"
                                >
                                  {{ item.productSnapshot.title }}
                                </p>
                              </div>
                            </div>
                          </td>

                          <!-- Prix unitaire -->
                          <td z-table-cell class="text-center">
                            {{
                              item.productSnapshot.unitPrice | number: '1.0-0'
                            }}
                            MGA
                          </td>

                          <!-- Quantité -->
                          <td z-table-cell>
                            <div class="flex items-center justify-center gap-1">
                              <button
                                z-button
                                zType="outline"
                                zSize="sm"
                                zShape="square"
                                [disabled]="isUpdating() === item.productId"
                                (click)="
                                  updateQuantity(item, item.quantity - 1)
                                "
                              >
                                <z-icon zType="minus" class="h-3 w-3" />
                              </button>
                              <span class="w-10 text-center font-medium">
                                {{ item.quantity }}
                              </span>
                              <button
                                z-button
                                zType="outline"
                                zSize="sm"
                                zShape="square"
                                [disabled]="isUpdating() === item.productId"
                                (click)="
                                  updateQuantity(item, item.quantity + 1)
                                "
                              >
                                <z-icon zType="plus" class="h-3 w-3" />
                              </button>
                            </div>
                          </td>

                          <!-- Total -->
                          <td z-table-cell class="text-right font-semibold">
                            {{ item.totalAmount | number: '1.0-0' }} MGA
                          </td>

                          <!-- Actions -->
                          <td z-table-cell>
                            <button
                              z-button
                              zType="ghost"
                              zSize="sm"
                              zShape="square"
                              class="text-destructive hover:text-destructive"
                              [disabled]="isUpdating() === item.productId"
                              (click)="removeItem(item)"
                            >
                              @if (isUpdating() === item.productId) {
                                <z-spinner size="sm" />
                              } @else {
                                <z-icon zType="trash" class="h-4 w-4" />
                              }
                            </button>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>

                <!-- Version mobile -->
                <div class="md:hidden divide-y divide-border">
                  @for (item of cart()?.items; track item.productId) {
                    <div class="p-4">
                      <div class="flex gap-3">
                        <div
                          class="w-20 h-20 rounded-lg overflow-hidden bg-muted shrink-0"
                        >
                          @if (item.productSnapshot.images.length) {
                            <img
                              [src]="item.productSnapshot.images[0]"
                              [alt]="item.productSnapshot.title"
                              class="w-full h-full object-cover"
                            />
                          }
                        </div>
                        <div class="flex-1 min-w-0">
                          <p class="font-medium text-foreground line-clamp-2">
                            {{ item.productSnapshot.title }}
                          </p>
                          <p class="text-sm text-muted-foreground mt-1">
                            {{
                              item.productSnapshot.unitPrice | number: '1.0-0'
                            }}
                            MGA
                          </p>
                        </div>
                      </div>
                      <div class="flex items-center justify-between mt-3">
                        <div class="flex items-center gap-2">
                          <button
                            z-button
                            zType="outline"
                            zSize="sm"
                            zShape="square"
                            (click)="updateQuantity(item, item.quantity - 1)"
                          >
                            <z-icon zType="minus" class="h-3 w-3" />
                          </button>
                          <span class="w-8 text-center">{{
                            item.quantity
                          }}</span>
                          <button
                            z-button
                            zType="outline"
                            zSize="sm"
                            zShape="square"
                            (click)="updateQuantity(item, item.quantity + 1)"
                          >
                            <z-icon zType="plus" class="h-3 w-3" />
                          </button>
                        </div>
                        <div class="flex items-center gap-3">
                          <span class="font-semibold">
                            {{ item.totalAmount | number: '1.0-0' }} MGA
                          </span>
                          <button
                            z-button
                            zType="ghost"
                            zSize="sm"
                            class="text-destructive"
                            (click)="removeItem(item)"
                          >
                            <z-icon zType="trash" class="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  }
                </div>

                <!-- Actions bas du tableau -->
                <div
                  class="p-4 border-t border-border flex justify-between items-center"
                >
                  <button
                    z-button
                    zType="ghost"
                    class="text-destructive"
                    (click)="confirmClearCart()"
                  >
                    <z-icon zType="trash" class="mr-2 h-4 w-4" />
                    Vider le panier
                  </button>
                </div>
              </z-card>
            </div>

            <!-- Résumé et checkout -->
            <div class="lg:col-span-1">
              <z-card class="sticky top-24">
                <div class="p-6">
                  <h2 class="text-lg font-semibold text-foreground mb-4">
                    Récapitulatif
                  </h2>

                  <div class="space-y-3">
                    <div class="flex justify-between text-sm">
                      <span class="text-muted-foreground">
                        Sous-total ({{ cartService.cartItemCount() }} articles)
                      </span>
                      <span class="font-medium">
                        {{ cartService.cartTotal() | number: '1.0-0' }} MGA
                      </span>
                    </div>
                    <div class="flex justify-between text-sm">
                      <span class="text-muted-foreground">Livraison</span>
                      <span class="text-green-600 font-medium">Gratuite</span>
                    </div>
                  </div>

                  <z-separator class="my-4" />

                  <div class="flex justify-between items-center">
                    <span class="font-semibold text-foreground">Total</span>
                    <span class="text-2xl font-bold text-foreground">
                      {{ cartService.cartTotal() | number: '1.0-0' }} MGA
                    </span>
                  </div>

                  <z-separator class="my-4" />

                  <!-- Méthode de paiement -->
                  <div class="mb-4">
                    <span
                      id="payment-method-label"
                      class="text-sm font-medium text-foreground block mb-2"
                    >
                      Méthode de paiement
                    </span>
                    <z-select [(zValue)]="selectedPaymentMethod">
                      <z-select-item zValue="WALLET">
                        <div class="flex items-center gap-2">
                          <z-icon zType="wallet" class="h-4 w-4" />
                          Portefeuille
                        </div>
                      </z-select-item>
                      <z-select-item zValue="CASH_ON_DELIVERY">
                        <div class="flex items-center gap-2">
                          <z-icon zType="banknote" class="h-4 w-4" />
                          Paiement à la livraison
                        </div>
                      </z-select-item>
                    </z-select>
                  </div>

                  <!-- Adresse de livraison -->
                  <div class="mb-4 space-y-3">
                    <span class="text-sm font-medium text-foreground block">
                      Adresse de livraison
                    </span>
                    <div>
                      <z-label for="street">Rue *</z-label>
                      <input
                        z-input
                        id="street"
                        type="text"
                        placeholder="Numéro et nom de rue"
                        [(ngModel)]="deliveryAddress.street"
                        class="w-full"
                      />
                    </div>
                    <div>
                      <z-label for="city">Ville *</z-label>
                      <input
                        z-input
                        id="city"
                        type="text"
                        placeholder="Ville"
                        [(ngModel)]="deliveryAddress.city"
                        class="w-full"
                      />
                    </div>
                    <div>
                      <z-label for="postalCode">Code postal</z-label>
                      <input
                        z-input
                        id="postalCode"
                        type="text"
                        placeholder="Code postal (optionnel)"
                        [(ngModel)]="deliveryAddress.postalCode"
                        class="w-full"
                      />
                    </div>
                  </div>

                  <!-- Solde wallet si paiement par wallet -->
                  @if (selectedPaymentMethod === 'WALLET') {
                    <div
                      class="p-3 rounded-lg mb-4"
                      [class.bg-green-50]="hasEnoughBalance()"
                      [class.bg-red-50]="!hasEnoughBalance()"
                    >
                      <div class="flex justify-between items-center text-sm">
                        <span
                          [class.text-green-700]="hasEnoughBalance()"
                          [class.text-red-700]="!hasEnoughBalance()"
                        >
                          Solde disponible
                        </span>
                        <span
                          class="font-semibold"
                          [class.text-green-700]="hasEnoughBalance()"
                          [class.text-red-700]="!hasEnoughBalance()"
                        >
                          {{ walletBalance() | number: '1.0-0' }} MGA
                        </span>
                      </div>
                      @if (!hasEnoughBalance()) {
                        <p class="text-xs text-red-600 mt-1">
                          Solde insuffisant. Veuillez recharger votre
                          portefeuille.
                        </p>
                      }
                    </div>
                  }

                  <!-- Bouton Commander -->
                  <button
                    z-button
                    class="w-full"
                    zSize="lg"
                    [disabled]="
                      isCheckingOut() ||
                      !isDeliveryAddressValid() ||
                      (selectedPaymentMethod === 'WALLET' &&
                        !hasEnoughBalance())
                    "
                    (click)="checkout()"
                  >
                    @if (isCheckingOut()) {
                      <z-spinner class="mr-2" size="sm" />
                      Traitement en cours...
                    } @else {
                      <z-icon zType="credit-card" class="mr-2 h-5 w-5" />
                      Passer la commande
                    }
                  </button>

                  <p class="text-xs text-muted-foreground text-center mt-3">
                    En passant commande, vous acceptez nos conditions générales
                    de vente
                  </p>
                </div>
              </z-card>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class CartComponent implements OnInit {
  private router = inject(Router);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  private walletService = inject(WalletService);
  private dialogService = inject(ZardDialogService);

  // Services publics
  cartService = inject(CartService);

  // États
  cart = computed(() => this.cartService.cart());
  isUpdating = signal<string | null>(null);
  isCheckingOut = signal(false);
  selectedPaymentMethod: PaymentMethod = 'WALLET';
  walletBalance = signal(0);
  deliveryAddress: DeliveryAddress = {
    street: '',
    city: '',
    postalCode: '',
    country: 'Madagascar',
  };

  ngOnInit(): void {
    // Charger le panier
    this.loadCart();
    // Charger le solde du wallet
    this.loadWalletBalance();
  }

  /**
   * Charge le panier
   */
  async loadCart(): Promise<void> {
    try {
      await this.cartService.getCart();
    } catch {
      this.toastService.error('Erreur lors du chargement du panier');
    }
  }

  /**
   * Charge le solde du wallet
   */
  async loadWalletBalance(): Promise<void> {
    try {
      const wallet = await this.walletService.getWallet();
      this.walletBalance.set(wallet.balance);
    } catch {
      this.walletBalance.set(0);
    }
  }

  /**
   * Vérifie si le solde est suffisant
   */
  hasEnoughBalance(): boolean {
    return this.walletBalance() >= this.cartService.cartTotal();
  }

  /**
   * Met à jour la quantité d'un item
   */
  async updateQuantity(item: CartItem, newQuantity: number): Promise<void> {
    if (newQuantity < 1) {
      this.removeItem(item);
      return;
    }

    this.isUpdating.set(item.productId);
    try {
      await this.cartService.updateItem(item.productId, newQuantity);
    } catch {
      this.toastService.error('Erreur lors de la mise à jour');
    } finally {
      this.isUpdating.set(null);
    }
  }

  /**
   * Supprime un item du panier
   */
  async removeItem(item: CartItem): Promise<void> {
    this.isUpdating.set(item.productId);
    try {
      await this.cartService.removeItem(item.productId);
      this.toastService.success('Article retiré du panier');
    } catch {
      this.toastService.error('Erreur lors de la suppression');
    } finally {
      this.isUpdating.set(null);
    }
  }

  /**
   * Confirme et vide le panier
   */
  confirmClearCart(): void {
    this.dialogService.create({
      zTitle: 'Vider le panier',
      zDescription:
        'Êtes-vous sûr de vouloir supprimer tous les articles de votre panier ?',
      zOkText: 'Vider',
      zOkDestructive: true,
      zCancelText: 'Annuler',
      zOnOk: () => this.clearCart(),
    });
  }

  /**
   * Vide le panier
   */
  async clearCart(): Promise<void> {
    try {
      await this.cartService.clearCart();
      this.toastService.success('Panier vidé');
    } catch {
      this.toastService.error('Erreur lors du vidage du panier');
    }
  }

  /**
   * Vérifie si l'adresse de livraison est valide
   */
  isDeliveryAddressValid(): boolean {
    return !!(
      this.deliveryAddress.street?.trim() && this.deliveryAddress.city?.trim()
    );
  }

  /**
   * Passe la commande
   */
  async checkout(): Promise<void> {
    // Vérifier l'adresse de livraison
    if (!this.isDeliveryAddressValid()) {
      this.toastService.error("Veuillez renseigner l'adresse de livraison");
      return;
    }

    // Vérifier le solde si paiement par wallet
    if (this.selectedPaymentMethod === 'WALLET' && !this.hasEnoughBalance()) {
      this.toastService.error('Solde insuffisant');
      return;
    }

    this.isCheckingOut.set(true);
    try {
      await this.cartService.checkout(
        this.selectedPaymentMethod,
        this.deliveryAddress,
      );

      this.toastService.success('Commande passée avec succès !');

      // Rafraîchir le solde wallet si paiement par wallet
      if (this.selectedPaymentMethod === 'WALLET') {
        this.loadWalletBalance();
      }

      // Rediriger vers la page des commandes
      this.router.navigate(['/buyer/orders']);
    } catch {
      this.toastService.error('Erreur lors de la commande');
    } finally {
      this.isCheckingOut.set(false);
    }
  }
}
