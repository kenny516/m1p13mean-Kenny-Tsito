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
  walletId?: string;
  wallet?: Wallet;
  createdAt: string;
  updatedAt?: string;
}

/**
 * Type pour les rôles utilisateur
 */
export type UserRole = 'BUYER' | 'SELLER' | 'ADMIN';
