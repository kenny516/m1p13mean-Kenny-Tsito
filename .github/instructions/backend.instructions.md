---
description: Règles et conventions pour le développement du backend Express.js
applyTo: back-end/**
---

# Backend Instructions - Express.js API

## ⚠️ RÈGLE CRITIQUE

**Ce backend utilise JavaScript avec ES Modules**

- ❌ JAMAIS de TypeScript
- ❌ JAMAIS de CommonJS (`require`/`module.exports`)
- ✅ TOUJOURS ES Modules (`import`/`export`)
- ✅ `"type": "module"` dans package.json

---

## 📁 Structure des Fichiers

### Modèle Mongoose (`models/*.js`)

```javascript
import mongoose from "mongoose";

const exampleSchema = new mongoose.Schema(
  {
    // Champs avec types et validations
    name: {
      type: String,
      required: [true, "Le nom est requis"],
      trim: true,
    },
    // Références à d'autres collections
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Enum pour les statuts
    status: {
      type: String,
      enum: ["PENDING", "ACTIVE", "REJECTED"],
      default: "PENDING",
    },
  },
  {
    timestamps: true, // createdAt, updatedAt automatiques
  },
);

// Index pour optimiser les recherches
exampleSchema.index({ name: "text" });
exampleSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model("Example", exampleSchema);
```

### Contrôleur (`controllers/*.controller.js`)

```javascript
import Model from "../models/Model.js"

// Créer un élément
export const create = async (req, res, next) => {
  try {
    const item = await Model.create(req.body)
    res.status(201).json({
      success: true,
      data: item,
      message: "Élément créé avec succès",
    })
  } catch (error) {
    next(error)
  }
}

// Lister avec pagination
export const list = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const [items, total] = await Promise.all([
      Model.find().skip(skip).limit(limit),
      Model.countDocuments(),
    ])

    res.json({
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    next(error)
  }
}
  }
};
```

### Routes (`routes/*.routes.js`)

```javascript
import { Router } from "express";
import * as controller from "../controllers/example.controller.js";
import { auth, authorize } from "../middlewares/auth.middleware.js";

const router = Router();

// Routes publiques
router.get("/", controller.list);
router.get("/:id", controller.getOne);

// Routes protégées
router.post("/", auth, controller.create);
router.put("/:id", auth, controller.update);
router.delete("/:id", auth, authorize("ADMIN"), controller.delete);

export default router;
```

---

## 🔐 Middleware d'Authentification

```javascript
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        error: { code: "NO_TOKEN", message: "Token requis" },
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: "USER_NOT_FOUND", message: "Utilisateur non trouvé" },
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: { code: "INVALID_TOKEN", message: "Token invalide" },
    });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "Accès non autorisé" },
      });
    }
    next();
  };
};
```

---

## 🗄️ Modèles de Données Principaux

### User (Utilisateur)

- `role`: BUYER | SELLER | ADMIN
- `email`: unique, validé
- `passwordHash`: bcrypt
- `profile`: { name, phone, address }
- `walletId`: référence Wallet
- `isValidated`: boolean

### Shop (Boutique)

- `sellerId`: référence User
- `name`: nom de la boutique
- `description`: description
- `logo`: URL image
- `isActive`: boolean
- `commissionRate`: taux de commission

### Product (Produit)

- `shopId`: référence Shop
- `sellerId`: référence User
- `title`, `description`, `price`
- `stock`, `reservedStock`
- `tags`: [String]
- `characteristics`: Object flexible
- `status`: PENDING | ACTIVE | REJECTED

### Cart (Panier)

- `userId`: référence User
- `items`: [{ productId, priceSnapshot, quantity }]
- `expiresAt`: Date avec TTL index

### Order (Commande)

- `buyerId`: référence User
- `items`: snapshot complet des produits
- `totalAmount`: montant total
- `status`: PENDING | PAID | SHIPPED | DELIVERED | CANCELLED

### Wallet (Portefeuille)

- `ownerId`: référence User ou Shop
- `ownerType`: USER | SHOP
- `balance`: Number

---

## 💰 Transaction d'Achat (Exemple)

```javascript
import mongoose from "mongoose";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Wallet from "../models/Wallet.js";

export const processOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { cartId } = req.body;
    const cart = await Cart.findById(cartId).session(session);

    // 1. Vérifier le stock
    for (const item of cart.items) {
      const product = await Product.findById(item.productId).session(session);
      if (product.stock < item.quantity) {
        throw new Error(`Stock insuffisant pour ${product.title}`);
      }
    }

    // 2. Déduire du wallet acheteur
    const buyerWallet = await Wallet.findOne({ ownerId: req.user._id }).session(
      session,
    );
    const total = cart.items.reduce(
      (sum, item) => sum + item.priceSnapshot * item.quantity,
      0,
    );

    if (buyerWallet.balance < total) {
      throw new Error("Solde insuffisant");
    }

    buyerWallet.balance -= total;
    await buyerWallet.save({ session });

    // 3. Créer la commande
    const order = await Order.create(
      [
        {
          buyerId: req.user._id,
          items: cart.items,
          totalAmount: total,
          status: "PAID",
        },
      ],
      { session },
    );

    // 4. Mettre à jour le stock
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: -item.quantity, reservedStock: -item.quantity } },
        { session },
      );
    }

    // 5. Supprimer le panier
    await Cart.findByIdAndDelete(cartId, { session });

    await session.commitTransaction();

    res.status(201).json({
      success: true,
      data: order[0],
      message: "Commande créée avec succès",
    });
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};
```

---

## 📦 Dépendances Recommandées

```json
{
  "type": "module",
  "dependencies": {
    "express": "^5.2.1",
    "mongoose": "^8.x",
    "dotenv": "^16.x",
    "cors": "^2.x",
    "morgan": "^1.x",
    "jsonwebtoken": "^9.x",
    "bcryptjs": "^2.x",
    "joi": "^17.x",
    "multer": "^1.x"
  },
  "devDependencies": {
    "nodemon": "^3.x"
  }
}
```

---

## 🔧 Variables d'Environnement (.env)

```env
PORT=3000
MONGO_URI=mongodb+srv://...
JWT_SECRET=votre_secret_jwt_super_secure
JWT_EXPIRE=7d
NODE_ENV=development
```

---

## ❌ À ÉVITER

1. **Pas de TypeScript** dans le backend
2. **Pas de `async/await` sans try/catch**
3. **Pas de données sensibles en clair** (mots de passe, tokens)
4. **Pas de requêtes sans validation**
5. **Pas de listes sans pagination**
6. **Pas d'opérations critiques sans transaction**

---

## ✅ BONNES PRATIQUES

1. Toujours valider les entrées avec Joi
2. Utiliser les index MongoDB appropriés
3. Implémenter la pagination partout
4. Gérer les erreurs de manière centralisée
5. Logger les requêtes avec morgan
6. Snapshot les prix dans les commandes
7. Utiliser les transactions pour l'intégrité des données
