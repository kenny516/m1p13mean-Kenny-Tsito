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
}

/**
 * Interface pour la réponse du checkout
 */
export interface CheckoutResponse {
  order: Cart;
  newCart: Cart;
  walletTransaction?: {
    _id: string;
    type: string;
    amount: number;
    balanceAfter: number;
    status: string;
  };
}

/**
 * Interface pour un résumé de panier (affichage)
 */
export interface CartSummary {
  itemCount: number;
  totalAmount: number;
  shopCount: number;
}
