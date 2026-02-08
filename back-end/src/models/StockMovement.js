import mongoose from "mongoose";

// ==========================================
// Constantes réutilisables (exportées)
// ==========================================

export const MOVEMENT_TYPES = [
  "SUPPLY",
  "SALE",
  "RETURN_CUSTOMER",
  "RETURN_SUPPLIER",
  "ADJUSTMENT_PLUS",
  "ADJUSTMENT_MINUS",
  "TRANSFER_IN",
  "TRANSFER_OUT",
  "RESERVATION",
  "RESERVATION_CANCEL",
];

export const IN_MOVEMENTS = [
  "SUPPLY",
  "RETURN_CUSTOMER",
  "ADJUSTMENT_PLUS",
  "TRANSFER_IN",
  "RESERVATION_CANCEL",
];

export const SALE_STATUSES = [
  "PENDING",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

export const PAYMENT_METHODS = ["WALLET", "CARD", "MOBILE_MONEY", "CASH_ON_DELIVERY"];

export const ADJUSTMENT_REASONS = [
  "INVENTORY_COUNT",
  "DAMAGED",
  "LOST",
  "STOLEN",
  "EXPIRED",
  "OTHER",
];

export const REFERENCE_PREFIXES = {
  SUPPLY: "SUP",
  SALE: "SAL",
  RETURN_CUSTOMER: "RTC",
  RETURN_SUPPLIER: "RTS",
  ADJUSTMENT_PLUS: "AJP",
  ADJUSTMENT_MINUS: "AJM",
  TRANSFER_IN: "TRI",
  TRANSFER_OUT: "TRO",
  RESERVATION: "RES",
  RESERVATION_CANCEL: "REC",
};

export const VALID_SALE_TRANSITIONS = {
  PENDING: ["PAID", "CANCELLED"],
  PAID: ["PROCESSING", "CANCELLED", "REFUNDED", "DELIVERED"],
  PROCESSING: ["SHIPPED", "CANCELLED", "DELIVERED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

/**
 * Modèle UNIQUE et CENTRAL pour la gestion de stock
 * Chaque mouvement de stock est tracé ici
 * Le stock actuel = somme des mouvements
 *
 * Cette table remplace les tables Order, Sale, Supply, InventoryAdjustment
 * Toutes les informations nécessaires sont stockées directement ici
 */
const stockMovementSchema = new mongoose.Schema(
  {
    // Numéro de référence unique (généré automatiquement)
    reference: {
      type: String,
      unique: true,
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    // Type de mouvement
    movementType: {
      type: String,
      enum: MOVEMENT_TYPES,
      required: true,
    },
    // Direction du mouvement (calculé automatiquement)
    direction: {
      type: String,
      enum: ["IN", "OUT"],
      required: true,
    },
    // Quantité (toujours positive, direction détermine le signe)
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    // Prix unitaire au moment du mouvement
    unitPrice: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Coût/Montant total du mouvement
    totalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Stock avant et après le mouvement (pour audit)
    stockBefore: {
      type: Number,
      required: true,
    },
    stockAfter: {
      type: Number,
      required: true,
    },

    // ========== INFORMATIONS VENTE (movementType: SALE) ==========
    sale: {
      buyerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      // Snapshot du produit au moment de la vente
      productSnapshot: {
        title: String,
        sku: String,
        price: Number,
        originalPrice: Number,
        images: [String],
      },
      // Adresse de livraison
      deliveryAddress: {
        street: String,
        city: String,
        postalCode: String,
        country: String,
      },
      // Statut de la commande
      status: {
        type: String,
        enum: SALE_STATUSES,
        default: "PENDING",
      },
      paymentMethod: {
        type: String,
        enum: PAYMENT_METHODS,
      },
      // Numéro de suivi
      trackingNumber: String,
      // Dates importantes
      paidAt: Date,
      shippedAt: Date,
      deliveredAt: Date,
    },

    // ========== INFORMATIONS APPROVISIONNEMENT (movementType: SUPPLY) ==========
    supply: {
      supplier: {
        name: String,
        contact: String,
      },
      invoiceNumber: String,
      costPerUnit: Number,
      notes: String,
    },

    // ========== INFORMATIONS AJUSTEMENT ==========
    adjustment: {
      reason: {
        type: String,
        enum: ADJUSTMENT_REASONS,
      },
      notes: String,
    },

    // ========== INFORMATIONS RÉSERVATION (movementType: RESERVATION) ==========
    reservation: {
      cartId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Cart",
      },
      expiresAt: Date,
    },

    // ========== INFORMATIONS TRANSFERT ==========
    transfer: {
      fromShopId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Shop",
      },
      toShopId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Shop",
      },
      transferReference: String,
    },

    // GroupId pour lier plusieurs mouvements d'une même transaction
    groupId: String,

    // Utilisateur ayant effectué le mouvement
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // Notes générales
    notes: String,
  },
  { timestamps: true }
);

// Index pour performance
stockMovementSchema.index({ productId: 1, createdAt: -1 });
stockMovementSchema.index({ shopId: 1, movementType: 1, createdAt: -1 });
stockMovementSchema.index({ movementType: 1, createdAt: -1 });
stockMovementSchema.index({ performedBy: 1, createdAt: -1 });
stockMovementSchema.index({ "sale.buyerId": 1, createdAt: -1 });
stockMovementSchema.index({ "sale.status": 1 });
stockMovementSchema.index({ "reservation.cartId": 1 });
stockMovementSchema.index({ groupId: 1 });

// Génération automatique de la référence et direction
stockMovementSchema.pre("validate", function () {
  // Générer la référence si non définie
  if (!this.reference) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");

    const prefix = REFERENCE_PREFIXES[this.movementType] || "MOV";
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.reference = `${prefix}-${year}${month}${day}-${random}`;
  }

  // Déterminer automatiquement la direction selon le type
  this.direction = IN_MOVEMENTS.includes(this.movementType) ? "IN" : "OUT";

});

