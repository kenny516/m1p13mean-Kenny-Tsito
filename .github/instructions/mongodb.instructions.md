---
description: Règles et bonnes pratiques pour MongoDB et Mongoose
applyTo: back-end/src/models/**
---

# MongoDB & Mongoose Instructions

## 🎯 Principes NoSQL pour ce Projet

Ce projet utilise MongoDB avec Mongoose. Les règles suivantes doivent être respectées pour garantir performance et intégrité des données.

---

## 📊 Architecture Gestion de Stock

### Principe Fondamental : Mouvements de Stock

Le stock est géré via un système de **mouvements de stock** (comme dans les ERP professionnels).
Le stock actuel d'un produit = **somme de tous les mouvements** (entrées - sorties).

```
Stock Actuel = Σ (Mouvements IN) - Σ (Mouvements OUT)
```

**Types de mouvements :**
| Type | Direction | Description |
|------|-----------|-------------|
| `SUPPLY` | IN (+) | Approvisionnement / Réception de marchandise |
| `SALE` | OUT (-) | Vente confirmée |
| `RETURN_CUSTOMER` | IN (+) | Retour client |
| `RETURN_SUPPLIER` | OUT (-) | Retour fournisseur |
| `ADJUSTMENT_PLUS` | IN (+) | Ajustement inventaire (surplus) |
| `ADJUSTMENT_MINUS` | OUT (-) | Ajustement inventaire (perte/vol/casse) |
| `TRANSFER_IN` | IN (+) | Transfert entrant (entre boutiques) |
| `TRANSFER_OUT` | OUT (-) | Transfert sortant (entre boutiques) |
| `RESERVATION` | OUT (-) | Réservation panier (stock bloqué) |
| `RESERVATION_CANCEL` | IN (+) | Annulation réservation (stock libéré) |

---

## 📊 Schémas de Données

> **Note**: Tous les modèles utilisent ES Modules (`import`/`export`)

### User (Utilisateur)

```javascript
import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "Email requis"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Email invalide"],
    },
    passwordHash: {
      type: String,
      required: true,
      select: false, // Ne pas retourner par défaut
    },
    role: {
      type: String,
      enum: ["BUYER", "SELLER", "ADMIN"],
      required: true,
    },
    profile: {
      name: { type: String, required: true },
      phone: String,
      address: {
        street: String,
        city: String,
        postalCode: String,
        country: { type: String, default: "Madagascar" },
      },
    },
    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
    },
    isValidated: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// Index
userSchema.index({ email: 1 });
userSchema.index({ role: 1, isActive: 1 });

export default mongoose.model("User", userSchema);
```

### Shop (Boutique)

```javascript
import mongoose from "mongoose";

const shopSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // Un vendeur = une boutique
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
    logo: String,
    banner: String,
    contact: {
      email: String,
      phone: String,
      address: String,
    },
    categories: [String],
    isActive: {
      type: Boolean,
      default: false, // Nécessite validation admin
    },
    commissionRate: {
      type: Number,
      default: 10, // 10% par défaut
      min: 0,
      max: 100,
    },
    stats: {
      totalProducts: { type: Number, default: 0 },
      totalSales: { type: Number, default: 0 },
      totalRevenue: { type: Number, default: 0 },
      rating: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);

shopSchema.index({ name: "text", description: "text" });
shopSchema.index({ isActive: 1 });
shopSchema.index({ categories: 1 });

export default mongoose.model("Shop", shopSchema);
```

### Product (Produit)

```javascript
import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sku: {
      type: String,
      unique: true,
      sparse: true, // Permet null mais unique si défini
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    originalPrice: Number, // Pour les promotions
    // Stock calculé - mis à jour via agrégation des mouvements
    // Peut être dénormalisé pour performance (recalculé périodiquement)
    stockCache: {
      available: { type: Number, default: 0 }, // Stock disponible
      reserved: { type: Number, default: 0 }, // Stock réservé (paniers)
      total: { type: Number, default: 0 }, // Stock total (available + reserved)
      lastUpdated: { type: Date, default: Date.now },
    },
    // Seuils d'alerte
    stockAlert: {
      lowThreshold: { type: Number, default: 10 }, // Seuil stock bas
      outOfStock: { type: Number, default: 0 }, // Seuil rupture
    },
    images: [String],
    category: {
      type: String,
      required: true,
    },
    tags: [String],
    characteristics: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
    status: {
      type: String,
      enum: ["DRAFT", "PENDING", "ACTIVE", "REJECTED", "OUT_OF_STOCK"],
      default: "DRAFT",
    },
    rejectionReason: String,
    stats: {
      views: { type: Number, default: 0 },
      sales: { type: Number, default: 0 },
      rating: { type: Number, default: 0 },
      reviewCount: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);

// Index pour recherche full-text
productSchema.index({ title: "text", description: "text", tags: "text" });
// Index composites
productSchema.index({ shopId: 1, status: 1 });
productSchema.index({ category: 1, status: 1, price: 1 });
productSchema.index({ status: 1, createdAt: -1 });
productSchema.index({ tags: 1 });
productSchema.index({ sku: 1 });
productSchema.index({ "stockCache.available": 1, status: 1 }); // Pour alertes stock

// Virtual pour vérifier si stock bas
productSchema.virtual("isLowStock").get(function () {
  return this.stockCache.available <= this.stockAlert.lowThreshold;
});

// Virtual pour vérifier rupture
productSchema.virtual("isOutOfStock").get(function () {
  return this.stockCache.available <= this.stockAlert.outOfStock;
});

export default mongoose.model("Product", productSchema);
```

### StockMovement (Mouvement de Stock) ⭐ TABLE CENTRALE

```javascript
import mongoose from "mongoose";

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
      enum: [
        // Entrées (+)
        "SUPPLY", // Approvisionnement
        "RETURN_CUSTOMER", // Retour client
        "ADJUSTMENT_PLUS", // Ajustement positif (inventaire)
        "TRANSFER_IN", // Transfert entrant
        "RESERVATION_CANCEL", // Annulation réservation
        // Sorties (-)
        "SALE", // Vente
        "RETURN_SUPPLIER", // Retour fournisseur
        "ADJUSTMENT_MINUS", // Ajustement négatif (perte/vol/casse)
        "TRANSFER_OUT", // Transfert sortant
        "RESERVATION", // Réservation panier
      ],
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
      min: 0,
    },
    // Coût/Montant total du mouvement
    totalAmount: {
      type: Number,
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
        sku: String,
        title: String,
        price: Number,
        image: String,
      },
      // Snapshot de l'acheteur
      buyerSnapshot: {
        name: String,
        email: String,
        phone: String,
      },
      // Adresse de livraison
      deliveryAddress: {
        recipientName: String,
        street: String,
        city: String,
        postalCode: String,
        country: { type: String, default: "Madagascar" },
        phone: String,
      },
      // Calculs financiers
      commission: Number, // Commission centre commercial
      commissionRate: Number, // Taux en %
      sellerAmount: Number, // Montant reversé au vendeur
      // Statut de la vente
      status: {
        type: String,
        enum: [
          "PENDING",
          "CONFIRMED",
          "PROCESSING",
          "SHIPPED",
          "DELIVERED",
          "COMPLETED",
          "CANCELLED",
          "REFUNDED",
        ],
        default: "CONFIRMED",
      },
      paymentStatus: {
        type: String,
        enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
        default: "PAID",
      },
      paymentMethod: {
        type: String,
        enum: ["WALLET", "CARD", "MOBILE_MONEY", "CASH_ON_DELIVERY"],
      },
      // Dates
      paidAt: Date,
      shippedAt: Date,
      deliveredAt: Date,
    },

    // ========== INFORMATIONS APPROVISIONNEMENT (movementType: SUPPLY) ==========
    supply: {
      // Fournisseur
      supplier: {
        name: String,
        contact: String,
        reference: String, // Numéro bon de livraison fournisseur
      },
      // Info lot (optionnel)
      batch: {
        number: String,
        expiryDate: Date,
      },
      unitCost: Number, // Coût d'achat unitaire
    },

    // ========== INFORMATIONS AJUSTEMENT (movementType: ADJUSTMENT_*) ==========
    adjustment: {
      reason: {
        type: String,
        enum: [
          "INVENTORY",
          "LOSS",
          "THEFT",
          "DAMAGE",
          "EXPIRY",
          "CORRECTION",
          "OTHER",
        ],
      },
      stockTheoretical: Number, // Stock théorique avant ajustement
      stockActual: Number, // Stock réel constaté
    },

    // ========== INFORMATIONS RETOUR (movementType: RETURN_*) ==========
    return: {
      originalMovementId: mongoose.Schema.Types.ObjectId, // Référence au mouvement original
      reason: {
        type: String,
        enum: [
          "DEFECTIVE",
          "WRONG_ITEM",
          "NOT_AS_DESCRIBED",
          "CHANGED_MIND",
          "OTHER",
        ],
      },
    },

    // ========== INFORMATIONS RESERVATION (movementType: RESERVATION*) ==========
    reservation: {
      cartId: mongoose.Schema.Types.ObjectId,
      expiresAt: Date,
    },

    // ========== CHAMPS COMMUNS ==========
    // Raison/Motif du mouvement
    reason: String,
    // Notes additionnelles
    notes: String,
    // Qui a effectué le mouvement
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Groupe de mouvements (pour lier plusieurs produits d'une même transaction)
    groupId: {
      type: String,
      index: true,
    },
  },
  { timestamps: true },
);

// Index pour performance
stockMovementSchema.index({ productId: 1, createdAt: -1 });
stockMovementSchema.index({ shopId: 1, movementType: 1, createdAt: -1 });
stockMovementSchema.index({ movementType: 1, createdAt: -1 });
stockMovementSchema.index({ performedBy: 1, createdAt: -1 });
stockMovementSchema.index({ reference: 1 });
stockMovementSchema.index({ "sale.buyerId": 1, createdAt: -1 });
stockMovementSchema.index({ "sale.status": 1 });
stockMovementSchema.index({ "reservation.cartId": 1 });

// Génération automatique de la référence et direction
stockMovementSchema.pre("validate", async function (next) {
  // Générer la référence si non définie
  if (!this.reference) {
    const prefix =
      {
        SUPPLY: "APP",
        SALE: "VNT",
        RETURN_CUSTOMER: "RET",
        RETURN_SUPPLIER: "RSF",
        ADJUSTMENT_PLUS: "ADJ",
        ADJUSTMENT_MINUS: "ADJ",
        TRANSFER_IN: "TRF",
        TRANSFER_OUT: "TRF",
        RESERVATION: "RES",
        RESERVATION_CANCEL: "RES",
      }[this.movementType] || "MVT";

    const count = await mongoose.model("StockMovement").countDocuments();
    const year = new Date().getFullYear();
    this.reference = `${prefix}-${year}-${String(count + 1).padStart(6, "0")}`;
  }

  // Déterminer automatiquement la direction selon le type
  const inMovements = [
    "SUPPLY",
    "RETURN_CUSTOMER",
    "ADJUSTMENT_PLUS",
    "TRANSFER_IN",
    "RESERVATION_CANCEL",
  ];
  this.direction = inMovements.includes(this.movementType) ? "IN" : "OUT";

  next();
});

// Méthode statique pour calculer le stock actuel d'un produit
stockMovementSchema.statics.calculateStock = async function (productId) {
  const result = await this.aggregate([
    { $match: { productId: new mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: "$productId",
        totalIn: {
          $sum: {
            $cond: [{ $eq: ["$direction", "IN"] }, "$quantity", 0],
          },
        },
        totalOut: {
          $sum: {
            $cond: [{ $eq: ["$direction", "OUT"] }, "$quantity", 0],
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
        total: { $subtract: ["$totalIn", "$totalOut"] },
        reserved: { $subtract: ["$reserved", "$reservedCancelled"] },
      },
    },
    {
      $project: {
        total: 1,
        reserved: 1,
        available: { $subtract: ["$total", "$reserved"] },
      },
    },
  ]);

  return result[0] || { total: 0, reserved: 0, available: 0 };
};

// Méthode statique pour obtenir les ventes d'un produit
stockMovementSchema.statics.getSales = async function (filters = {}) {
  const query = { movementType: "SALE" };

  if (filters.shopId)
    query.shopId = new mongoose.Types.ObjectId(filters.shopId);
  if (filters.buyerId)
    query["sale.buyerId"] = new mongoose.Types.ObjectId(filters.buyerId);
  if (filters.status) query["sale.status"] = filters.status;
  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) query.createdAt.$gte = filters.startDate;
    if (filters.endDate) query.createdAt.$lte = filters.endDate;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .populate("productId", "title images")
    .populate("sale.buyerId", "profile.name email");
};

// Méthode statique pour obtenir les approvisionnements
stockMovementSchema.statics.getSupplies = async function (filters = {}) {
  const query = { movementType: "SUPPLY" };

  if (filters.shopId)
    query.shopId = new mongoose.Types.ObjectId(filters.shopId);
  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) query.createdAt.$gte = filters.startDate;
    if (filters.endDate) query.createdAt.$lte = filters.endDate;
  }

  return this.find(query)
    .sort({ createdAt: -1 })
    .populate("productId", "title sku");
};

export default mongoose.model("StockMovement", stockMovementSchema);
```

### Cart (Panier avec TTL)

```javascript
import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
  {
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
    // Snapshot du prix au moment de l'ajout
    priceSnapshot: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    // ID du mouvement de réservation (pour annulation)
    reservationMovementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StockMovement",
    },
  },
  { _id: true },
);

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: [cartItemSchema],
    expiresAt: {
      type: Date,
      default: () => new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      index: { expires: 0 }, // TTL index
    },
  },
  { timestamps: true },
);

cartSchema.index({ userId: 1 });

// Middleware pour libérer le stock réservé quand le panier expire/est supprimé
// Note: Doit être géré côté application car TTL ne déclenche pas les hooks

export default mongoose.model("Cart", cartSchema);
```

### Wallet (Portefeuille)

```javascript
import mongoose from "mongoose";

const walletSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "ownerModel",
    },
    ownerModel: {
      type: String,
      required: true,
      enum: ["User", "Shop"],
    },
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
    pendingBalance: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: "MGA", // Ariary malgache
    },
  },
  { timestamps: true },
);

walletSchema.index({ ownerId: 1, ownerModel: 1 }, { unique: true });

export default mongoose.model("Wallet", walletSchema);
```

### WalletTransaction

```javascript
import mongoose from "mongoose";

const walletTransactionSchema = new mongoose.Schema(
  {
    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "DEPOSIT", // Dépôt
        "WITHDRAWAL", // Retrait
        "SALE_PAYMENT", // Paiement d'une vente (acheteur)
        "SALE_REVENUE", // Revenu de vente (vendeur)
        "REFUND", // Remboursement
        "COMMISSION", // Commission centre commercial
        "TRANSFER_IN", // Transfert entrant
        "TRANSFER_OUT", // Transfert sortant
      ],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    balanceBefore: Number,
    balanceAfter: Number,
    // Référence au mouvement de stock source
    stockMovementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StockMovement",
    },
    stockMovementRef: String, // Numéro de référence du mouvement
    description: String,
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED", "CANCELLED"],
      default: "COMPLETED",
    },
  },
  { timestamps: true },
);

walletTransactionSchema.index({ walletId: 1, createdAt: -1 });
walletTransactionSchema.index({ type: 1, status: 1 });
walletTransactionSchema.index({ stockMovementId: 1 });

export default mongoose.model("WalletTransaction", walletTransactionSchema);
```

---

## 🔄 Flux de Gestion de Stock

### 1. Approvisionnement (Entrée de stock)

```javascript
import mongoose from "mongoose";
import StockMovement from "../models/StockMovement.js";
import Product from "../models/Product.js";

/**
 * Créer un approvisionnement (entrée de stock)
 */
