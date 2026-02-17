import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService, ToastService } from '../../../core/services';
import { Cart, CartStatus } from '../../../core/models';
import { ZardCardComponent } from '../../../shared/components/card';
import { ZardButtonComponent } from '../../../shared/components/button';
import { ZardIconComponent } from '../../../shared/components/icon';
import { ZardSkeletonComponent } from '../../../shared/components/skeleton';
import { ZardSpinnerComponent } from '../../../shared/components/spinner';
import { ZardDialogService } from '../../../shared/components/dialog';
import { ZardPaginationComponent } from '../../../shared/components/pagination';

/**
 * Page des commandes de l'acheteur
 * Liste toutes les commandes passées avec possibilité de confirmer la livraison
 */
@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    ZardCardComponent,
    ZardButtonComponent,
    ZardIconComponent,
    ZardSkeletonComponent,
    ZardSpinnerComponent,
    ZardPaginationComponent,
  ],
  template: `
    <div class="min-h-screen bg-muted/30 py-8">
      <div class="max-w-5xl mx-auto px-4">
        <!-- Header -->
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-foreground">Mes Commandes</h1>
            <p class="text-sm text-muted-foreground mt-1">
              Historique de vos achats et suivi des livraisons
            </p>
          </div>
          <button z-button zType="outline" routerLink="/buyer/products">
            <z-icon zType="shopping-bag" class="mr-2 h-4 w-4" />
            Continuer les achats
          </button>
        </div>

        @if (isLoading() && orders().length === 0) {
          <!-- Loading state -->
          <div class="space-y-4">
            @for (i of [1, 2, 3]; track i) {
              <z-card class="p-6">
                <div class="flex justify-between items-start mb-4">
                  <z-skeleton class="h-6 w-48" />
                  <z-skeleton class="h-6 w-24" />
                </div>
                <div class="space-y-3">
                  <z-skeleton class="h-16 w-full" />
                  <z-skeleton class="h-16 w-full" />
                </div>
              </z-card>
            }
          </div>
        } @else if (orders().length === 0) {
          <!-- Aucune commande -->
          <div class="text-center py-16">
            <div
              class="mx-auto w-24 h-24 rounded-full bg-muted flex items-center justify-center"
            >
              <z-icon zType="package" class="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 class="mt-6 text-xl font-semibold text-foreground">
              Aucune commande
            </h2>
            <p class="mt-2 text-muted-foreground max-w-md mx-auto">
              Vous n'avez pas encore passé de commande. Parcourez notre
              catalogue et faites votre premier achat !
            </p>
            <button z-button class="mt-6" routerLink="/buyer/products">
              <z-icon zType="shopping-bag" class="mr-2 h-4 w-4" />
              Découvrir les produits
            </button>
          </div>
        } @else {
          <!-- Liste des commandes -->
          <div class="space-y-4">
            @for (order of orders(); track order._id) {
              <z-card class="overflow-hidden">
                <!-- En-tête de la commande -->
                <div
                  class="p-4 bg-muted/50 border-b border-border flex flex-wrap justify-between items-center gap-4"
                >
                  <div
                    class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
                  >
                    <span class="font-semibold text-foreground">
                      {{ order.order?.reference || 'Commande' }}
                    </span>
                    <span class="text-sm text-muted-foreground">
                      {{ order.updatedAt | date: 'dd/MM/yyyy à HH:mm' }}
                    </span>
                  </div>
                  <div class="flex items-center gap-3">
                    <span [class]="getStatusBadgeClass(order.status)">
                      {{ getStatusLabel(order.status) }}
                    </span>
                    <span class="font-bold text-lg">
                      {{ order.totalAmount | number: '1.0-0' }} MGA
                    </span>
                  </div>
                </div>

                <!-- Articles de la commande -->
                <div class="p-4 divide-y divide-border">
                  @for (item of order.items; track item.productId) {
                    <div
                      class="flex items-center gap-4 py-3 first:pt-0 last:pb-0"
                    >
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
                      <div class="flex-1 min-w-0">
                        <p class="font-medium text-foreground line-clamp-1">
                          {{ item.productSnapshot.title }}
                        </p>
                        <p class="text-sm text-muted-foreground">
                          {{ item.productSnapshot.unitPrice | number: '1.0-0' }}
                          MGA × {{ item.quantity }}
                        </p>
                      </div>
                      <div class="text-right">
                        <p class="font-semibold">
                          {{ item.totalAmount | number: '1.0-0' }} MGA
                        </p>
                      </div>
                    </div>
                  }
                </div>

                <!-- Actions -->
                @if (order.status === 'ORDER') {
                  <div class="p-4 border-t border-border bg-muted/30">
                    <div class="flex justify-between items-center">
                      <p class="text-sm text-muted-foreground">
                        <z-icon
                          zType="package"
                          class="inline-block h-4 w-4 mr-1"
                        />
                        En cours de livraison
                      </p>
                      <button
                        z-button
                        zType="default"
                        [disabled]="confirmingDelivery() === order._id"
                        (click)="confirmDelivery(order)"
                      >
                        @if (confirmingDelivery() === order._id) {
                          <z-spinner class="mr-2" size="sm" />
                          Confirmation...
                        } @else {
                          <z-icon zType="check" class="mr-2 h-4 w-4" />
                          Confirmer la réception
                        }
                      </button>
                    </div>
                  </div>
                }

                @if (order.status === 'DELIVERED') {
                  <div class="p-4 border-t border-border bg-green-50">
                    <p class="text-sm text-green-700 flex items-center">
                      <z-icon zType="circle-check" class="h-4 w-4 mr-2" />
                      Commande livrée et réceptionnée
                    </p>
                  </div>
                }
              </z-card>
            }
          </div>

          <!-- Pagination -->
          @if (totalPages() > 1) {
            <div class="mt-6 flex justify-center">
              <z-pagination
                [(zPageIndex)]="currentPage"
                [zTotal]="totalPages()"
                [zDisabled]="isLoading()"
                (zPageIndexChange)="loadOrders($event)"
              />
            </div>
          }
        }
      </div>
    </div>
  `,
})
export class OrdersComponent implements OnInit {
  private cartService = inject(CartService);
  private toastService = inject(ToastService);
  private dialogService = inject(ZardDialogService);

