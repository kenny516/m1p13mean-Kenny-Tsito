# Projet MEAN - Marketplace Centre Commercial

## 📋 Informations Projet

| Élément       | Détail                         |
| ------------- | ------------------------------ |
| **Nom**       | m1p13mean-Kenny-Tsito          |
| **Type**      | Application MEAN Stack         |
| **Période**   | 27 Janvier 2026 - 03 Mars 2026 |
| **Équipe**    | Kenny & Tsito                  |
| **Promotion** | Master 1 - Promotion 13        |

---

## 🎯 Description

Application web de marketplace pour un centre commercial (type Akoor/La City) permettant de gérer :

- **Administrateurs** : Gestion globale de la plateforme
- **Boutiques** : Vendeurs avec leurs propres produits
- **Acheteurs** : Clients finaux

---

## 🛠️ Stack Technique

| Composant           | Technologie                           |
| ------------------- | ------------------------------------- |
| **Base de données** | MongoDB                               |
| **Backend**         | Express.js (JavaScript ES Modules)    |
| **Frontend**        | Angular 19 + ZardUI + Tailwind CSS    |
| **Runtime**         | Node.js                               |

---

## 📁 Structure du Projet

```
m1p13mean-Kenny-Tsito/
├── back-end/           # API Express.js
│   ├── src/
│   │   ├── config/     # Configuration (DB, env)
│   │   ├── models/     # Modèles Mongoose
│   │   ├── controllers/# Logique métier
│   │   ├── routes/     # Définition des routes
│   │   ├── middlewares/# Auth, erreurs
│   │   └── utils/      # Utilitaires
│   └── server.js
│
├── front-end/          # Application Angular
│   └── src/
│       └── app/
│           ├── core/       # Services, guards, interceptors
│           ├── shared/     # Composants réutilisables
│           └── features/   # Modules fonctionnels
│
└── .github/
    └── instructions/   # Instructions Copilot
```

---

## 🚀 Installation

### Prérequis

- Node.js 18+
- MongoDB (local ou Atlas)
- Angular CLI 19

### Backend

```bash
cd back-end
npm install
cp .env.example .env  # Configurer les variables
npm run dev
```

### Frontend

```bash
cd front-end
npm install
ng serve
```

---

## 🔧 Variables d'Environnement

Créer un fichier `.env` dans `back-end/` :

```env
PORT=3000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/marketplace
JWT_SECRET=votre_secret_jwt_super_secure
JWT_EXPIRE=7d
```

---

## 📡 API Endpoints

### Authentification

- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/auth/me` - Profil utilisateur

### Produits

- `GET /api/products` - Liste des produits
- `GET /api/products/:id` - Détail produit
- `POST /api/products` - Créer (Seller)
- `PUT /api/products/:id` - Modifier (Seller)

### Panier

- `GET /api/cart` - Mon panier
- `POST /api/cart/items` - Ajouter au panier
- `DELETE /api/cart/items/:id` - Retirer

### Commandes

- `GET /api/orders` - Mes commandes
- `POST /api/orders` - Créer commande

### Wallet

- `GET /api/wallets` - Mon portefeuille
- `POST /api/wallets/deposit` - Recharger

---

## 👥 Comptes de Test

### Admin

- Email: `admin@marketplace.mg`
- Mot de passe: `admin123`

### Vendeur

- Email: `vendeur@marketplace.mg`
- Mot de passe: `vendeur123`

### Acheteur

- Email: `acheteur@marketplace.mg`
- Mot de passe: `acheteur123`

---

## 🌐 Déploiement

| Service  | Plateforme       |
| -------- | ---------------- |
| Frontend | Vercel           |
| Backend  | Render / Railway |
| Database | MongoDB Atlas    |

---

## 📝 Fonctionnalités

### Admin

- [ ] Dashboard avec statistiques
- [ ] Gestion des utilisateurs
- [ ] Validation des boutiques
- [ ] Validation des produits
- [ ] Gestion des commissions

### Boutique (Seller)

- [ ] Création de boutique
- [ ] Gestion des produits (CRUD)
- [ ] Suivi des commandes
- [ ] Statistiques de vente
- [ ] Gestion du wallet

### Acheteur (Buyer)

- [ ] Navigation des produits
- [ ] Recherche et filtres
- [ ] Panier d'achat
- [ ] Processus de commande
- [ ] Historique des commandes
- [ ] Gestion du wallet

---

## 📚 Documentation

- [Instructions Backend](.github/instructions/backend.instructions.md)
- [Instructions Frontend](.github/instructions/frontend.instructions.md)
- [API Documentation](.github/instructions/api.instructions.md)
- [MongoDB Models](.github/instructions/mongodb.instructions.md)
- [Sécurité](.github/instructions/security.instructions.md)
- [Git Workflow](.github/instructions/git.instructions.md)

---

## 👨‍💻 Développeurs

| Nom       | Rôle                   |
| --------- | ---------------------- |
| **Kenny** | Développeur Full Stack |
| **Tsito** | Développeur Full Stack |

---

## 📄 Licence

Ce projet est réalisé dans le cadre académique - Master 1 Promotion 13.

---

<p align="center">
  <strong>© 2026 - Marketplace Centre Commercial</strong><br>
  Développé par Kenny & Tsito
</p>
Tsito** | Développeur Full Stack |

---

## 📄 Licence

Ce projet est réalisé dans le cadre académique - Master 1 Promotion 13.

---

<p align="center">
  <strong>© 2026 - Marketplace Centre Commercial</strong><br>
  Développé par Kenny & Tsito
</p>