export const createSupply = async (
  shopId,
  productId,
  quantity,
  supplyData,
  userId,
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const product = await Product.findById(productId).session(session);
    if (!product) {
      throw new Error("Produit non trouvé");
    }

    // Calculer le stock actuel
    const currentStock = await StockMovement.calculateStock(productId);

    // Créer le mouvement d'approvisionnement
    const movement = await StockMovement.create(
      [
        {
          productId,
          shopId,
          movementType: "SUPPLY",
          quantity,
          unitPrice: supplyData.unitCost,
          totalAmount: supplyData.unitCost * quantity,
          stockBefore: currentStock.total,
          stockAfter: currentStock.total + quantity,
          supply: {
            supplier: supplyData.supplier,
            batch: supplyData.batch,
            unitCost: supplyData.unitCost,
          },
          notes: supplyData.notes,
          performedBy: userId,
        },
      ],
      { session },
    );

    // Mettre à jour le cache de stock du produit
    await Product.findByIdAndUpdate(
      productId,
      {
        $inc: {
          "stockCache.available": quantity,
          "stockCache.total": quantity,
        },
        "stockCache.lastUpdated": new Date(),
      },
      { session },
    );

    await session.commitTransaction();
    return movement[0];
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
```

### 2. Réservation Panier (Blocage de stock)

```javascript
import mongoose from "mongoose";
import Cart from "../models/Cart.js";
import StockMovement from "../models/StockMovement.js";
import Product from "../models/Product.js";

/**
 * Ajouter un produit au panier avec réservation de stock
 */
export const addToCart = async (userId, productId, quantity) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const product = await Product.findById(productId).session(session);
    if (!product || product.status !== "ACTIVE") {
      throw new Error("Produit non disponible");
    }

    // Vérifier le stock disponible
    if (product.stockCache.available < quantity) {
      throw new Error("Stock insuffisant");
    }

    // Ajouter/Mettre à jour le panier d'abord
    let cart = await Cart.findOne({ userId }).session(session);
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    // Créer le mouvement de réservation
    const movement = await StockMovement.create(
      [
        {
          productId: product._id,
          shopId: product.shopId,
          movementType: "RESERVATION",
          quantity,
          unitPrice: product.price,
          totalAmount: product.price * quantity,
          stockBefore: product.stockCache.available,
          stockAfter: product.stockCache.available - quantity,
          reservation: {
            cartId: cart._id,
            expiresAt: new Date(Date.now() + 30 * 60 * 1000),
          },
          performedBy: userId,
        },
      ],
      { session },
    );

    // Mettre à jour le cache de stock
    await Product.findByIdAndUpdate(
      productId,
      {
        $inc: {
          "stockCache.available": -quantity,
          "stockCache.reserved": quantity,
        },
        "stockCache.lastUpdated": new Date(),
      },
      { session },
    );

    // Vérifier si le produit est déjà dans le panier
    const existingItem = cart.items.find(
      (item) => item.productId.toString() === productId.toString(),
    );

    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.reservationMovementId = movement[0]._id;
    } else {
      cart.items.push({
        productId: product._id,
        shopId: product.shopId,
        priceSnapshot: product.price,
        quantity,
        reservationMovementId: movement[0]._id,
      });
    }

    // Réinitialiser le TTL
    cart.expiresAt = new Date(Date.now() + 30 * 60 * 1000);
    await cart.save({ session });

    await session.commitTransaction();
    return cart;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
