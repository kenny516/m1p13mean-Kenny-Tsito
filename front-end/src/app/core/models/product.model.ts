import { Shop } from './shop.model';

/**
 * Interface représentant le cache de stock d'un produit
 */
export interface StockCache {
  total: number;
  reserved: number;
  available: number;
  lastUpdated?: string;
}

/**
 * Interface représentant les alertes de stock
 */
export interface StockAlert {
  lowThreshold: number;
  outOfStock: number;
}

/**
 * Interface représentant le stock d'un produit
 */
export interface ProductStock {
  cache: StockCache;
  alert: StockAlert;
}

/**
 * Interface représentant les statistiques d'un produit
 */
export interface ProductStats {
  views: number;
  sales: number;
  deliveredSales: number;
  rating: number;
  reviewCount: number;
}

/**
 * Statuts possibles d'un produit
 */
export type ProductStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'ACTIVE'
  | 'REJECTED'
  | 'ARCHIVED';

/**
 * Interface représentant un produit
 */
export interface Product {
  _id: string;
  shopId: string | Shop;
  sellerId: string;
  sku?: string;
  title: string;
  description: string;
  category: string;
  tags?: string[];
  characteristics?: Record<string, unknown>;
  images: string[];
  price: number;
  originalPrice?: number;
  stock: ProductStock;
  status: ProductStatus;
  rejectionReason?: string;
  stats: ProductStats;
  isLowStock?: boolean;
  isOutOfStock?: boolean;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Interface pour les filtres de recherche produits
 */
export interface ProductFilters {
  search?: string;
  category?: string;
  tags?: string | string[];
  minPrice?: number;
  maxPrice?: number;
  shopId?: string;
  sellerId?: string;
  status?: ProductStatus | 'ALL';
  sort?: string;
}

/**
 * Interface pour créer un produit
 */
export interface CreateProductRequest {
  shopId: string;
  title: string;
  description: string;
  category: string;
  tags?: string[];
  characteristics?: Record<string, unknown>;
  images?: string[];
  price: number;
  originalPrice?: number;
}

/**
 * Interface pour mettre à jour un produit
 */
export interface UpdateProductRequest {
  title?: string;
  description?: string;
  category?: string;
  tags?: string[];
  characteristics?: Record<string, unknown>;
  images?: string[];
  price?: number;
  originalPrice?: number;
  status?: ProductStatus;
}

/**
 * Interface pour modérer un produit (admin)
 */
export interface ModerateProductRequest {
  status: 'ACTIVE' | 'REJECTED';
  rejectionReason?: string;
}

/**
 * Options de tri pour les produits
 */
export type ProductSortOption =
  | 'price'
  | '-price'
  | 'createdAt'
  | '-createdAt'
  | 'stats.sales'
  | '-stats.sales'
  | 'stats.rating'
  | '-stats.rating';

/**
 * Interface pour les options de tri affichables
 */
export interface SortOption {
  value: ProductSortOption;
  label: string;
}

/**
 * Options de tri disponibles
 */
export const PRODUCT_SORT_OPTIONS: SortOption[] = [
  { value: '-createdAt', label: 'Plus récents' },
  { value: 'createdAt', label: 'Plus anciens' },
  { value: 'price', label: 'Prix croissant' },
  { value: '-price', label: 'Prix décroissant' },
  { value: '-stats.sales', label: 'Meilleures ventes' },
  { value: '-stats.rating', label: 'Mieux notés' },
];
