/**
 * Interface représentant les informations de contact d'une boutique
 */
export interface ShopContact {
  email?: string;
  phone?: string;
  address?: string;
}

/**
 * Interface représentant les statistiques d'une boutique
 */
export interface ShopStats {
  totalSales: number;
  deliveredSalesAmount: number;
  products: {
    pending: number;
    active: number;
    archived: number;
  };
  rating: number;
}

/**
 * Statuts possibles d'une boutique
 */
export type ShopStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'ACTIVE'
  | 'REJECTED'
  | 'ARCHIVED';

/**
 * Interface représentant une boutique
 */
export interface Shop {
  _id: string;
  sellerId:
    | string
    | {
        _id: string;
        email?: string;
        profile?: {
          firstName?: string;
          lastName?: string;
        };
      };
  name: string;
  description?: string;
  logo?: string;
  banner?: string;
  contact?: ShopContact;
  categories?: string[];
  status: ShopStatus;
  rejectionReason?: string;
  isActive: boolean;
  commissionRate: number;
  stats: ShopStats;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Interface pour créer une boutique
 */
export interface CreateShopRequest {
  name: string;
  description?: string;
  logo?: string | null;
  banner?: string | null;
  contact?: ShopContact;
  categories?: string[];
}

/**
 * Interface pour mettre à jour une boutique
 */
export interface UpdateShopRequest {
  name?: string;
  description?: string;
  logo?: string | null;
  banner?: string | null;
  contact?: ShopContact;
  categories?: string[];
}

/**
 * Interface pour la modération d'une boutique par un admin
 */
export interface ModerateShopRequest {
  status: ShopStatus;
  rejectionReason?: string;
}

/**
 * Interface pour la mise à jour admin d'une boutique
 */
export interface AdminUpdateShopRequest {
  commissionRate?: number;
  name?: string;
  description?: string;
  categories?: string[];
}

/**
 * Interface pour les filtres de recherche des boutiques
 */
export interface ShopFilters {
  search?: string;
  status?: ShopStatus | 'ALL';
  category?: string;
  startDate?: string;
  endDate?: string;
  sort?:
    | 'createdAt'
    | '-createdAt'
    | 'name'
    | '-name'
    | 'commissionRate'
    | '-commissionRate';
}