```

### 3. Finalisation Vente (Conversion réservation → vente)

```javascript
import mongoose from "mongoose";
import Cart from "../models/Cart.js";
import StockMovement from "../models/StockMovement.js";
import Product from "../models/Product.js";
import Wallet from "../models/Wallet.js";
import WalletTransaction from "../models/WalletTransaction.js";
import Shop from "../models/Shop.js";
import User from "../models/User.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Finaliser une vente depuis le panier
 * Utilise uniquement StockMovement pour tracer les ventes
 */
export const processSale = async (userId, deliveryAddress, paymentMethod) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Récupérer le panier et l'acheteur
    const [cart, buyer] = await Promise.all([
      Cart.findOne({ userId })
        .populate("items.productId")
        .populate("items.shopId")
        .session(session),
      User.findById(userId).session(session),
    ]);

    if (!cart || cart.items.length === 0) {
      throw new Error("Panier vide");
    }

    // Générer un groupId pour lier tous les mouvements de cette transaction
    const groupId = uuidv4();
    const saleMovements = [];

    // 2. Traiter chaque item du panier
    for (const item of cart.items) {
      const product = item.productId;
      const shop = item.shopId;
      const currentStock = await StockMovement.calculateStock(product._id);

      // Calculer les montants
      const totalPrice = item.priceSnapshot * item.quantity;
      const commissionRate = shop.commissionRate || 10;
      const commission = totalPrice * (commissionRate / 100);
      const sellerAmount = totalPrice - commission;

      // Annuler la réservation
      await StockMovement.create(
        [
          {
            productId: product._id,
            shopId: shop._id,
            movementType: "RESERVATION_CANCEL",
            quantity: item.quantity,
            stockBefore: currentStock.available,
            stockAfter: currentStock.available + item.quantity,
            reservation: {
              cartId: cart._id,
            },
            groupId,
            performedBy: userId,
          },
        ],
        { session },
      );

      // Créer le mouvement de VENTE avec toutes les informations
      const saleMovement = await StockMovement.create(
        [
          {
            productId: product._id,
            shopId: shop._id,
            movementType: "SALE",
            quantity: item.quantity,
            unitPrice: item.priceSnapshot,
            totalAmount: totalPrice,
            stockBefore: currentStock.available + item.quantity,
            stockAfter: currentStock.available,
            sale: {
              buyerId: userId,
              productSnapshot: {
                sku: product.sku,
                title: product.title,
                price: item.priceSnapshot,
                image: product.images?.[0],
              },
              buyerSnapshot: {
                name: buyer.profile.name,
                email: buyer.email,
                phone: buyer.profile.phone,
              },
              deliveryAddress,
              commission,
              commissionRate,
              sellerAmount,
              status: "CONFIRMED",
              paymentStatus: "PAID",
              paymentMethod,
              paidAt: new Date(),
            },
            groupId,
            performedBy: userId,
          },
        ],
        { session },
      );

      saleMovements.push(saleMovement[0]);

      // Mettre à jour le cache du produit
      await Product.findByIdAndUpdate(
        product._id,
        {
          $inc: {
            "stockCache.reserved": -item.quantity,
            "stockCache.total": -item.quantity,
            "stats.sales": item.quantity,
          },
          "stockCache.lastUpdated": new Date(),
        },
        { session },
      );

      // Gérer les transactions wallet
      // Débiter l'acheteur
      const buyerWallet = await Wallet.findOne({
        ownerId: userId,
        ownerModel: "User",
      }).session(session);

      if (buyerWallet.balance < totalPrice) {
        throw new Error("Solde insuffisant");
      }

      const buyerBalanceBefore = buyerWallet.balance;
      buyerWallet.balance -= totalPrice;
      await buyerWallet.save({ session });

      await WalletTransaction.create(
        [
          {
            walletId: buyerWallet._id,
            type: "SALE_PAYMENT",
            amount: -totalPrice,
            balanceBefore: buyerBalanceBefore,
            balanceAfter: buyerWallet.balance,
            stockMovementId: saleMovement[0]._id,
            stockMovementRef: saleMovement[0].reference,
            description: `Achat: ${product.title}`,
          },
        ],
        { session },
      );

      // Créditer le vendeur (en pending jusqu'à livraison)
      await Wallet.findOneAndUpdate(
        { ownerId: shop._id, ownerModel: "Shop" },
        { $inc: { pendingBalance: sellerAmount } },
        { session },
      );

      // Mettre à jour les stats de la boutique
      await Shop.findByIdAndUpdate(
        shop._id,
        {
          $inc: {
            "stats.totalSales": 1,
            "stats.totalRevenue": sellerAmount,
          },
        },
        { session },
      );
    }

    // 3. Supprimer le panier
    await Cart.findByIdAndDelete(cart._id, { session });

    await session.commitTransaction();
    return saleMovements;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
