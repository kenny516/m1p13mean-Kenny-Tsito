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

### Page d'accueil / Catalogue

<!-- SCREENSHOT: Page d'accueil avec liste des produits, recherche et filtres -->
> 📷 *Ajouter ici une capture de la page d'accueil*

---

### Interface Acheteur

<!-- SCREENSHOT: Panier d'achat avec produits et total -->
> 📷 *Ajouter ici une capture du panier d'achat*

<!-- SCREENSHOT: Page de détail d'un produit avec avis -->
> 📷 *Ajouter ici une capture de la fiche produit*

<!-- SCREENSHOT: Historique des commandes acheteur -->
> 📷 *Ajouter ici une capture des commandes acheteur*

<!-- SCREENSHOT: Wallet acheteur avec dépôt et historique -->
> 📷 *Ajouter ici une capture du wallet acheteur*

---

### Interface Vendeur

<!-- SCREENSHOT: Dashboard vendeur avec statistiques -->
> 📷 *Ajouter ici une capture du dashboard vendeur*

<!-- SCREENSHOT: Liste des produits vendeur avec stock -->
> 📷 *Ajouter ici une capture de la gestion produits*

<!-- SCREENSHOT: Gestion des commandes et statuts -->
> 📷 *Ajouter ici une capture de la gestion commandes vendeur*

<!-- SCREENSHOT: Mouvements de stock (approvisionnement) -->
> 📷 *Ajouter ici une capture des mouvements de stock*

---

### Interface Administrateur

<!-- SCREENSHOT: Dashboard admin avec KPIs et commissions -->
> 📷 *Ajouter ici une capture du dashboard admin*

<!-- SCREENSHOT: Liste des boutiques avec modération -->
> 📷 *Ajouter ici une capture de la gestion boutiques admin*

<!-- SCREENSHOT: Liste des utilisateurs avec actions -->
> 📷 *Ajouter ici une capture de la gestion utilisateurs admin*

<!-- SCREENSHOT: Paramètres de la plateforme -->
> 📷 *Ajouter ici une capture des paramètres admin*

---

## 🗄️ Structure MongoDB

L'application utilise **7 collections** principales :

### 1. `users` — Utilisateurs

| Champ           | Type       | Description                          |
| --------------- | ---------- | ------------------------------------ |
| `email`         | String     | Email unique (login)                 |
| `passwordHash`  | String     | Mot de passe hashé (bcrypt)          |
| `role`          | Enum       | `BUYER` \| `SELLER` \| `ADMIN`       |
| `profile`       | Object     | `{ name, phone, address, avatar }`   |
| `walletId`      | ObjectId   | Référence vers le wallet             |
| `isValidated`   | Boolean    | Validé par l'admin                   |
| `isActive`      | Boolean    | Compte actif                         |
| `createdAt`     | Date       | Date de création (auto)              |

**Index** : `email`, `role + isActive`

---

### 2. `shops` — Boutiques

| Champ            | Type     | Description                                     |
| ---------------- | -------- | ----------------------------------------------- |
| `sellerId`       | ObjectId | Référence vers le vendeur                        |
| `name`           | String   | Nom de la boutique                               |
| `description`    | String   | Description                                      |
| `logo`           | String   | URL du logo                                      |
| `banner`         | String   | URL de la bannière                               |
| `contact`        | Object   | `{ email, phone, address }`                      |
| `categories`     | [String] | Catégories de la boutique                        |
| `status`         | Enum     | `DRAFT` \| `PENDING` \| `ACTIVE` \| `REJECTED`  |
| `isActive`       | Boolean  | Boutique accessible publiquement                 |
| `commissionRate` | Number   | Taux de commission (%)                           |
| `stats`          | Object   | `{ totalProducts, totalSales, totalRevenue }`    |

**Index** : `name + description` (text), `isActive`, `categories`

---

### 3. `products` — Produits

| Champ              | Type       | Description                                             |
| ------------------ | ---------- | ------------------------------------------------------- |
| `shopId`           | ObjectId   | Boutique propriétaire                                    |
| `sellerId`         | ObjectId   | Vendeur propriétaire                                     |
| `sku`              | String     | Code produit (unique)                                    |
| `title`            | String     | Titre du produit                                         |
| `description`      | String     | Description détaillée                                    |
| `price`            | Number     | Prix de vente (MGA)                                      |
| `originalPrice`    | Number     | Prix original (promotions)                               |
| `stockCache`       | Object     | `{ available, reserved, total, lastUpdated }`            |
| `stockAlert`       | Object     | `{ lowThreshold, outOfStock }`                           |
| `images`           | [String]   | URLs des images                                          |
| `category`         | String     | Catégorie                                                |
| `tags`             | [String]   | Tags de recherche                                        |
| `characteristics`  | Map        | Caractéristiques libres (couleur, taille, etc.)          |
| `status`           | Enum       | `DRAFT` \| `PENDING` \| `ACTIVE` \| `REJECTED` \| `OUT_OF_STOCK` |
| `stats`            | Object     | `{ views, sales, rating, reviewCount }`                  |

