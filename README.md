# 🏪 Marketplace Centre Commercial — M1P13 MEAN

<p align="center">
  <a href="https://m1p13mean-kenny-tsito-frontend.vercel.app/" target="_blank"><img src="https://img.shields.io/badge/Frontend-Vercel-black?logo=vercel" alt="Frontend"/></a>
  <a href="https://m1p13mean-kenny-tsito.onrender.com/" target="_blank"><img src="https://img.shields.io/badge/Backend-Render-46E3B7?logo=render" alt="Backend"/></a>
  <a href="https://github.com/kenny516/m1p13mean-Kenny-Tsito/tree/main" target="_blank"><img src="https://img.shields.io/badge/GitHub-main-181717?logo=github" alt="GitHub"/></a>
  <img src="https://img.shields.io/badge/Stack-MEAN-43853D?logo=mongodb" alt="MEAN Stack"/>
</p>

---

## 📋 Informations Projet

| Élément         | Détail                                                                                            |
| --------------- | ------------------------------------------------------------------------------------------------- |
| **Nom**         | m1p13mean-Kenny-Tsito                                                                             |
| **Type**        | Application Marketplace Centre Commercial (MEAN Stack)                                            |
| **Période**     | 27 Janvier 2026 — 03 Mars 2026                                                                    |
| **Promotion**   | Master 1 — Promotion 13                                                                           |
| **Frontend**    | [https://m1p13mean-kenny-tsito-frontend.vercel.app](https://m1p13mean-kenny-tsito-frontend.vercel.app/) |
| **Backend API** | [https://m1p13mean-kenny-tsito.onrender.com](https://m1p13mean-kenny-tsito.onrender.com/)         |
| **GitHub**      | [https://github.com/kenny516/m1p13mean-Kenny-Tsito](https://github.com/kenny516/m1p13mean-Kenny-Tsito) — branche `main` |

---

## 🎯 Présentation de l'Application

Application web de marketplace pour un centre commercial (type Akoor / La City) permettant à des vendeurs de proposer leurs produits et à des acheteurs de les commander en ligne, le tout administré par un gestionnaire de plateforme.

### Trois profils utilisateurs

| Profil        | Rôle                                                               |
| ------------- | ------------------------------------------------------------------ |
| **Admin**     | Gestion globale : utilisateurs, boutiques, produits, commissions   |
| **Seller**    | Vendeur : gestion de sa boutique, produits, stock, commandes       |
| **Buyer**     | Acheteur : catalogue, panier, commandes, wallet, avis              |

---

## ✨ Fonctionnalités

### 👑 Administrateur

- 📊 Dashboard avec statistiques globales (commissions, ventes, utilisateurs)
- 👥 Gestion complète des utilisateurs (créer, activer/désactiver, valider, supprimer)
- 🏪 Validation/rejet des boutiques soumises par les vendeurs
- 📦 Modération des produits (valider/rejeter avec motif)
- 💰 Suivi des commissions par boutique et par période
- ⚙️ Paramètres de la plateforme (taux de commission global, etc.)
- 🔍 Visualisation de tous les mouvements de stock
- 🔄 Réconciliation du cache de stock d'un produit

### 🏪 Vendeur (Seller)

- 🏗️ Création et gestion de sa boutique (logo, bannière, description, catégories)
- 📦 CRUD produits avec images multiples, tags, caractéristiques personnalisées
- 📥 Approvisionnement en stock (mouvements entrants)
- 📊 Suivi des ventes et commandes
- 🔄 Mise à jour des statuts de commande (confirmé → expédié → livré)
- 💳 Wallet avec historique des transactions
- ⭐ Réponses aux avis clients
- 📈 Statistiques de vente par période

### 🛒 Acheteur (Buyer)

- 🔍 Catalogue produits avec recherche full-text et filtres (catégorie, prix, boutique)
- 🛒 Panier d'achat avec réservation de stock (TTL 30 min)
- 💳 Checkout avec paiement via wallet
- 📋 Historique des commandes avec suivi de livraison
- ✅ Confirmation de livraison et retours
- 💰 Wallet (dépôt, retrait, historique)
- ⭐ Avis et notation des produits achetés
- 🔔 Restauration de panier expiré

---

## 📸 Copies d'Écran

### 🌍 Page d'accueil

> 📷 *Ajouter ici une capture de la page d'accueil*

---

### 🛒 Acheteur

> 📷 *Ajouter ici une capture du catalogue / panier*

> 📷 *Ajouter ici une capture des commandes / wallet*

---

### 🏪 Vendeur

> 📷 *Ajouter ici une capture du dashboard / produits*

> 📷 *Ajouter ici une capture des commandes / stock*

---

### 👑 Administrateur

> 📷 *Ajouter ici une capture du dashboard admin*

> 📷 *Ajouter ici une capture de la gestion boutiques / utilisateurs*

---

## 🗄️ Structure MongoDB

L'application utilise **10 collections** :

### 1. `users` — Utilisateurs

| Champ          | Type     | Description                                                                 |
| -------------- | -------- | --------------------------------------------------------------------------- |
| `email`        | String   | Email unique (login)                                                        |
| `passwordHash` | String   | Mot de passe hashé (bcrypt) — non retourné par défaut                       |
| `role`         | Enum     | `BUYER` \| `SELLER` \| `ADMIN`                                              |
| `profile`      | Object   | `{ firstName, lastName, phone, address: { street, city, postalCode, country }, avatar: { url, fileId } }` |
| `walletId`     | ObjectId | Référence vers le wallet                                                    |
| `isValidated`  | Boolean  | Validé par l'admin                                                          |
| `isActive`     | Boolean  | Compte actif                                                                |

**Index** : `role + isActive`

---

### 2. `shops` — Boutiques

| Champ            | Type     | Description                                                        |
| ---------------- | -------- | ------------------------------------------------------------------ |
| `sellerId`       | ObjectId | Référence vers le vendeur                                           |
| `name`           | String   | Nom de la boutique                                                  |
| `description`    | String   | Description                                                         |
| `logo`           | Object   | `{ url, fileId }` — sérialisé en URL                               |
| `banner`         | Object   | `{ url, fileId }` — sérialisé en URL                               |
| `contact`        | Object   | `{ email, phone, address }`                                         |
| `categories`     | [String] | Catégories de la boutique                                           |
| `status`         | Enum     | `DRAFT` \| `PENDING` \| `ACTIVE` \| `REJECTED` \| `ARCHIVED`       |
| `rejectionReason`| String   | Motif de rejet (si `REJECTED`)                                      |
| `isActive`       | Boolean  | Synchronisé automatiquement avec `status === ACTIVE`                |
| `commissionRate` | Number   | Taux de commission (%)                                              |
| `stats`          | Object   | `{ totalSales, deliveredSalesAmount, products: { pending, active, archived }, rating }` |

**Index** : `name + description` (text), `isActive`, `categories`, `status + createdAt`, `sellerId + status`

---

### 3. `products` — Produits

| Champ             | Type     | Description                                                              |
| ----------------- | -------- | ------------------------------------------------------------------------ |
| `shopId`          | ObjectId | Boutique propriétaire                                                     |
| `sellerId`        | ObjectId | Vendeur propriétaire                                                      |
| `sku`             | String   | Code produit (unique, sparse)                                             |
| `title`           | String   | Titre du produit                                                          |
| `description`     | String   | Description détaillée                                                     |
| `category`        | String   | Catégorie                                                                 |
| `tags`            | [String] | Tags de recherche                                                         |
| `characteristics` | Map      | Caractéristiques libres (couleur, taille, etc.)                           |
| `images`          | Array    | `[{ url, fileId }]` — sérialisé en tableau de strings                    |
| `price`           | Number   | Prix de vente (MGA)                                                       |
| `originalPrice`   | Number   | Prix original (promotions)                                                |
| `stock.cache`     | Object   | `{ total, reserved, available, lastUpdated }` — cache dénormalisé        |
| `stock.alert`     | Object   | `{ lowThreshold, outOfStock }`                                            |
| `status`          | Enum     | `DRAFT` \| `PENDING` \| `ACTIVE` \| `REJECTED` \| `ARCHIVED`             |
| `rejectionReason` | String   | Motif de rejet (si `REJECTED`)                                            |
| `stats`           | Object   | `{ views, sales, deliveredSales, rating, reviewCount }`                   |

**Virtual** : `isLowStock`, `isOutOfStock`

**Index** : `title + description + tags` (text), `shopId + status`, `category + status + price`, `stock.cache.available + status`

---

### 4. `stockmovements` — En-têtes de Mouvements de Stock ⭐

Document **header** qui regroupe les lignes d'un même mouvement (`StockMovementLine`).

| Champ                  | Type       | Description                                                                                                 |
| ---------------------- | ---------- | ----------------------------------------------------------------------------------------------------------- |
| `reference`            | String     | Référence unique auto-générée (ex: `SAL-260303-ABCD12`)                                                    |
| `movementType`         | Enum       | `SUPPLY` \| `SALE` \| `RETURN_CUSTOMER` \| `RETURN_SUPPLIER` \| `ADJUSTMENT_PLUS` \| `ADJUSTMENT_MINUS` \| `RESERVATION` \| `RESERVATION_CANCEL` |
| `direction`            | Enum       | `IN` \| `OUT` — calculé automatiquement depuis le type                                                     |
| `totalAmount`          | Number     | Montant total (somme des lignes)                                                                            |
| `totalCommissionAmount`| Number     | Total des commissions                                                                                       |
| `lineIds`              | [ObjectId] | Références aux `StockMovementLine`                                                                          |
| `cartId`               | ObjectId   | Panier lié (réservation / vente)                                                                            |
| `shopId`               | ObjectId   | Boutique concernée                                                                                          |
| `sale`                 | Object     | *(si SALE)* `{ cartId, paymentTransaction, deliveryAddress, status, paymentMethod, confirmedAt, deliveredAt, returnedAt }` |
| `supply`               | Object     | *(si SUPPLY)* `{ supplier: { name, contact }, invoiceNumber, notes }`                                      |
| `adjustment`           | Object     | *(si ADJUSTMENT)* `{ reason, notes }` — reason : `INVENTORY_COUNT \| DAMAGED \| LOST \| STOLEN \| EXPIRED \| OTHER` |
| `performedBy`          | ObjectId   | Utilisateur ayant effectué le mouvement                                                                     |
| `note`                 | String     | Notes générales                                                                                             |
| `date`                 | Date       | Date métier                                                                                                 |

**Index** : `movementType + createdAt`, `performedBy + createdAt`, `shopId + createdAt`, `cartId`, `sale.cartId`, `sale.status`

---

### 5. `stockmovementlines` — Lignes de Mouvements de Stock

Détail par produit pour chaque en-tête `StockMovement`.

| Champ             | Type     | Description                                                                                                 |
| ----------------- | -------- | ----------------------------------------------------------------------------------------------------------- |
| `reference`       | String   | Référence unique auto-générée                                                                               |
| `moveId`          | ObjectId | Référence vers le `StockMovement` header                                                                    |
| `productId`       | ObjectId | Produit concerné                                                                                            |
| `shopId`          | ObjectId | Boutique concernée                                                                                          |
| `movementType`    | Enum     | Même enum que `StockMovement`                                                                               |
| `cartId`          | ObjectId | Panier lié (si réservation)                                                                                 |
| `direction`       | Enum     | `IN` \| `OUT` — calculé automatiquement                                                                     |
| `quantity`        | Number   | Quantité déplacée                                                                                           |
| `unitPrice`       | Number   | Prix unitaire                                                                                               |
| `commissionRate`  | Number   | Taux de commission (%)                                                                                      |
| `commissionAmount`| Number   | Montant de la commission                                                                                    |
| `totalAmount`     | Number   | Montant total de la ligne                                                                                   |
| `stockBefore`     | Number   | Stock disponible avant le mouvement (audit)                                                                 |
| `stockAfter`      | Number   | Stock disponible après le mouvement (audit)                                                                 |
| `performedBy`     | ObjectId | Utilisateur ayant effectué le mouvement                                                                     |
| `date`            | Date     | Date métier                                                                                                 |

**Méthode statique** : `calculateStock(productId)` — agrège IN/OUT et réservations

**Index** : `moveId + createdAt`, `productId + createdAt`, `shopId + movementType + createdAt`, `cartId`

---

### 6. `carts` — Paniers

| Champ         | Type     | Description                                                                              |
| ------------- | -------- | ---------------------------------------------------------------------------------------- |
| `userId`      | ObjectId | Acheteur propriétaire                                                                    |
| `status`      | Enum     | `CART` \| `ORDER` \| `EXPIRED` \| `RETURNED` \| `DELIVERED`                             |
| `order`       | Object   | *(si commandé)* `{ reference, paymentTransaction, paymentMethod, saleId }`              |
| `items`       | Array    | `[{ productId, shopId, productSnapshot: { title, description, images, unitPrice }, quantity, totalAmount }]` |
| `totalAmount` | Number   | Montant total du panier                                                                  |
| `expiresAt`   | Date     | Expiration (30 min par défaut après création/modif)                                      |
| `deliveredAt` | Date     | Date de confirmation de livraison                                                        |

**Index** : `userId`, `status + expiresAt + updatedAt`

---

### 7. `wallets` — Portefeuilles

| Champ           | Type     | Description                              |
| --------------- | -------- | ---------------------------------------- |
| `ownerId`       | ObjectId | Utilisateur ou Boutique propriétaire      |
| `ownerModel`    | Enum     | `User` \| `Shop`                         |
| `balance`       | Number   | Solde disponible (MGA)                   |
| `pendingBalance`| Number   | Solde en attente (ventes non livrées)    |
| `totalEarned`   | Number   | Total cumulé gagné (historique)           |
| `totalSpent`    | Number   | Total cumulé dépensé (historique)         |
| `currency`      | String   | Devise (défaut: `MGA`)                   |
| `isActive`      | Boolean  | Wallet actif                             |

**Index** : `ownerId + ownerModel` (unique)

---

### 8. `wallettransactions` — Transactions Wallet

| Champ               | Type     | Description                                                                                                            |
| ------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------- |
| `walletId`          | ObjectId | Wallet concerné                                                                                                         |
| `type`              | Enum     | `DEPOSIT` \| `WITHDRAWAL` \| `PURCHASE` \| `SALE_INCOME` \| `REFUND` \| `COMMISSION` \| `TRANSFER_IN` \| `TRANSFER_OUT` |
| `amount`            | Number   | Montant (positif ou négatif)                                                                                            |
| `balanceBefore`     | Number   | Solde avant transaction                                                                                                 |
| `balanceAfter`      | Number   | Solde après transaction                                                                                                 |
| `stockMovementId`   | ObjectId | Référence au mouvement de stock associé (ventes/achats)                                                                 |
| `relatedTransactionId` | ObjectId | Référence à une autre transaction (transferts)                                                                       |
| `status`            | Enum     | `PENDING` \| `COMPLETED` \| `FAILED` \| `CANCELLED`                                                                    |
| `paymentMethod`     | Enum     | `WALLET` \| `CARD` \| `MOBILE_MONEY` \| `BANK_TRANSFER` \| `CASH`                                                      |
| `externalReference` | String   | Référence de transaction externe                                                                                        |
| `description`       | String   | Description de la transaction                                                                                           |
| `metadata`          | Map      | Données supplémentaires libres                                                                                          |

**Index** : `walletId + createdAt`, `type + status`, `stockMovementId`

---

### 9. `reviews` — Avis Produits

| Champ             | Type     | Description                                               |
| ----------------- | -------- | --------------------------------------------------------- |
| `productId`       | ObjectId | Produit noté                                              |
| `userId`          | ObjectId | Acheteur ayant laissé l'avis                              |
| `rating`          | Number   | Note de 1 à 5                                             |
| `comment`         | String   | Commentaire (max 1000 caractères, optionnel)              |
| `sellerResponse`  | Object   | `{ comment, respondedAt }` — réponse du vendeur          |
| `isVerifiedPurchase` | Boolean | Achat vérifié                                          |
| `isVisible`       | Boolean  | Avis visible publiquement                                 |

**Méthode statique** : `calculateAverageRating(productId)`

**Index** : `productId + userId` (unique), `productId + createdAt`, `userId + createdAt`

---

### 10. `settings` — Paramètres de la Plateforme (Singleton)

| Champ                | Type     | Description                                          |
| -------------------- | -------- | ---------------------------------------------------- |
| `defaultCommissionRate` | Number | Taux de commission par défaut pour les boutiques (%) |
| `cartTTLMinutes`     | Number   | Durée de vie du panier en minutes (défaut: 30)       |
| `lowStockThreshold`  | Number   | Seuil d'alerte stock bas (défaut: 10)                |
| `outOfStockThreshold`| Number   | Seuil de rupture de stock (défaut: 0)                |
| `currency`           | String   | Devise (défaut: `MGA`)                               |
| `platformName`       | String   | Nom de la plateforme                                 |
| `maintenanceMode`    | Boolean  | Mode maintenance actif                               |
| `maintenanceMessage` | String   | Message affiché en maintenance                       |
| `contactEmail`       | String   | Email de contact                                     |
| `supportEmail`       | String   | Email du support                                     |
| `minOrderAmount`     | Number   | Montant minimum de commande                          |
| `maxOrderAmount`     | Number   | Montant maximum (0 = illimité)                       |
| `minWithdrawalAmount`| Number   | Montant minimum de retrait (défaut: 10 000 MGA)      |
| `adminGlobalWalletId`| ObjectId | Référence vers le wallet global admin                |
| `returnWindowDays`   | Number   | Délai de retour en jours (défaut: 7)                 |

**Collection cappée** (max 1 document) — méthodes statiques : `getSettings()`, `updateSettings(updates)`

---

## 🌐 Liste des URLs API

> **Base URL** :
> - Développement : `http://localhost:3000/api`
> - Production : `https://m1p13mean-kenny-tsito.onrender.com/api`

> **Légende accès** : 🌍 Public | 🔒 Auth requise | 👤 BUYER | 🏪 SELLER | 👑 ADMIN

---

### 🔐 Authentification — `/api/auth`

| Méthode  | URL                          | Description                              | Accès |
| -------- | ---------------------------- | ---------------------------------------- | ----- |
| `POST`   | `/api/auth/register`         | Inscription d'un nouvel utilisateur       | 🌍    |
| `POST`   | `/api/auth/login`            | Connexion utilisateur                     | 🌍    |
| `POST`   | `/api/auth/check-email`      | Vérifier si un email existe déjà          | 🌍    |
| `GET`    | `/api/auth/me`               | Profil de l'utilisateur connecté          | 🔒    |
| `PUT`    | `/api/auth/profile`          | Mettre à jour son profil                  | 🔒    |
| `PUT`    | `/api/auth/profile/avatar`   | Upload ou remplacer son avatar            | 🔒    |
| `DELETE` | `/api/auth/profile/avatar`   | Supprimer son avatar                      | 🔒    |
| `PUT`    | `/api/auth/password`         | Changer son mot de passe                  | 🔒    |

---

### 📦 Produits — `/api/products`

| Méthode  | URL                                     | Description                                    | Accès         |
| -------- | --------------------------------------- | ---------------------------------------------- | ------------- |
| `GET`    | `/api/products`                         | Lister les produits actifs (recherche, filtres) | 🌍            |
| `GET`    | `/api/products/:id`                     | Détails d'un produit                            | 🌍            |
| `GET`    | `/api/products/my-products`             | Produits du vendeur connecté                    | 🏪            |
| `POST`   | `/api/products`                         | Créer un produit                                | 🏪            |
| `PUT`    | `/api/products/:id`                     | Modifier un produit                             | 🏪 👑         |
| `DELETE` | `/api/products/:id`                     | Supprimer un produit                            | 🏪 👑         |
| `POST`   | `/api/products/:id/images`              | Ajouter des images à un produit                 | 🏪 👑         |
| `DELETE` | `/api/products/:id/image/:index`        | Supprimer une image par index                   | 🏪 👑         |
| `GET`    | `/api/products/:productId/reviews`      | Avis d'un produit                               | 🌍            |
| `GET`    | `/api/products/:productId/reviews/stats`| Statistiques de rating d'un produit             | 🌍            |
| `POST`   | `/api/products/:productId/reviews`      | Créer un avis pour un produit acheté            | 👤            |

---

### 🏪 Boutiques — `/api/shops`

| Méthode  | URL                       | Description                                   | Accès  |
| -------- | ------------------------- | --------------------------------------------- | ------ |
| `GET`    | `/api/shops`              | Lister les boutiques actives                  | 🌍     |
| `GET`    | `/api/shops/:id`          | Détails d'une boutique                        | 🌍     |
| `GET`    | `/api/shops/my-shops`     | Mes boutiques (tous statuts)                  | 🏪     |
| `POST`   | `/api/shops`              | Créer une boutique (statut DRAFT)             | 🏪     |
| `PUT`    | `/api/shops/:id`          | Modifier sa boutique                          | 🏪 👑  |
| `DELETE` | `/api/shops/:id`          | Supprimer une boutique                        | 🏪 👑  |
| `PUT`    | `/api/shops/:id/logo`     | Upload/remplacer le logo                      | 🏪 👑  |
| `DELETE` | `/api/shops/:id/logo`     | Supprimer le logo                             | 🏪 👑  |
| `PUT`    | `/api/shops/:id/banner`   | Upload/remplacer la bannière                  | 🏪 👑  |
| `DELETE` | `/api/shops/:id/banner`   | Supprimer la bannière                         | 🏪 👑  |
| `PATCH`  | `/api/shops/:id/submit`   | Soumettre pour validation (DRAFT → PENDING)   | 🏪     |
| `PATCH`  | `/api/shops/:id/archive`  | Archiver une boutique                         | 🏪 👑  |
| `PATCH`  | `/api/shops/:id/activate` | Réactiver une boutique                        | 🏪 👑  |

---

### 🛒 Panier & Commandes — `/api/cart`

| Méthode  | URL                                  | Description                                      | Accès |
| -------- | ------------------------------------ | ------------------------------------------------ | ----- |
| `GET`    | `/api/cart`                          | Récupérer son panier actif                        | 👤    |
| `GET`    | `/api/cart/expired`                  | Lister ses paniers expirés                        | 👤    |
| `POST`   | `/api/cart/items`                    | Ajouter un produit au panier                      | 👤    |
| `PUT`    | `/api/cart/items/:productId`         | Modifier la quantité d'un article                 | 👤    |
| `DELETE` | `/api/cart/items/:productId`         | Retirer un produit du panier                      | 👤    |
| `DELETE` | `/api/cart`                          | Vider le panier                                   | 👤    |
| `POST`   | `/api/cart/restore`                  | Restaurer le dernier panier expiré                | 👤    |
| `POST`   | `/api/cart/restore/:cartId`          | Restaurer un panier expiré spécifique             | 👤    |
| `POST`   | `/api/cart/checkout`                 | Valider le panier (créer les ventes)              | 👤    |
| `GET`    | `/api/cart/orders`                   | Historique des commandes                          | 👤    |
| `GET`    | `/api/cart/orders/:orderId`          | Détails d'une commande                            | 👤    |
| `POST`   | `/api/cart/:cartId/confirm-delivery` | Confirmer la réception d'une commande             | 👤    |
| `POST`   | `/api/cart/orders/:orderId/return`   | Retourner une commande livrée                     | 👤    |

---

### 📊 Mouvements de Stock — `/api/stock-movements`

| Méthode  | URL                                              | Description                                   | Accès  |
| -------- | ------------------------------------------------ | --------------------------------------------- | ------ |
| `GET`    | `/api/stock-movements`                           | Lister les mouvements de ses boutiques        | 🏪     |
| `GET`    | `/api/stock-movements/:id`                       | Détails d'un mouvement                        | 🏪 👑  |
| `POST`   | `/api/stock-movements`                           | Créer un mouvement (ex: approvisionnement)    | 🏪     |
| `GET`    | `/api/stock-movements/lines`                     | Lister les lignes de mouvement                | 🏪 👑  |
| `GET`    | `/api/stock-movements/sales`                     | Lister les ventes                             | 🏪 👑  |
| `GET`    | `/api/stock-movements/orders`                    | Lister les commandes vendeur                  | 🏪     |
| `GET`    | `/api/stock-movements/supplies`                  | Lister les approvisionnements                 | 🏪 👑  |
| `GET`    | `/api/stock-movements/product/:productId/stock`  | Stock calculé en temps réel d'un produit      | 🏪 👑  |
| `PATCH`  | `/api/stock-movements/:id/sale-status`           | Mettre à jour le statut d'une vente           | 🏪 👑  |

---

### 💰 Wallets — `/api/wallets`

| Méthode | URL                         | Description                          | Accès |
| ------- | --------------------------- | ------------------------------------ | ----- |
| `GET`   | `/api/wallets`              | Récupérer son wallet                 | 🔒    |
| `GET`   | `/api/wallets/transactions` | Historique des transactions          | 🔒    |
| `POST`  | `/api/wallets/deposit`      | Effectuer un dépôt                   | 🔒    |
| `POST`  | `/api/wallets/withdraw`     | Effectuer un retrait                 | 🔒    |

---

### ⭐ Avis — `/api/reviews`

| Méthode  | URL                                | Description                        | Accès  |
| -------- | ---------------------------------- | ---------------------------------- | ------ |
| `PUT`    | `/api/reviews/:reviewId`           | Modifier son avis                  | 👤     |
| `DELETE` | `/api/reviews/:reviewId`           | Supprimer son avis                 | 👤 👑  |
| `POST`   | `/api/reviews/:reviewId/response`  | Répondre à un avis (vendeur)       | 🏪     |

---

### 👑 Administration — `/api/admin`

#### Utilisateurs

| Méthode  | URL                                    | Description                          | Accès |
| -------- | -------------------------------------- | ------------------------------------ | ----- |
| `GET`    | `/api/admin/users`                     | Liste des utilisateurs               | 👑    |
| `GET`    | `/api/admin/users/stats`               | Statistiques des utilisateurs        | 👑    |
| `GET`    | `/api/admin/users/:id`                 | Détails d'un utilisateur             | 👑    |
| `POST`   | `/api/admin/users`                     | Créer un utilisateur                 | 👑    |
| `PUT`    | `/api/admin/users/:id`                 | Modifier un utilisateur              | 👑    |
| `PUT`    | `/api/admin/users/:id/password`        | Réinitialiser le mot de passe        | 👑    |
| `PATCH`  | `/api/admin/users/:id/activate`        | Activer un utilisateur               | 👑    |
| `PATCH`  | `/api/admin/users/:id/deactivate`      | Désactiver un utilisateur            | 👑    |
| `PATCH`  | `/api/admin/users/:id/validate`        | Valider un utilisateur               | 👑    |
| `DELETE` | `/api/admin/users/:id`                 | Supprimer un utilisateur             | 👑    |

#### Boutiques

| Méthode | URL                              | Description                          | Accès |
| ------- | -------------------------------- | ------------------------------------ | ----- |
| `GET`   | `/api/admin/shops`               | Toutes les boutiques                 | 👑    |
| `GET`   | `/api/admin/shops/pending`       | Boutiques en attente de validation   | 👑    |
| `PUT`   | `/api/admin/shops/:id/validate`  | Valider/rejeter une boutique         | 👑    |
| `PUT`   | `/api/admin/shops/:id`           | Modifier les paramètres admin        | 👑    |

#### Produits

| Méthode | URL                                | Description                         | Accès |
| ------- | ---------------------------------- | ----------------------------------- | ----- |
| `GET`   | `/api/admin/products`              | Tous les produits (tous statuts)    | 👑    |
| `PUT`   | `/api/admin/products/:id/validate` | Valider/rejeter un produit          | 👑    |

#### Mouvements de Stock

| Méthode | URL                                          | Description                              | Accès |
| ------- | -------------------------------------------- | ---------------------------------------- | ----- |
| `GET`   | `/api/admin/stock-movements`                 | Tous les mouvements de stock             | 👑    |
| `GET`   | `/api/admin/stock-movements/lines`           | Toutes les lignes de mouvement           | 👑    |
| `POST`  | `/api/admin/stock-movements/reconcile/:productId` | Réconcilier le cache stock d'un produit | 👑    |

#### Commissions & Statistiques

| Méthode | URL                                    | Description                               | Accès |
| ------- | -------------------------------------- | ----------------------------------------- | ----- |
| `GET`   | `/api/admin/stats/commissions`         | Statistiques des commissions par boutique | 👑    |
| `GET`   | `/api/admin/stats/commissions/chart`   | Commissions par période (chart)           | 👑    |

#### Paramètres

| Méthode | URL                    | Description                             | Accès |
| ------- | ---------------------- | --------------------------------------- | ----- |
| `GET`   | `/api/admin/settings`  | Récupérer les paramètres de la plateforme | 👑  |
| `PUT`   | `/api/admin/settings`  | Mettre à jour les paramètres             | 👑  |

---

## 🛠️ Stack Technique

| Composant           | Technologie                                  |
| ------------------- | -------------------------------------------- |
| **Base de données** | MongoDB Atlas                                |
| **Backend**         | Node.js + Express.js 5 (JavaScript ES Modules)|
| **Frontend**        | Angular 19 + ZardUI + Tailwind CSS           |
| **Auth**            | JWT (JSON Web Tokens) + bcryptjs             |
| **Validation**      | Joi                                          |
| **Upload**          | Multer                                       |
| **Déploiement FE**  | Vercel                                       |
| **Déploiement BE**  | Render                                       |

---

## 📁 Structure du Projet

```
m1p13mean-Kenny-Tsito/
├── back-end/                   # API Express.js
│   ├── src/
│   │   ├── config/             # Connexion DB, variables d'env
│   │   ├── controllers/        # Logique métier
│   │   ├── middlewares/        # Auth, validation, upload, erreurs
│   │   ├── models/             # Modèles Mongoose (7 collections)
│   │   ├── routes/             # Définition des routes REST
│   │   ├── services/           # Services métier
│   │   ├── utils/              # Utilitaires (réponse API, etc.)
│   │   ├── validations/        # Schémas Joi
│   │   ├── jobs/               # Jobs cron (ex: expiration paniers)
│   │   └── seeds/              # Données de test
│   ├── server.js
│   └── package.json
│
├── front-end/                  # Application Angular 19
│   └── src/
│       └── app/
│           ├── core/           # Services singleton, guards, interceptors
│           ├── shared/         # Composants, pipes, directives réutilisables
│           └── features/
│               ├── auth/       # Login, Register
│               ├── home/       # Page d'accueil publique
│               ├── buyer/      # Espace acheteur (produits, panier, commandes, wallet)
│               ├── seller/     # Espace vendeur (boutique, produits, stock, commandes)
│               ├── admin/      # Espace admin (users, shops, products, stats, settings)
│               └── profile/    # Profil utilisateur
│
└── .github/
    └── instructions/           # Instructions Copilot
```

---

## 🚀 Installation Locale

### Prérequis

- Node.js 18+
- MongoDB (local ou Atlas)
- Angular CLI 19 (`npm install -g @angular/cli`)

### Backend

```bash
cd back-end
npm install
cp .env.example .env  # Puis renseigner les variables
npm run dev           # Démarre sur http://localhost:3000
```

### Frontend

```bash
cd front-end
npm install
ng serve              # Démarre sur http://localhost:4200
```

---

## 🔧 Variables d'Environnement

Créer `back-end/.env` à partir de `back-end/.env.example` :

```env
PORT=3000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/marketplace
JWT_SECRET=votre_secret_jwt_super_long_et_complexe
JWT_EXPIRE=7d
```

---

## 🌐 Déploiement

| Service         | Plateforme    | URL                                                                                     |
| --------------- | ------------- | --------------------------------------------------------------------------------------- |
| **Frontend**    | Vercel        | https://m1p13mean-kenny-tsito-frontend.vercel.app                                       |
| **Backend API** | Render        | https://m1p13mean-kenny-tsito.onrender.com                                              |
| **Base de données** | MongoDB Atlas | Cloud (URI dans les variables d'environnement)                                      |

---

## 👥 Membres de l'Équipe

| Nom complet                           | Rôle                   | GitHub                                                         |
| ------------------------------------- | ---------------------- | -------------------------------------------------------------- |
| **ANDRIANTSIRAFY CHAN Kenny**         | Développeur Full Stack | [@kenny516](https://github.com/kenny516)                       |
| **RAZAFINDRAKOTO Tsito Ny avo**       | Développeur Full Stack | —                                                              |

---

## 🔗 Liens

- 🌐 **Application** : [https://m1p13mean-kenny-tsito-frontend.vercel.app](https://m1p13mean-kenny-tsito-frontend.vercel.app/)
- ⚙️ **API** : [https://m1p13mean-kenny-tsito.onrender.com](https://m1p13mean-kenny-tsito.onrender.com/)
- 📂 **GitHub** (branche `main`) : [https://github.com/kenny516/m1p13mean-Kenny-Tsito/tree/main](https://github.com/kenny516/m1p13mean-Kenny-Tsito/tree/main)

---

<p align="center">
  <strong>© 2026 — Marketplace Centre Commercial</strong><br>
  Développé par <strong>ANDRIANTSIRAFY CHAN Kenny</strong> & <strong>RAZAFINDRAKOTO Tsito Ny avo</strong><br>
  Master 1 — Promotion 13
</p>