// Méthode statique pour calculer le stock actuel d'un produit
stockMovementSchema.statics.calculateStock = async function (productId) {
  const result = await this.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: null,
        totalIn: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$direction", "IN"] },
                  { $not: [{ $in: ["$movementType", ["RESERVATION", "RESERVATION_CANCEL"]] }] },
                ],
              },
              "$quantity",
              0,
            ],
          },
        },
        totalOut: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ["$direction", "OUT"] },
                  { $not: [{ $in: ["$movementType", ["RESERVATION", "RESERVATION_CANCEL"]] }] },
                ],
              },
              "$quantity",
              0,
            ],
          },
        },
        reserved: {
          $sum: {
            $cond: [{ $eq: ["$movementType", "RESERVATION"] }, "$quantity", 0],
          },
        },
        reservedCancelled: {
          $sum: {
            $cond: [
              { $eq: ["$movementType", "RESERVATION_CANCEL"] },
              "$quantity",
              0,
            ],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        total: { $subtract: ["$totalIn", "$totalOut"] },
        reserved: { $subtract: ["$reserved", "$reservedCancelled"] },
        available: {
          $subtract: [
            { $subtract: ["$totalIn", "$totalOut"] },
            { $subtract: ["$reserved", "$reservedCancelled"] },
          ],
        },
      },
    },
  ]);

  return result[0] || { total: 0, reserved: 0, available: 0 };
};

// Méthode statique pour obtenir les ventes d'un produit
stockMovementSchema.statics.getSales = async function (filters = {}) {
  const query = { movementType: "SALE" };

  if (filters.shopId) {
    query.shopId = new mongoose.Types.ObjectId(filters.shopId);
  }
  if (filters.buyerId) {
    query["sale.buyerId"] = new mongoose.Types.ObjectId(filters.buyerId);
  }
  if (filters.status) {
    query["sale.status"] = filters.status;
  }
  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
    if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
  }

  return this.find(query)
    .populate("productId", "title images")
    .populate("sale.buyerId", "email profile")
    .sort({ createdAt: -1 });
};

// Méthode statique pour obtenir les approvisionnements
stockMovementSchema.statics.getSupplies = async function (filters = {}) {
  const query = { movementType: "SUPPLY" };

  if (filters.shopId) {
    query.shopId = new mongoose.Types.ObjectId(filters.shopId);
  }
  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
    if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
  }

  return this.find(query)
    .populate("productId", "title sku")
    .sort({ createdAt: -1 });
};

export default mongoose.model("StockMovement", stockMovementSchema);
