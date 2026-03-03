/**
 * Modèle Settings - Paramètres de la plateforme
 */

export interface Settings {
  _id: string;

  // Paramètres Commission
  defaultCommissionRate: number;

  // Paramètres Panier
  cartTTLMinutes: number;

  // Paramètres Stock
  lowStockThreshold: number;
  outOfStockThreshold: number;

  // Paramètres Généraux
  currency: string;
  platformName: string;

  // Mode Maintenance
  maintenanceMode: boolean;
  maintenanceMessage: string;

  // Paramètres Email
  contactEmail?: string;
  supportEmail?: string;

  // Paramètres Paiement
  minOrderAmount: number;
  maxOrderAmount: number;

  // Paramètres Wallet
  minWithdrawalAmount: number;

  // Paramètres Retour
  returnWindowDays: number;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

/**
 * DTO pour la mise à jour des settings
 */
export interface UpdateSettingsDto {
  defaultCommissionRate?: number;
  cartTTLMinutes?: number;
  lowStockThreshold?: number;
  outOfStockThreshold?: number;
  currency?: string;
  platformName?: string;
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
  contactEmail?: string;
  supportEmail?: string;
  minOrderAmount?: number;
  maxOrderAmount?: number;
  minWithdrawalAmount?: number;
  returnWindowDays?: number;
}

/**
 * Groupes de paramètres pour l'affichage
 */
export interface SettingsGroup {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export const SETTINGS_GROUPS: SettingsGroup[] = [
  {
    id: 'commission',
    title: 'Commission',
    description: 'Paramètres de commission des boutiques',
    icon: 'percent',
  },
  {
    id: 'cart',
    title: 'Panier',
    description: 'Durée de vie et paramètres du panier',
    icon: 'shopping-cart',
  },
  {
    id: 'stock',
    title: 'Stock',
    description: 'Seuils d\'alerte de stock',
    icon: 'package',
  },
  {
    id: 'general',
    title: 'Général',
    description: 'Paramètres généraux de la plateforme',
    icon: 'settings',
  },
  {
    id: 'maintenance',
    title: 'Maintenance',
    description: 'Mode maintenance de la plateforme',
    icon: 'tool',
  },
  {
    id: 'payment',
    title: 'Paiement',
    description: 'Paramètres de paiement et wallet',
    icon: 'credit-card',
  },
];
