import { Injectable, inject, signal, computed } from '@angular/core';
import { ApiService } from './api.service';
import {
  Cart,
  CartItem,
  CartSummary,
  AddToCartRequest,
  UpdateCartItemRequest,
  CheckoutRequest,
  CheckoutResponse,
  DeliveryAddress,
  OrdersResponse,
  RestoreCartResponse,
  ExpiredCart,
} from '../models';
import { Pagination } from '../models/api.model';

/**
 * Service de gestion du panier
 * Fournit les méthodes pour gérer le panier d'achat
 */
@Injectable({ providedIn: 'root' })
export class CartService {
  private api = inject(ApiService);

  // Signals pour l'état réactif
  private cartSignal = signal<Cart | null>(null);
  private isLoadingSignal = signal(false);

  // Computeds publics
  readonly cart = this.cartSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();

  // Computed pour le nombre d'items dans le panier
  readonly cartItemCount = computed(() => {
    const cart = this.cartSignal();
    if (!cart || !cart.items) return 0;
    return cart.items.reduce(
      (total: number, item: CartItem) => total + item.quantity,
      0,
    );
  });

  // Computed pour le montant total
  readonly cartTotal = computed(() => {
    const cart = this.cartSignal();
    return cart?.totalAmount ?? 0;
  });

  // Computed pour le résumé du panier
  readonly cartSummary = computed((): CartSummary => {
    const cart = this.cartSignal();
    if (!cart || !cart.items) {
      return { itemCount: 0, totalAmount: 0, shopCount: 0 };
    }

    const uniqueShops = new Set(
      cart.items.map((item: CartItem) => item.shopId),
    );
    return {
      itemCount: cart.items.reduce(
        (total: number, item: CartItem) => total + item.quantity,
        0,
      ),
      totalAmount: cart.totalAmount,
      shopCount: uniqueShops.size,
    };
  });

  // Computed pour vérifier si le panier est vide
  readonly isCartEmpty = computed(() => {
    const cart = this.cartSignal();
    return !cart || !cart.items || cart.items.length === 0;
  });

