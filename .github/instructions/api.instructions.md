---
description: Conventions et documentation de l'API REST
applyTo: back-end/src/routes/**,back-end/src/controllers/**
---

# API REST Instructions

## 🎯 Conventions Générales

### Base URL

- **Développement**: `http://localhost:3000/api`
- **Production**: `https://votre-api.onrender.com/api`

### Headers requis

```
Content-Type: application/json
Authorization: Bearer <token>  (pour les routes protégées)
```

---

## 📊 Format des Réponses

### Succès

```javascript
{
  "success": true,
  "data": { ... },          // Données retournées
  "message": "Message",     // Message optionnel
  "pagination": {           // Pour les listes
    "page": 1,
    "limit": 10,
    "total": 100,
    "pages": 10
  }
}
```

### Erreur

```javascript
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Description de l'erreur",
    "details": { ... }      // Détails optionnels (validation)
  }
}
```

### Codes d'erreur standards

| Code               | HTTP Status | Description                     |
| ------------------ | ----------- | ------------------------------- |
| `VALIDATION_ERROR` | 400         | Données invalides               |
| `UNAUTHORIZED`     | 401         | Non authentifié                 |
| `FORBIDDEN`        | 403         | Accès refusé                    |
| `NOT_FOUND`        | 404         | Ressource non trouvée           |
| `CONFLICT`         | 409         | Conflit (ex: email existe déjà) |
| `INTERNAL_ERROR`   | 500         | Erreur serveur                  |

---

## 🔐 Routes d'Authentification

### `POST /api/auth/register`

Inscription d'un nouvel utilisateur.

**Body:**

```json
{
  "email": "user@example.com",
  "password": "motdepasse123",
  "role": "BUYER",
  "profile": {
    "name": "Nom Complet",
    "phone": "+261 34 00 000 00"
  }
}
```

**Réponse (201):**

```json
{
  "success": true,
  "data": {
    "user": { "_id": "...", "email": "...", "role": "BUYER" },
    "token": "eyJhbGc..."
  },
  "message": "Inscription réussie"
}
```

### `POST /api/auth/login`

Connexion utilisateur.

**Body:**

```json
{
  "email": "user@example.com",
  "password": "motdepasse123"
}
```

**Réponse (200):**

```json
{
  "success": true,
  "data": {
    "user": { "_id": "...", "email": "...", "role": "BUYER" },
    "token": "eyJhbGc..."
  }
}
```

### `GET /api/auth/me`

Récupérer le profil de l'utilisateur connecté.

**Headers:** `Authorization: Bearer <token>`

**Réponse (200):**

```json
{
  "success": true,
  "data": {
    "_id": "...",
    "email": "user@example.com",
    "role": "BUYER",
    "profile": { "name": "...", "phone": "..." }
  }
}
```

---

## 🏪 Routes Boutiques

### `GET /api/shops`

Liste des boutiques actives.

**Query params:**

- `page` (default: 1)
- `limit` (default: 10)
- `search` - Recherche par nom
- `category` - Filtrer par catégorie

### `GET /api/shops/:id`

Détails d'une boutique.

### `POST /api/shops` (SELLER)

Créer sa boutique.

**Body:**

```json
{
  "name": "Ma Boutique",
  "description": "Description...",
  "categories": ["Électronique", "Mode"],
  "contact": {
    "email": "shop@example.com",
    "phone": "+261...",
    "address": "Adresse..."
  }
}
```

### `PUT /api/shops/:id` (SELLER - propriétaire)

Modifier sa boutique.

### `PATCH /api/shops/:id/validate` (ADMIN)

Valider/activer une boutique.

---

## 📦 Routes Produits

### `GET /api/products`

Liste des produits actifs.

**Query params:**

- `page`, `limit`
- `search` - Recherche full-text
- `category`
- `minPrice`, `maxPrice`
- `shopId` - Produits d'une boutique
- `sort` - `price_asc`, `price_desc`, `newest`, `popular`

### `GET /api/products/:id`

Détails d'un produit.

### `POST /api/products` (SELLER)

Créer un produit.

**Body:**

```json
{
  "title": "iPhone 15",
  "description": "Description détaillée...",
  "price": 2500000,
  "stock": 10,
  "category": "Électronique",
  "tags": ["smartphone", "apple", "iphone"],
  "characteristics": {
    "couleur": "Noir",
    "stockage": "128GB"
  },
  "images": ["url1", "url2"]
}
```

### `PUT /api/products/:id` (SELLER - propriétaire)

Modifier un produit.

### `DELETE /api/products/:id` (SELLER - propriétaire)

Supprimer un produit.

### `PATCH /api/products/:id/validate` (ADMIN)

Valider/rejeter un produit.

**Body:**

```json
{
  "status": "ACTIVE",
  "rejectionReason": null
}
```

---

## 🛒 Routes Panier

### `GET /api/cart` (BUYER)

Récupérer son panier.

### `POST /api/cart/items` (BUYER)

Ajouter un produit au panier.

**Body:**

```json
{
  "productId": "...",
  "quantity": 2
}
```

### `PUT /api/cart/items/:productId` (BUYER)

Modifier la quantité.

**Body:**

```json
{
  "quantity": 3
}
```

### `DELETE /api/cart/items/:productId` (BUYER)

Retirer un produit du panier.

### `DELETE /api/cart` (BUYER)

Vider le panier.

---

## 📋 Routes Commandes

### `GET /api/orders` (Auth)

Liste des commandes (filtrée par rôle).

- BUYER: ses commandes
- SELLER: commandes contenant ses produits
- ADMIN: toutes les commandes

### `GET /api/orders/:id` (Auth)

Détails d'une commande.

### `POST /api/orders` (BUYER)

Créer une commande depuis le panier.

**Body:**

```json
{
  "deliveryAddress": {
    "street": "123 Rue Example",
    "city": "Antananarivo",
    "postalCode": "101",
    "country": "Madagascar",
    "phone": "+261..."
  },
  "notes": "Instructions de livraison..."
}
```

### `PATCH /api/orders/:id/status` (SELLER/ADMIN)

Mettre à jour le statut.

**Body:**

```json
{
  "status": "SHIPPED",
  "note": "Colis expédié via DHL"
}
```

### `POST /api/orders/:id/cancel` (BUYER/ADMIN)

Annuler une commande.

---

## 💰 Routes Wallet

### `GET /api/wallets` (Auth)

Récupérer son wallet.

### `GET /api/wallets/transactions` (Auth)

Historique des transactions.

**Query params:**

- `page`, `limit`
- `type` - DEPOSIT, WITHDRAWAL, PAYMENT, etc.
- `startDate`, `endDate`

### `POST /api/wallets/deposit` (Auth)

Recharger son wallet.

**Body:**

```json
{
  "amount": 100000,
  "paymentMethod": "MOBILE_MONEY",
  "reference": "..."
}
```

### `POST /api/wallets/withdraw` (SELLER)

Retrait vers compte bancaire.

**Body:**

```json
{
  "amount": 50000,
  "bankDetails": {
    "bankName": "...",
    "accountNumber": "...",
    "accountName": "..."
  }
}
```

---

## 👤 Routes Admin

### `GET /api/admin/dashboard`

Statistiques globales.

### `GET /api/admin/users`

Liste des utilisateurs.

### `PATCH /api/admin/users/:id/status`

Activer/désactiver un utilisateur.

### `GET /api/admin/shops/pending`

Boutiques en attente de validation.

### `GET /api/admin/products/pending`

Produits en attente de validation.

---

## 📤 Routes Upload

### `POST /api/upload/image`

Upload d'une image.

**Body:** `multipart/form-data`

- `image`: fichier image

**Réponse:**

```json
{
  "success": true,
  "data": {
    "url": "https://storage.example.com/images/abc123.jpg"
  }
}
```

---

## 🔒 Middleware d'Authentification

```javascript
// Routes publiques (pas de token requis)
GET /api/products
GET /api/products/:id
GET /api/shops
GET /api/shops/:id
POST /api/auth/register
POST /api/auth/login

// Routes authentifiées (token requis)
GET /api/auth/me
GET /api/cart
POST /api/orders
GET /api/wallets

// Routes avec rôle spécifique
POST /api/products (SELLER)
PATCH /api/products/:id/validate (ADMIN)
GET /api/admin/* (ADMIN)
```

---

## 📝 Validation des Données

Utiliser Joi pour la validation:

```javascript
const Joi = require("joi");

const productSchema = Joi.object({
  title: Joi.string().min(3).max(100).required(),
  description: Joi.string().min(10).max(5000).required(),
  price: Joi.number().positive().required(),
  stock: Joi.number().integer().min(0).required(),
  category: Joi.string().required(),
  tags: Joi.array().items(Joi.string()).max(10),
  characteristics: Joi.object().pattern(Joi.string(), Joi.any()),
  images: Joi.array().items(Joi.string().uri()).max(5),
});
```

---

## 🔄 Pagination Standard

Toutes les routes de liste supportent:

- `page` (default: 1)
- `limit` (default: 10, max: 100)

Réponse pagination:

```json
{
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 150,
    "pages": 15,
    "hasNext": true,
    "hasPrev": false
  }
}
```