```

### 4. Ajustement d'Inventaire

```javascript
import mongoose from "mongoose";
import StockMovement from "../models/StockMovement.js";
import Product from "../models/Product.js";

/**
 * Créer un ajustement d'inventaire
 */
export const createAdjustment = async (
  shopId,
  productId,
  actualStock,
  reason,
  notes,
  userId,
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const product = await Product.findById(productId).session(session);
    if (!product) {
      throw new Error("Produit non trouvé");
    }

    // Calculer le stock théorique
    const currentStock = await StockMovement.calculateStock(productId);
    const theoreticalStock = currentStock.total;
    const difference = actualStock - theoreticalStock;

    if (difference === 0) {
      throw new Error("Aucun ajustement nécessaire");
    }

    const movementType =
      difference > 0 ? "ADJUSTMENT_PLUS" : "ADJUSTMENT_MINUS";
    const quantity = Math.abs(difference);

    // Créer le mouvement d'ajustement
    const movement = await StockMovement.create(
      [
        {
          productId,
          shopId,
          movementType,
          quantity,
          stockBefore: theoreticalStock,
          stockAfter: actualStock,
          adjustment: {
            reason,
            stockTheoretical: theoreticalStock,
            stockActual: actualStock,
          },
          notes,
          performedBy: userId,
        },
      ],
      { session },
    );

    // Mettre à jour le cache de stock du produit
    await Product.findByIdAndUpdate(
      productId,
      {
        $inc: {
          "stockCache.available": difference,
          "stockCache.total": difference,
        },
        "stockCache.lastUpdated": new Date(),
      },
      { session },
    );

    await session.commitTransaction();
    return movement[0];
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
```

### 5. Libération Stock Panier Expiré (Job CRON)

```javascript
import mongoose from "mongoose";
import Cart from "../models/Cart.js";
import StockMovement from "../models/StockMovement.js";
import Product from "../models/Product.js";

/**
 * Job à exécuter régulièrement pour libérer les stocks des paniers expirés
 */
export const releaseExpiredCartStock = async () => {
  const session = await mongoose.startSession();

  // Trouver les paniers expirés
  const expiredCarts = await Cart.find({
    expiresAt: { $lt: new Date() },
  });

  for (const cart of expiredCarts) {
    session.startTransaction();
    try {
      for (const item of cart.items) {
        const currentStock = await StockMovement.calculateStock(item.productId);

        // Créer un mouvement d'annulation de réservation
        await StockMovement.create(
          [
            {
              productId: item.productId,
              shopId: item.shopId,
              movementType: "RESERVATION_CANCEL",
              quantity: item.quantity,
              stockBefore: currentStock.available,
              stockAfter: currentStock.available + item.quantity,
              reservation: {
                cartId: cart._id,
              },
              reason: "Expiration du panier",
              performedBy: cart.userId,
            },
          ],
          { session },
        );

        // Mettre à jour le cache du produit
        await Product.findByIdAndUpdate(
          item.productId,
          {
            $inc: {
              "stockCache.available": item.quantity,
              "stockCache.reserved": -item.quantity,
            },
            "stockCache.lastUpdated": new Date(),
          },
          { session },
        );
      }

      // Supprimer le panier
      await Cart.findByIdAndDelete(cart._id, { session });

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      console.error(`Erreur libération panier ${cart._id}:`, error);
    }
  }

  session.endSession();
};
```

### 6. Mise à jour Statut Vente

```javascript
import StockMovement from "../models/StockMovement.js";
import Wallet from "../models/Wallet.js";
import WalletTransaction from "../models/WalletTransaction.js";

/**
 * Mettre à jour le statut d'une vente
 */
export const updateSaleStatus = async (movementId, newStatus, userId) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const movement = await StockMovement.findById(movementId).session(session);
    if (!movement || movement.movementType !== "SALE") {
      throw new Error("Vente non trouvée");
    }

    movement.sale.status = newStatus;

    // Si livré, transférer le pendingBalance vers balance du vendeur
    if (newStatus === "DELIVERED") {
      movement.sale.deliveredAt = new Date();

      const shopWallet = await Wallet.findOne({
        ownerId: movement.shopId,
        ownerModel: "Shop",
      }).session(session);

      const sellerAmount = movement.sale.sellerAmount;
      shopWallet.pendingBalance -= sellerAmount;
      shopWallet.balance += sellerAmount;
      await shopWallet.save({ session });

      await WalletTransaction.create(
        [
          {
            walletId: shopWallet._id,
            type: "SALE_REVENUE",
            amount: sellerAmount,
            balanceBefore: shopWallet.balance - sellerAmount,
            balanceAfter: shopWallet.balance,
            stockMovementId: movement._id,
            stockMovementRef: movement.reference,
            description: `Revenu vente ${movement.reference}`,
          },
        ],
        { session },
      );
    }

    await movement.save({ session });
    await session.commitTransaction();
    return movement;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
```

---

## 📈 Aggregations & Rapports Stock

### Rapport de Stock par Produit

```javascript
import StockMovement from "../models/StockMovement.js";
import mongoose from "mongoose";

/**
 * Obtenir le rapport de stock détaillé d'un produit
 */
export const getProductStockReport = async (productId, startDate, endDate) => {
  return StockMovement.aggregate([
    {
      $match: {
        productId: new mongoose.Types.ObjectId(productId),
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: "$movementType",
        totalQuantity: { $sum: "$quantity" },
        count: { $sum: 1 },
        totalValue: { $sum: "$totalAmount" },
      },
    },
    {
      $project: {
        movementType: "$_id",
        totalQuantity: 1,
        count: 1,
        totalValue: 1,
        _id: 0,
      },
    },
  ]);
};
```

### Historique des Mouvements

```javascript
/**
 * Obtenir l'historique des mouvements avec pagination
 */
export const getStockMovementHistory = async (
  shopId,
  { page = 1, limit = 20, movementType, startDate, endDate },
) => {
  const query = { shopId: new mongoose.Types.ObjectId(shopId) };

  if (movementType) {
    query.movementType = movementType;
  }
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = startDate;
    if (endDate) query.createdAt.$lte = endDate;
  }

  const [movements, total] = await Promise.all([
    StockMovement.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("productId", "title sku")
      .populate("performedBy", "profile.name"),
    StockMovement.countDocuments(query),
  ]);

  return {
    movements,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};
```

### Alertes Stock Bas

```javascript
/**
 * Obtenir les produits avec stock bas
 */
export const getLowStockProducts = async (shopId) => {
  return Product.find({
    shopId,
    status: "ACTIVE",
    $expr: {
      $lte: ["$stockCache.available", "$stockAlert.lowThreshold"],
    },
  })
    .select("title sku stockCache stockAlert")
    .sort({ "stockCache.available": 1 });
};
```

### Dashboard Vendeur - Analyse des Ventes

```javascript
import StockMovement from "../models/StockMovement.js";

/**
 * Obtenir les statistiques de vente par période
 */
export const getSellerSalesStats = async (shopId, startDate, endDate) => {
  return StockMovement.aggregate([
    {
      $match: {
        shopId: new mongoose.Types.ObjectId(shopId),
        movementType: "SALE",
        "sale.paymentStatus": "PAID",
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
        },
        totalSales: { $sum: 1 },
        totalRevenue: { $sum: "$sale.sellerAmount" },
        totalItems: { $sum: "$quantity" },
        avgOrderValue: { $avg: "$totalAmount" },
      },
    },
    { $sort: { _id: 1 } },
  ]);
};

