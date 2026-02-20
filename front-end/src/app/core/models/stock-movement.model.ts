export type MovementType =
  | 'SUPPLY'
  | 'SALE'
  | 'RETURN_CUSTOMER'
  | 'RETURN_SUPPLIER'
  | 'ADJUSTMENT_PLUS'
  | 'ADJUSTMENT_MINUS'
  | 'RESERVATION'
  | 'RESERVATION_CANCEL';

export type MovementDirection = 'IN' | 'OUT';

export type SaleStatus = 'CONFIRMED' | 'DELIVERED' | 'CANCELLED';

export type StockMovementPaymentMethod =
  | 'WALLET'
  | 'CARD'
  | 'MOBILE_MONEY'
  | 'CASH_ON_DELIVERY';

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
  reason: 'INVENTORY_COUNT' | 'DAMAGED' | 'LOST' | 'STOLEN' | 'EXPIRED' | 'OTHER';
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
  note?: string;
  date?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface StockMovementLine {
  _id: string;
  reference: string;
  moveId: string;
  productId: string;
  shopId: string;
  movementType: MovementType;
  direction: MovementDirection;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  stockBefore: number;
  stockAfter: number;
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
  items: CreateStockMovementItemRequest[];
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
