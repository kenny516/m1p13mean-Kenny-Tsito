/**
 * Interface représentant le snapshot d'un produit dans le panier
 * Conserve les données du produit au moment de l'ajout
 */
export interface ProductSnapshot {
  title: string;
  description?: string;
  images: string[];
  unitPrice: number;
}

/**
 * Interface représentant un item dans le panier
 */
export interface CartItem {
  productId: string;
  shopId: string;
  productSnapshot: ProductSnapshot;
  quantity: number;
  totalAmount: number;
}

/**
 * Statuts possibles d'un panier/commande
 */
export type CartStatus =
  | 'CART'
  | 'ORDER'
  | 'EXPIRED'
  | 'RETURNED'
  | 'DELIVERED';

/**
 * Méthodes de paiement disponibles
 */
export type PaymentMethod =
  | 'WALLET'
  | 'CARD'
  | 'MOBILE_MONEY'
  | 'CASH_ON_DELIVERY';

/**
 * Interface représentant une adresse de livraison
 */
export interface DeliveryAddress {
  street: string;
  city: string;
  postalCode?: string;
  country?: string;
}

/**
 * Interface représentant les informations de commande
 */
export interface OrderInfo {
  reference?: string;
  paymentTransaction?: string;
  paymentMethod?: PaymentMethod;
  saleId?: string;
}

/**
 * Interface représentant un panier
 */
export interface Cart {
  _id: string;
  userId: string;
  status: CartStatus;
  order?: OrderInfo;
  items: CartItem[];
  totalAmount: number;
  expiresAt?: string;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Interface pour ajouter un produit au panier
 */
export interface AddToCartRequest {
  productId: string;
  quantity: number;
}

/**
 * Interface pour mettre à jour la quantité d'un item
 */
export interface UpdateCartItemRequest {
  quantity: number;
}

/**
 * Interface pour le checkout
 */
export interface CheckoutRequest {
  paymentMethod: PaymentMethod;
  deliveryAddress: DeliveryAddress;
  notes?: string;
}

/**
 * Interface pour la réponse du checkout
 */
export interface CheckoutResponse {
  order: Cart;
  cart: Cart;
  paymentTransaction?: {
    _id: string;
    type: string;
    amount: number;
    balanceAfter: number;
    status: string;
  };
}

/**
 * Interface pour la réponse des commandes
 */
export interface OrdersResponse {
  orders: Cart[];
  pagination: import('./api.model').Pagination;
}

/**
 * Interface pour un résumé de panier (affichage)
 */
export interface CartSummary {
  itemCount: number;
  totalAmount: number;
  shopCount: number;
}

/**
 * Interface pour un item non restauré
 */
export interface NotRestoredItem {
  productId: string;
  title: string;
  reason: string;
  requestedQuantity: number;
  adjustedQuantity?: number;
}

/**
 * Interface pour un item restauré
 */
export interface RestoredItem {
  productId: string;
  title: string;
  quantity: number;
  adjustedQuantity?: boolean;
}

/**
 * Interface pour la réponse de restauration du panier
 */
export interface RestoreCartResponse {
  cart: Cart;
  restored: number;
  notRestored: NotRestoredItem[];
}

/**
 * Interface pour un panier expiré enrichi avec infos de disponibilité
 */
export interface ExpiredCart {
  _id: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  expiredAt: string;
  itemsCount: number;
  availableItems: number;
  unavailableItems: number;
}
