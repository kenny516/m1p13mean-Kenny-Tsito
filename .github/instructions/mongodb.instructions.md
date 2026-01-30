---
description: Règles et bonnes pratiques pour MongoDB et Mongoose
applyTo: back-end/src/models/**
---

# MongoDB & Mongoose Instructions

## 🎯 Principes NoSQL pour ce Projet

Ce projet utilise MongoDB avec Mongoose. Les règles suivantes doivent être respectées pour garantir performance et intégrité des données.

---

## 📊 Schémas de Données

> **Note**: Tous les modèles utilisent ES Modules (`import`/`export`)

### User (Utilisateur)

```javascript
import mongoose from 'mongoose'

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
userSchema.index({ email: 1 })
userSchema.index({ role: 1, isActive: 1 })

export default mongoose.model('User', userSchema)
```

### Shop (Boutique)

```javascript
import mongoose from 'mongoose'

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

shopSchema.index({ name: "text", description: "text" })
shopSchema.index({ isActive: 1 })
shopSchema.index({ categories: 1 })

export default mongoose.model('Shop', shopSchema)
```

### Product (Produit)

```javascript
import mongoose from 'mongoose'

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
    stock: {
      type: Number,
      required: true,
      min: 0,
    },
    reservedStock: {
      type: Number,
      default: 0,
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

// Virtual pour le stock disponible
productSchema.virtual("availableStock").get(function () {
  return this.stock - this.reservedStock
})

export default mongoose.model('Product', productSchema)
```

### Cart (Panier avec TTL)

```javascript
import mongoose from 'mongoose'

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
    priceSnapshot: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false },
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
)

cartSchema.index({ userId: 1 })

export default mongoose.model('Cart', cartSchema)
```

### Order (Commande avec snapshot)

```javascript
import mongoose from 'mongoose'

const orderItemSchema = new mongoose.Schema(
  {
    productId: mongoose.Schema.Types.ObjectId,
    shopId: mongoose.Schema.Types.ObjectId,
    // SNAPSHOT complet du produit au moment de l'achat
    productSnapshot: {
      title: String,
      description: String,
      price: Number,
      image: String,
      shopName: String,
    },
    quantity: Number,
    unitPrice: Number,
    totalPrice: Number,
  },
  { _id: false },
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      required: true,
    },
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [orderItemSchema],
    subtotal: Number,
    fees: {
      commission: Number,
      delivery: Number,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: [
        "PENDING",
        "CONFIRMED",
        "PROCESSING",
        "SHIPPED",
        "DELIVERED",
        "CANCELLED",
        "REFUNDED",
      ],
      default: "PENDING",
    },
    paymentStatus: {
      type: String,
      enum: ["PENDING", "PAID", "FAILED", "REFUNDED"],
      default: "PENDING",
    },
    deliveryAddress: {
      street: String,
      city: String,
      postalCode: String,
      country: String,
      phone: String,
    },
    statusHistory: [
      {
        status: String,
        changedAt: { type: Date, default: Date.now },
        changedBy: mongoose.Schema.Types.ObjectId,
        note: String,
      },
    ],
    notes: String,
  },
  { timestamps: true },
);

orderSchema.index({ buyerId: 1, createdAt: -1 });
orderSchema.index({ "items.shopId": 1, status: 1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1, createdAt: -1 });

// Génération numéro de commande
orderSchema.pre("validate", async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model("Order").countDocuments()
    this.orderNumber = `ORD-${Date.now()}-${String(count + 1).padStart(5, "0")}`
  }
  next()
})

export default mongoose.model('Order', orderSchema)
```

### Wallet (Portefeuille)

```javascript
import mongoose from 'mongoose'

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

walletSchema.index({ ownerId: 1, ownerModel: 1 }, { unique: true })

export default mongoose.model('Wallet', walletSchema)
```

### WalletTransaction

```javascript
import mongoose from 'mongoose'

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
        "DEPOSIT",
        "WITHDRAWAL",
        "PAYMENT",
        "REFUND",
        "COMMISSION",
        "TRANSFER",
      ],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    balanceBefore: Number,
    balanceAfter: Number,
    reference: {
      type: String, // orderId, etc.
    },
    referenceModel: {
      type: String,
      enum: ["Order", "Refund", null],
    },
    description: String,
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED", "CANCELLED"],
      default: "COMPLETED",
    },
  },
  { timestamps: true },
);

walletTransactionSchema.index({ walletId: 1, createdAt: -1 })
walletTransactionSchema.index({ type: 1, status: 1 })

export default mongoose.model('WalletTransaction', walletTransactionSchema)
```

---

## 🔄 Transactions MongoDB

### Achat complet avec transaction

```javascript
import mongoose from 'mongoose'
import Cart from '../models/Cart.js'
import Product from '../models/Product.js'
import Order from '../models/Order.js'
import Wallet from '../models/Wallet.js'
import WalletTransaction from '../models/WalletTransaction.js'

export const processOrder = async (userId, cartId) => {
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    // 1. Récupérer le panier
    const cart = await Cart.findById(cartId)
      .populate("items.productId")
      .session(session);

    if (!cart || cart.items.length === 0) {
      throw new Error("Panier vide ou inexistant");
    }

    // 2. Vérifier le stock pour chaque produit
    for (const item of cart.items) {
      const product = await Product.findById(item.productId).session(session);
      if (product.availableStock < item.quantity) {
        throw new Error(`Stock insuffisant pour ${product.title}`);
      }
    }

    // 3. Calculer le total
    let subtotal = 0;
    const orderItems = cart.items.map((item) => {
      const itemTotal = item.priceSnapshot * item.quantity;
      subtotal += itemTotal;
      return {
        productId: item.productId._id,
        shopId: item.shopId,
        productSnapshot: {
          title: item.productId.title,
          description: item.productId.description,
          price: item.priceSnapshot,
          image: item.productId.images?.[0],
        },
        quantity: item.quantity,
        unitPrice: item.priceSnapshot,
        totalPrice: itemTotal,
      };
    });

    const commission = subtotal * 0.1; // 10%
    const totalAmount = subtotal + commission;

    // 4. Vérifier le solde wallet
    const buyerWallet = await Wallet.findOne({
      ownerId: userId,
      ownerModel: "User",
    }).session(session);

    if (buyerWallet.balance < totalAmount) {
      throw new Error("Solde insuffisant");
    }

    // 5. Débiter le wallet acheteur
    buyerWallet.balance -= totalAmount;
    await buyerWallet.save({ session });

    // 6. Créer la transaction wallet
    await WalletTransaction.create(
      [
        {
          walletId: buyerWallet._id,
          type: "PAYMENT",
          amount: -totalAmount,
          balanceBefore: buyerWallet.balance + totalAmount,
          balanceAfter: buyerWallet.balance,
          description: "Paiement commande",
        },
      ],
      { session },
    );

    // 7. Créer la commande
    const order = await Order.create(
      [
        {
          buyerId: userId,
          items: orderItems,
          subtotal,
          fees: { commission, delivery: 0 },
          totalAmount,
          status: "CONFIRMED",
          paymentStatus: "PAID",
        },
      ],
      { session },
    );

    // 8. Mettre à jour les stocks
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(
        item.productId._id,
        {
          $inc: {
            stock: -item.quantity,
            reservedStock: -item.quantity,
            "stats.sales": item.quantity,
          },
        },
        { session },
      );
    }

    // 9. Créditer les wallets vendeurs (en pending)
    const shopPayments = {};
    for (const item of cart.items) {
      const shopId = item.shopId.toString();
      const amount = item.priceSnapshot * item.quantity * 0.9; // -10% commission
      shopPayments[shopId] = (shopPayments[shopId] || 0) + amount;
    }

    for (const [shopId, amount] of Object.entries(shopPayments)) {
      await Wallet.findOneAndUpdate(
        { ownerId: shopId, ownerModel: "Shop" },
        { $inc: { pendingBalance: amount } },
        { session },
      );
    }

    // 10. Supprimer le panier
    await Cart.findByIdAndDelete(cartId, { session });

    await session.commitTransaction();
    return order[0];
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};
```

---

## 📈 Aggregations Utiles

### Dashboard Admin - Stats globales

```javascript
import Order from '../models/Order.js'
import User from '../models/User.js'
import Product from '../models/Product.js'

export const getAdminDashboard = async () => {
  const [orderStats, userStats, productStats] = await Promise.all([
    Order.aggregate([
      { $match: { paymentStatus: "PAID" } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" },
          avgOrderValue: { $avg: "$totalAmount" },
        },
      },
    ]),
    User.aggregate([
      {
        $group: {
          _id: "$role",
          count: { $sum: 1 },
        },
      },
    ]),
    Product.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]),
  ]);

  return { orderStats, userStats, productStats };
};
```

### Dashboard Seller - Ventes par période

```javascript
import mongoose from 'mongoose'
import Order from '../models/Order.js'

export const getSellerSales = async (sellerId, startDate, endDate) => {
  return Order.aggregate([
    {
      $match: {
        "items.shopId": new mongoose.Types.ObjectId(sellerId),
        paymentStatus: "PAID",
        createdAt: { $gte: startDate, $lte: endDate },
      },
    },
    { $unwind: "$items" },
    {
      $match: {
        "items.shopId": new mongoose.Types.ObjectId(sellerId),
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
        },
        sales: { $sum: "$items.totalPrice" },
        orders: { $sum: 1 },
        items: { $sum: "$items.quantity" },
      },
    },
    { $sort: { _id: 1 } },
  ]);
};
```

---

## ✅ Bonnes Pratiques MongoDB

1. **Indexes**: Toujours créer des index pour les champs de recherche fréquents
2. **Snapshots**: Stocker les données critiques (prix) au moment de la transaction
3. **TTL**: Utiliser les TTL index pour les données temporaires (panier)
4. **Transactions**: Utiliser les transactions pour les opérations multi-documents
5. **Dénormalisation**: Acceptable pour éviter les jointures coûteuses
6. **Virtual fields**: Utiliser pour les calculs dérivés
7. **Pagination**: Toujours paginer les listes

---

## ❌ À Éviter

1. Stocker des données sensibles en clair
2. Faire des requêtes sans index
3. Oublier les validations Mongoose
4. Ne pas utiliser de transactions pour les opérations critiques
5. Stocker des fichiers binaires dans MongoDB (utiliser GridFS ou un service externe)
