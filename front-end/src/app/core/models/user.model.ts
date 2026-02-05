/**
 * Interface représentant une adresse
 */
export interface Address {
  street?: string;
  city?: string;
  postalCode?: string;
  country?: string;
}

/**
 * Interface représentant le profil utilisateur
 */
export interface UserProfile {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: Address;
  avatar?: string;
}

/**
 * Interface représentant un portefeuille
 */
export interface Wallet {
  _id: string;
  balance: number;
  currency: string;
  pendingBalance?: number;
  totalEarned?: number;
  totalSpent?: number;
  isActive?: boolean;
}

/**
 * Interface représentant un utilisateur
 */
export interface User {
  _id: string;
  email: string;
  role: 'BUYER' | 'SELLER' | 'ADMIN';
  profile: UserProfile;
  isValidated: boolean;
  isActive?: boolean;
  walletId?: string;
  wallet?: Wallet;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Type pour les rôles utilisateur
 */
export type UserRole = 'BUYER' | 'SELLER' | 'ADMIN';

/**
 * Interface pour les statistiques utilisateurs
 */
export interface UserStats {
  total: number;
  byRole: {
    buyers: number;
    sellers: number;
    admins: number;
  };
  active: number;
  inactive: number;
  pendingValidation: number;
}

/**
 * Interface pour créer un utilisateur (Admin)
 */
export interface CreateUserRequest {
  email: string;
  password: string;
  role: UserRole;
  isValidated?: boolean;
  isActive?: boolean;
  profile: {
    firstName: string;
    lastName: string;
    phone?: string;
    address?: Address;
  };
}

/**
 * Interface pour mettre à jour un utilisateur (Admin)
 */
export interface UpdateUserRequest {
  email?: string;
  role?: UserRole;
  isValidated?: boolean;
  isActive?: boolean;
  profile?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatar?: string;
    address?: Address;
  };
}

/**
 * Interface pour une transaction wallet
 */
export interface WalletTransaction {
  _id: string;
  type:
    | 'DEPOSIT'
    | 'WITHDRAWAL'
    | 'PURCHASE'
    | 'SALE_INCOME'
    | 'REFUND'
    | 'COMMISSION'
    | 'TRANSFER_IN'
    | 'TRANSFER_OUT';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  paymentMethod?: 'WALLET' | 'CARD' | 'MOBILE_MONEY' | 'BANK_TRANSFER' | 'CASH';
  description?: string;
  createdAt: string;
}
