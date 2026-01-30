# GitHub Copilot Instructions - Projet MEAN Marketplace

## 📋 Contexte du Projet

Ce projet est une application **MEAN Stack** (MongoDB, Express, Angular, Node.js) pour un centre commercial de type "Akoor" ou "La City". L'application permet de gérer une marketplace avec trois profils d'utilisateurs.

### Informations Projet

- **Nom**: m1p13mean-Kenny-Tsito
- **Type**: Application Marketplace Centre Commercial
- **Période**: 27 Janvier 2026 - 03 Mars 2026
- **Équipe**: Binôme (Kenny & Tsito)

### Profils Utilisateurs

1. **Admin Centre Commercial** - Gestion globale de la plateforme
2. **Boutique (Seller)** - Vendeurs avec leurs propres produits
3. **Acheteurs (Buyer)** - Clients finaux

---

## 🛠️ Stack Technique

### Backend (`/back-end`)

- **Runtime**: Node.js
- **Framework**: Express.js v5
- **Langage**: JavaScript **UNIQUEMENT** (pas de TypeScript)
- **Modules**: ES Modules (`import`/`export`)
- **Base de données**: MongoDB avec Mongoose
- **Architecture**: REST API

### Frontend (`/front-end`)

- **Framework**: Angular 19
- **Langage**: TypeScript
- **UI Library**: ZardUI (alternative shadcn pour Angular)
- **Style**: Tailwind CSS

---

## 📁 Architecture Backend Cible

```
back-end/
├── src/
│   ├── config/
│   │   ├── db.js           # Connexion MongoDB
│   │   └── env.js          # Variables d'environnement
│   ├── models/
│   │   ├── User.js         # Modèle utilisateur (roles: BUYER, SELLER, ADMIN)
│   │   ├── Shop.js         # Modèle boutique
│   │   ├── Product.js      # Modèle produit
│   │   ├── Cart.js         # Panier avec TTL
│   │   ├── Order.js        # Commandes
│   │   ├── Wallet.js       # Portefeuille
│   │   └── WalletTransaction.js
│   ├── controllers/        # Logique métier
│   ├── routes/             # Définition des routes
│   ├── middlewares/
│   │   ├── auth.middleware.js
│   │   └── error.middleware.js
│   ├── utils/
│   │   └── apiResponse.js
│   └── app.js
├── server.js
├── .env
└── package.json
```

---

## 🎯 Règles de Développement

### Règles Générales

1. **Commentaires**: Écrire les commentaires en français
2. **Variables/Fonctions**: Nommage en anglais (camelCase)
3. **Commits**: Messages en français, descriptifs
4. **Pull Requests**: Obligatoires pour toute modification
5. **Tests**: À implémenter progressivement

### Backend - JavaScript Pure (ES Modules)

- ❌ **JAMAIS** de TypeScript dans le backend
- ✅ Utiliser ES Modules (`import`/`export`)
- ✅ `"type": "module"` dans package.json
- ✅ Async/await pour les opérations asynchrones
- ✅ Validation avec Joi ou express-validator
- ✅ Gestion d'erreurs centralisée

### Frontend - Angular + ZardUI

- ✅ TypeScript obligatoire
- ✅ Standalone components (Angular 19)
- ✅ ZardUI pour les composants UI (shadcn-like)
- ✅ Tailwind CSS pour le styling
- ✅ Services pour la logique métier
- ✅ Guards pour la protection des routes
- ✅ Interceptors pour les requêtes HTTP

### Base de Données - MongoDB

- ✅ Indexes pour les recherches fréquentes
- ✅ Dénormalisation contrôlée
- ✅ Snapshots des prix dans les commandes
- ✅ TTL index pour les paniers
- ✅ Transactions pour les opérations critiques

---

## 🔐 Authentification

- JWT (JSON Web Tokens) pour l'authentification
- Refresh tokens pour la session
- Middleware de vérification des rôles
- Hash des mots de passe avec bcrypt

---

## 📡 API REST Conventions

### Format des réponses

```javascript
// Succès
{
  "success": true,
  "data": { ... },
  "message": "Opération réussie"
}

// Erreur
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Description de l'erreur"
  }
}
```

### Endpoints principaux

- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/products` - Liste des produits
- `POST /api/cart` - Gestion du panier
- `POST /api/orders` - Création de commande
- `GET /api/wallets` - Portefeuille

---

## 🚀 Déploiement

- Frontend: Vercel (déjà configuré avec `vercel.json`)
- Backend: Render, Railway, ou Heroku
- Base de données: MongoDB Atlas

---

## ⚠️ Points d'Attention

1. **Sécurité**: Valider toutes les entrées utilisateur
2. **Performance**: Pagination obligatoire pour les listes
3. **Stock**: Gérer le stock réservé lors des ajouts au panier
4. **Transactions**: Utiliser les transactions MongoDB pour les achats
5. **Logs**: Implémenter un système de logging (morgan + winston)

---

## 📝 Footer Obligatoire

Le footer du site doit contenir:

- Noms complets des développeurs
- Année du projet
- Lien vers le repository GitHub
