import {
  ADJUSTMENT_REASONS,
  MOVEMENT_TYPES,
  PAYMENT_METHODS,
  SALE_STATUSES,
} from './stock-movement.constants';

export type MovementType = (typeof MOVEMENT_TYPES)[number];

export type MovementDirection = 'IN' | 'OUT';

export type SaleStatus = (typeof SALE_STATUSES)[number];

export type StockMovementPaymentMethod = (typeof PAYMENT_METHODS)[number];

export interface StockMovementSaleInfo {
  cartId: string;
  paymentTransaction?: string;
  deliveryAddress: {
    street: string;
    city: string;
    postalCode?: string;
    country?: string;
  };
  status: SaleStatus;
  paymentMethod: StockMovementPaymentMethod;
  confirmedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
}

export interface StockMovementSupplyInfo {
  supplier: {
    name: string;
    contact?: string;
  };
  invoiceNumber?: string;
  notes?: string;
}

export interface StockMovementAdjustmentInfo {
  reason: (typeof ADJUSTMENT_REASONS)[number];
  notes?: string;
}

export interface StockMovement {
  _id: string;
  reference: string;
  movementType: MovementType;
  direction: MovementDirection;
  totalAmount: number;
  lineIds: StockMovementLine[];
  cartId?: string;
  sale?: StockMovementSaleInfo;
  supply?: StockMovementSupplyInfo;
  adjustment?: StockMovementAdjustmentInfo;
  performedBy?:
    | string
    | {
        _id: string;
        email?: string;
        profile?: {
          firstName?: string;
          lastName?: string;
        };
      };
  note?: string;
  date?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface StockMovementLine {
  _id: string;
  reference: string;
  moveId: string;
  productId:
    | string
    | {
        _id: string;
        title?: string;
        sku?: string;
        images?: string[];
        price?: number;
      };
  shopId:
    | string
    | {
        _id: string;
        name?: string;
      };
  movementType: MovementType;
  direction: MovementDirection;
  cartId?: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  stockBefore: number;
  stockAfter: number;
  performedBy?:
    | string
    | {
        _id: string;
        email?: string;
        profile?: {
          firstName?: string;
          lastName?: string;
        };
      };
  date: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateStockMovementItemRequest {
  productId: string;
  shopId: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateStockMovementRequest {
  movementType: MovementType;
  date: string;
  note?: string;
  cartId?: string;
  items: CreateStockMovementItemRequest[];
  adjustment?: {
    reason: (typeof ADJUSTMENT_REASONS)[number];
    notes?: string;
  };
  sale?: {
    cartId: string;
    paymentMethod: StockMovementPaymentMethod;
    deliveryAddress: {
      street: string;
      city: string;
      postalCode?: string;
      country?: string;
    };
  };
  supply?: {
    supplier: {
      name: string;
      contact?: string;
    };
    invoiceNumber?: string;
    notes?: string;
  };
}

export interface StockMovementFilters {
  page?: number;
  limit?: number;
  movementType?: MovementType;
  shopId?: string;
  productId?: string;
  status?: SaleStatus;
  sort?: string;
}
