/**
 * Constantes de design partagées pour l'uniformisation de l'application
 * Utilisées dans tous les espaces: Admin, Seller, Buyer
 */

// === Types de badges ZardUI ===
export type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

// === Rôles utilisateurs ===
export const USER_ROLE_LABELS: Record<string, string> = {
  BUYER: 'Acheteur',
  SELLER: 'Vendeur',
  ADMIN: 'Administrateur',
};

export const USER_ROLE_BADGE_VARIANTS: Record<string, BadgeVariant> = {
  BUYER: 'secondary',
  SELLER: 'default',
  ADMIN: 'outline',
};

// === Statuts boutiques ===
export const SHOP_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  PENDING: 'En attente',
  ACTIVE: 'Actif',
  REJECTED: 'Rejeté',
  ARCHIVED: 'Archivé',
};

export const SHOP_STATUS_BADGE_VARIANTS: Record<string, BadgeVariant> = {
  DRAFT: 'secondary',
  PENDING: 'outline',
  ACTIVE: 'default',
  REJECTED: 'destructive',
  ARCHIVED: 'secondary',
};

// === Statuts produits ===
export const PRODUCT_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  PENDING: 'En attente',
  ACTIVE: 'Actif',
  REJECTED: 'Rejeté',
  OUT_OF_STOCK: 'Rupture',
};

export const PRODUCT_STATUS_BADGE_VARIANTS: Record<string, BadgeVariant> = {
  DRAFT: 'secondary',
  PENDING: 'outline',
  ACTIVE: 'default',
  REJECTED: 'destructive',
  OUT_OF_STOCK: 'destructive',
};

// === Statuts commandes ===
export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  PROCESSING: 'En préparation',
  SHIPPED: 'Expédiée',
  DELIVERED: 'Livrée',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
  REFUNDED: 'Remboursée',
};

export const ORDER_STATUS_BADGE_VARIANTS: Record<string, BadgeVariant> = {
  PENDING: 'outline',
  CONFIRMED: 'secondary',
  PROCESSING: 'secondary',
  SHIPPED: 'default',
  DELIVERED: 'default',
  COMPLETED: 'default',
  CANCELLED: 'destructive',
  REFUNDED: 'destructive',
};

// === Statuts paiement ===
export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  PAID: 'Payé',
  FAILED: 'Échoué',
  REFUNDED: 'Remboursé',
};

export const PAYMENT_STATUS_BADGE_VARIANTS: Record<string, BadgeVariant> = {
  PENDING: 'outline',
  PAID: 'default',
  FAILED: 'destructive',
  REFUNDED: 'secondary',
};

// === Helpers génériques ===

/**
 * Retourne le label d'un statut ou le statut lui-même si non trouvé
 */
export function getStatusLabel(
  status: string,
  labels: Record<string, string>,
): string {
  return labels[status] || status;
}

/**
 * Retourne la variante de badge pour un statut
 */
export function getStatusBadgeVariant(
  status: string,
  variants: Record<string, BadgeVariant>,
): BadgeVariant {
  return variants[status] || 'secondary';
}

// === Espacements standards ===
export const SPACING = {
  page: 'py-8', // Espacement vertical des pages
  section: 'mb-8', // Espacement entre sections
  card: 'p-4', // Padding interne des cards
  cardLarge: 'p-6', // Padding des cards larges
  gap: 'gap-4', // Espacement dans les grids
  gapLarge: 'gap-6', // Espacement large
} as const;

// === Breakpoints grids ===
export const GRID_COLS = {
  filters: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5', // Grille filtres
  cards2: 'grid-cols-1 md:grid-cols-2', // 2 colonnes
  cards3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3', // 3 colonnes
  cards4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4', // 4 colonnes
  stats3: 'grid-cols-3', // Stats 3 colonnes
  stats4: 'grid-cols-2 lg:grid-cols-4', // Stats 4 colonnes
} as const;

// === Container ===
export const CONTAINER = {
  default: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
  small: 'max-w-4xl mx-auto px-4 sm:px-6',
  large: 'max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8',
} as const;

// === Formatage monétaire ===
export const CURRENCY = {
  code: 'MGA',
  locale: 'fr-MG',
  symbol: 'Ar',
};

/**
 * Formate un montant en Ariary
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat(CURRENCY.locale, {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' ' + CURRENCY.code;
}

// === Formatage dates ===
export const DATE_FORMATS = {
  short: 'dd/MM/yyyy',
  long: 'dd MMMM yyyy',
  datetime: 'dd/MM/yyyy HH:mm',
  time: 'HH:mm',
};

// === Initiales helpers ===
export function getInitials(
  firstName?: string,
  lastName?: string,
  fallback?: string,
): string {
  const first = firstName?.charAt(0) || '';
  const last = lastName?.charAt(0) || '';
  return (first + last).toUpperCase() || fallback?.charAt(0).toUpperCase() || '?';
}

// === Classes communes ===
export const COMMON_CLASSES = {
  // Headers de page
  pageHeader: 'flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8',
  pageTitle: 'text-2xl font-bold text-foreground',
  pageDescription: 'mt-1 text-muted-foreground',

  // Filtres card
  filterCard: 'mb-6',
  filterGrid: `grid ${GRID_COLS.filters} gap-4`,

  // Table card
  tableCard: 'overflow-hidden',

  // Pagination
  paginationContainer:
    'px-6 py-4 border-t border-border flex items-center justify-between',
  paginationText: 'text-sm text-muted-foreground',
  paginationButtons: 'flex space-x-2',

  // Empty states
  emptyState: 'p-12 text-center',
  emptyIcon: 'mx-auto h-12 w-12 text-muted-foreground',
  emptyTitle: 'mt-4 text-lg font-medium text-foreground',
  emptyDescription: 'mt-2 text-muted-foreground',

  // Actions row
  actionsRow: 'flex items-center justify-end space-x-1',

  // Stats cards
  statCard: 'text-center p-3 bg-muted/50 rounded-lg',
  statValue: 'text-2xl font-bold text-foreground',
  statLabel: 'text-xs text-muted-foreground',
} as const;