/**
 * Top produits vendus
 */
export const getTopSellingProducts = async (shopId, limit = 10) => {
  return StockMovement.aggregate([
    {
      $match: {
        shopId: new mongoose.Types.ObjectId(shopId),
        movementType: "SALE",
        "sale.paymentStatus": "PAID",
      },
    },
    {
      $group: {
        _id: "$productId",
        productTitle: { $first: "$sale.productSnapshot.title" },
        totalQuantity: { $sum: "$quantity" },
        totalRevenue: { $sum: "$totalAmount" },
        salesCount: { $sum: 1 },
      },
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: limit },
  ]);
};

/**
 * Historique des ventes d'un acheteur
 */
export const getBuyerPurchaseHistory = async (
  buyerId,
  { page = 1, limit = 20 },
) => {
  const query = {
    movementType: "SALE",
    "sale.buyerId": new mongoose.Types.ObjectId(buyerId),
  };

  const [sales, total] = await Promise.all([
    StockMovement.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("productId", "title images")
      .populate("shopId", "name"),
    StockMovement.countDocuments(query),
  ]);

  return {
    sales,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
};

/**
 * Historique des approvisionnements
 */
export const getSupplyHistory = async (shopId, { page = 1, limit = 20 }) => {
  const query = {
    movementType: "SUPPLY",
    shopId: new mongoose.Types.ObjectId(shopId),
  };

  const [supplies, total] = await Promise.all([
    StockMovement.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("productId", "title sku")
      .populate("performedBy", "profile.name"),
    StockMovement.countDocuments(query),
  ]);

  return {
    supplies,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
};
```

---

## 🔄 Recalcul du Stock Cache (Job de maintenance)

```javascript
import Product from "../models/Product.js";
import StockMovement from "../models/StockMovement.js";

/**
 * Recalculer le cache de stock de tous les produits
 * À exécuter périodiquement pour garantir la cohérence
 */
export const recalculateAllStockCache = async () => {
  const products = await Product.find({}).select("_id");

  for (const product of products) {
    const stockData = await StockMovement.calculateStock(product._id);

    await Product.findByIdAndUpdate(product._id, {
      "stockCache.total": stockData.total,
      "stockCache.reserved": stockData.reserved,
      "stockCache.available": stockData.available,
      "stockCache.lastUpdated": new Date(),
    });
  }

  console.log(`Stock recalculé pour ${products.length} produits`);
};
```

---

## ✅ Bonnes Pratiques MongoDB

1. **Indexes**: Toujours créer des index pour les champs de recherche fréquents
2. **Snapshots**: Stocker les données critiques (prix, produit) au moment de la transaction dans StockMovement
3. **TTL**: Utiliser les TTL index pour les données temporaires (panier)
4. **Transactions**: Utiliser les transactions pour les opérations multi-documents
5. **Dénormalisation**: Le StockMovement contient toutes les infos nécessaires (pas de jointures)
6. **Virtual fields**: Utiliser pour les calculs dérivés
7. **Pagination**: Toujours paginer les listes
8. **Stock via mouvements**: Le stock est toujours calculé via les mouvements (source de vérité)
9. **Cache de stock**: Utiliser un cache dénormalisé pour les performances, recalculer périodiquement
10. **GroupId**: Utiliser le groupId pour lier les mouvements d'une même transaction

---

## 📋 Résumé des Modèles

| Modèle              | Description                         | Rôle                                                                    |
| ------------------- | ----------------------------------- | ----------------------------------------------------------------------- |
| `User`              | Utilisateurs (BUYER, SELLER, ADMIN) | Authentification & profils                                              |
| `Shop`              | Boutiques des vendeurs              | Gestion des boutiques                                                   |
| `Product`           | Produits avec cache de stock        | Catalogue produits                                                      |
| `StockMovement`     | **Mouvements de stock** ⭐          | Source de vérité pour le stock, ventes, approvisionnements, ajustements |
| `Cart`              | Paniers avec TTL                    | Paniers temporaires                                                     |
| `Wallet`            | Portefeuilles                       | Soldes financiers                                                       |
| `WalletTransaction` | Transactions wallet                 | Historique financier                                                    |

---

## 🎯 Avantages de cette Architecture Simplifiée

1. **Une seule table** pour tout tracer (StockMovement)
2. **Pas de jointures complexes** - toutes les infos sont dans le mouvement
3. **Traçabilité complète** - chaque entrée/sortie est documentée
4. **Requêtes simples** - filtrer par `movementType` pour avoir ventes, approvisionnements, etc.
5. **GroupId** pour lier plusieurs produits d'une même commande
6. **Audit facile** avec `stockBefore`/`stockAfter`
7. **Performances** grâce au cache dénormalisé dans Product

---

## ❌ À Éviter

1. Stocker des données sensibles en clair
2. Faire des requêtes sans index
3. Oublier les validations Mongoose
4. Ne pas utiliser de transactions pour les opérations critiques
5. Stocker des fichiers binaires dans MongoDB (utiliser GridFS ou un service externe)
6. **Modifier le stock directement** sans passer par StockMovement
7. Oublier de libérer les réservations des paniers expirés