  /**
   * Récupère le panier de l'utilisateur
   */
  async getCart(): Promise<Cart> {
    this.isLoadingSignal.set(true);
    try {
      const cart = await this.api.get<Cart>('/cart');
      this.cartSignal.set(cart);
      return cart;
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  /**
   * Ajoute un produit au panier
   * @param productId - Identifiant du produit
   * @param quantity - Quantité à ajouter
   */
  async addItem(productId: string, quantity = 1): Promise<Cart> {
    this.isLoadingSignal.set(true);
    try {
      const request: AddToCartRequest = { productId, quantity };
      const cart = await this.api.post<Cart>('/cart/items', request);
      this.cartSignal.set(cart);
      return cart;
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  /**
   * Met à jour la quantité d'un item dans le panier
   * @param productId - Identifiant du produit
   * @param quantity - Nouvelle quantité
   */
  async updateItem(productId: string, quantity: number): Promise<Cart> {
    this.isLoadingSignal.set(true);
    try {
      const request: UpdateCartItemRequest = { quantity };
      const cart = await this.api.put<Cart>(
        `/cart/items/${productId}`,
        request,
      );
      this.cartSignal.set(cart);
      return cart;
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  /**
   * Retire un produit du panier
   * @param productId - Identifiant du produit
   */
  async removeItem(productId: string): Promise<Cart> {
    this.isLoadingSignal.set(true);
    try {
      const cart = await this.api.delete<Cart>(`/cart/items/${productId}`);
      this.cartSignal.set(cart);
      return cart;
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  /**
   * Vide le panier
   */
  async clearCart(): Promise<Cart> {
    this.isLoadingSignal.set(true);
    try {
      const cart = await this.api.delete<Cart>('/cart');
      this.cartSignal.set(cart);
      return cart;
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  /**
   * Passe la commande (checkout)
   * @param paymentMethod - Méthode de paiement
   * @param deliveryAddress - Adresse de livraison
   * @param notes - Notes optionnelles
   */
  async checkout(
    paymentMethod: CheckoutRequest['paymentMethod'],
    deliveryAddress: DeliveryAddress,
    notes?: string,
  ): Promise<CheckoutResponse> {
    this.isLoadingSignal.set(true);
    try {
      const request: CheckoutRequest = {
        paymentMethod,
        deliveryAddress,
        notes,
      };
      const response = await this.api.post<CheckoutResponse>(
        '/cart/checkout',
        request,
      );
      // Mettre à jour le panier avec le nouveau panier vide
      this.cartSignal.set(response.cart);
      return response;
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  /**
   * Confirme la livraison d'une commande
   * @param cartId - Identifiant du panier/commande
   */
  async confirmDelivery(cartId: string): Promise<Cart> {
    this.isLoadingSignal.set(true);
    try {
      const cart = await this.api.post<Cart>(
        `/cart/${cartId}/confirm-delivery`,
        {},
      );
      return cart;
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  /**
   * Retourne une commande livrée
   * @param orderId - Identifiant de la commande
   * @param note - Note optionnelle
   */
  async returnOrder(orderId: string, note?: string): Promise<Cart> {
    this.isLoadingSignal.set(true);
    try {
      return await this.api.post<Cart>(`/cart/orders/${orderId}/return`, {
        note,
      });
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  /**
   * Récupère les commandes de l'utilisateur
   * @param page - Numéro de page
   * @param limit - Nombre d'éléments par page
   * @param status - Filtrer par statut (optionnel)
   */
  async getOrders(
    page = 1,
    limit = 10,
    status?: string,
  ): Promise<OrdersResponse> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (status) {
      params.append('status', status);
    }
    const response = await this.api.getWithPagination<Cart[]>(
      `/cart/orders?${params.toString()}`,
    );

    const pagination: Pagination = response.pagination || {
      page,
      limit,
      total: (response.data || []).length,
      pages: 1,
      hasNext: false,
      hasPrev: page > 1,
    };

    return {
      orders: response.data || [],
      pagination,
    };
  }

  /**
   * Récupère une commande par son ID
   * @param orderId - Identifiant de la commande
   */
  async getOrderById(orderId: string): Promise<Cart> {
    return this.api.get<Cart>(`/cart/orders/${orderId}`);
  }

  /**
   * Vérifie si un produit est dans le panier
   * @param productId - Identifiant du produit
   */
  isProductInCart(productId: string): boolean {
    const cart = this.cartSignal();
    if (!cart || !cart.items) return false;
    return cart.items.some((item: CartItem) => item.productId === productId);
  }

  /**
   * Récupère la quantité d'un produit dans le panier
   * @param productId - Identifiant du produit
   */
  getProductQuantity(productId: string): number {
    const cart = this.cartSignal();
    if (!cart || !cart.items) return 0;
    const item = cart.items.find((i: CartItem) => i.productId === productId);
    return item?.quantity ?? 0;
  }

  /**
   * Réinitialise le panier local (sans appel API)
   */
  resetCart(): void {
    this.cartSignal.set(null);
  }

  /**
   * Récupère la liste des paniers expirés de l'utilisateur
   * @returns Liste des paniers expirés avec informations de disponibilité
   */
  async getExpiredCarts(): Promise<ExpiredCart[]> {
    return this.api.get<ExpiredCart[]>('/cart/expired');
  }

  /**
   * Restaure un panier expiré spécifique
   * Les items sont fusionnés avec le panier actif s'il existe
   * @param cartId - Identifiant du panier expiré à restaurer (optionnel, sinon le plus récent)
   * @returns Les détails de la restauration (items restaurés et non restaurés)
   */
  async restoreExpiredCart(cartId?: string): Promise<RestoreCartResponse> {
    this.isLoadingSignal.set(true);
    try {
      const url = cartId ? `/cart/restore/${cartId}` : '/cart/restore';
      const response = await this.api.post<RestoreCartResponse>(url, {});
      // Mettre à jour le panier avec le résultat
      this.cartSignal.set(response.cart);
      return response;
    } finally {
      this.isLoadingSignal.set(false);
    }
  }
}