  // États
  orders = signal<Cart[]>([]);
  currentPage = signal(1);
  totalPages = signal(1);
  isLoading = signal(false);
  confirmingDelivery = signal<string | null>(null);

  ngOnInit(): void {
    this.loadOrders();
  }

  /**
   * Charge les commandes
   */
  async loadOrders(page = 1): Promise<void> {
    this.isLoading.set(true);
    this.currentPage.set(page);
    try {
      const response = await this.cartService.getOrders(page, 10);
      // L'API retourne { data: Cart[], pagination: Pagination }
      // Le service retourne directement la réponse de l'API
      const typedResponse = response as {
        orders?: Cart[];
        data?: Cart[];
        pagination?: { pages: number };
      };
      this.orders.set(typedResponse.data || typedResponse.orders || []);
      this.totalPages.set(typedResponse.pagination?.pages || 1);
    } catch {
      this.toastService.error('Erreur lors du chargement des commandes');
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Confirme la livraison d'une commande
   */
  confirmDelivery(order: Cart): void {
    this.dialogService.create({
      zTitle: 'Confirmer la réception',
      zDescription:
        'Confirmez-vous avoir bien reçu votre commande ? Cette action est irréversible.',
      zOkText: 'Confirmer',
      zCancelText: 'Annuler',
      zOnOk: () => this.doConfirmDelivery(order),
    });
  }

  /**
   * Effectue la confirmation de livraison
   */
  async doConfirmDelivery(order: Cart): Promise<void> {
    this.confirmingDelivery.set(order._id);
    try {
      await this.cartService.confirmDelivery(order._id);
      this.toastService.success('Réception confirmée !');
      // Recharger les commandes pour mettre à jour le statut
      await this.loadOrders(this.currentPage());
    } catch {
      this.toastService.error('Erreur lors de la confirmation');
    } finally {
      this.confirmingDelivery.set(null);
    }
  }

  /**
   * Retourne le label du statut
   */
  getStatusLabel(status: CartStatus): string {
    const labels: Record<CartStatus, string> = {
      CART: 'Panier',
      ORDER: 'En cours',
      EXPIRED: 'Expiré',
      RETURNED: 'Retourné',
      DELIVERED: 'Livré',
    };
    return labels[status] || status;
  }

  /**
   * Retourne les classes CSS du badge de statut
   */
  getStatusBadgeClass(status: CartStatus): string {
    const baseClass = 'px-2.5 py-0.5 rounded-full text-xs font-medium';
    const statusClasses: Record<CartStatus, string> = {
      CART: 'bg-gray-100 text-gray-800',
      ORDER: 'bg-blue-100 text-blue-800',
      EXPIRED: 'bg-red-100 text-red-800',
      RETURNED: 'bg-orange-100 text-orange-800',
      DELIVERED: 'bg-green-100 text-green-800',
    };
    return `${baseClass} ${statusClasses[status] || ''}`;
  }
}