**Index** : `title + description + tags` (text), `shopId + status`, `category + status + price`

---

### 4. `stockmovements` — Mouvements de Stock ⭐

Collection centrale qui trace **toutes** les entrées/sorties de stock, ainsi que les **ventes** (avec snapshot complet).

| Champ          | Type     | Description                                                                                                      |
| -------------- | -------- | ---------------------------------------------------------------------------------------------------------------- |
| `reference`    | String   | Référence unique auto-générée (ex: `VNT-2026-000001`)                                                           |
| `productId`    | ObjectId | Produit concerné                                                                                                 |
| `shopId`       | ObjectId | Boutique concernée                                                                                               |
| `movementType` | Enum     | `SUPPLY` \| `SALE` \| `RETURN_CUSTOMER` \| `RETURN_SUPPLIER` \| `ADJUSTMENT_PLUS` \| `ADJUSTMENT_MINUS` \| `RESERVATION` \| `RESERVATION_CANCEL` |
| `direction`    | Enum     | `IN` (entrée) \| `OUT` (sortie) — calculé automatiquement                                                       |
| `quantity`     | Number   | Quantité déplacée                                                                                                |
| `unitPrice`    | Number   | Prix unitaire                                                                                                    |
| `totalAmount`  | Number   | Montant total                                                                                                    |
| `stockBefore`  | Number   | Stock avant le mouvement (audit)                                                                                 |
| `stockAfter`   | Number   | Stock après le mouvement (audit)                                                                                 |
| `sale`         | Object   | *(si SALE)* `{ buyerId, productSnapshot, buyerSnapshot, deliveryAddress, commission, status, paymentStatus... }` |
| `supply`       | Object   | *(si SUPPLY)* `{ supplier, batch, unitCost }`                                                                   |
| `adjustment`   | Object   | *(si ADJUSTMENT)* `{ reason, stockTheoretical, stockActual }`                                                   |
| `reservation`  | Object   | *(si RESERVATION)* `{ cartId, expiresAt }`                                                                      |
| `groupId`      | String   | Lie plusieurs mouvements d'une même transaction                                                                  |
| `performedBy`  | ObjectId | Utilisateur ayant effectué le mouvement                                                                          |

**Index** : `productId + createdAt`, `shopId + movementType`, `sale.buyerId`, `sale.status`

---

### 5. `carts` — Paniers

| Champ       | Type     | Description                              |
| ----------- | -------- | ---------------------------------------- |
| `userId`    | ObjectId | Acheteur propriétaire                    |
| `items`     | Array    | `[{ productId, shopId, priceSnapshot, quantity, reservationMovementId }]` |
| `expiresAt` | Date     | Expiration TTL (30 min après dernière modif) |

**Index** : `userId`, TTL sur `expiresAt`

---

### 6. `wallets` — Portefeuilles

| Champ          | Type     | Description                        |
| -------------- | -------- | ---------------------------------- |
| `ownerId`      | ObjectId | Utilisateur ou Boutique propriétaire|
| `ownerModel`   | Enum     | `User` \| `Shop`                   |
| `balance`      | Number   | Solde disponible (MGA)             |
| `pendingBalance`| Number  | Solde en attente (ventes non livrées)|
| `currency`     | String   | Devise (défaut: `MGA`)             |

**Index** : `ownerId + ownerModel` (unique)

---

### 7. `wallettransactions` — Transactions Wallet

| Champ              | Type     | Description                                                                 |
| ------------------ | -------- | --------------------------------------------------------------------------- |
| `walletId`         | ObjectId | Wallet concerné                                                              |
| `type`             | Enum     | `DEPOSIT` \| `WITHDRAWAL` \| `SALE_PAYMENT` \| `SALE_REVENUE` \| `REFUND` \| `COMMISSION` |
| `amount`           | Number   | Montant (positif ou négatif)                                                 |
| `balanceBefore`    | Number   | Solde avant transaction                                                      |
| `balanceAfter`     | Number   | Solde après transaction                                                      |
| `stockMovementId`  | ObjectId | Référence au mouvement de stock source                                       |
| `stockMovementRef` | String   | Numéro de référence du mouvement                                             |
| `description`      | String   | Description de la transaction                                                |
| `status`           | Enum     | `PENDING` \| `COMPLETED` \| `FAILED` \| `CANCELLED`                         |

**Index** : `walletId + createdAt`, `type + status`, `stockMovementId`

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
