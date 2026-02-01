---
description: Règles de sécurité pour l'application
applyTo: "**"
---

# Security Instructions

## 🔐 Authentification

### JWT

- Utiliser des tokens JWT avec expiration courte (15min - 1h)
- Implémenter refresh tokens pour les sessions longues
- Stocker le secret JWT dans les variables d'environnement
- Ne JAMAIS exposer le secret JWT côté client

### Mots de passe

- Hasher avec bcryptjs (minimum 10 rounds)
- Ne JAMAIS stocker en clair
- Minimum 8 caractères avec complexité

---

## 🛡️ Validation des Entrées

### Backend

```javascript
// TOUJOURS valider avec Joi ou express-validator
import Joi from "joi";

const userSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().min(2).max(50).required(),
});

// Middleware de validation
export const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: { code: "VALIDATION_ERROR", message: error.details[0].message },
    });
  }
  next();
};
```

### Frontend

- Valider côté client avec Angular Reactive Forms
- NE PAS faire confiance aux validations frontend uniquement

---

## 🚫 Protection contre les Attaques

### Injection NoSQL

```javascript
// ❌ DANGEREUX - Ne jamais faire ça
const user = await User.findOne({ email: req.body.email });

// ✅ SÉCURISÉ - Valider le type
const email = String(req.body.email);
const user = await User.findOne({ email });
```

### XSS (Cross-Site Scripting)

- Échapper les données avant affichage
- Utiliser `helmet` pour les headers de sécurité
- Angular échappe par défaut les templates

### CSRF

- Utiliser des tokens CSRF pour les formulaires
- Vérifier l'origine des requêtes

---

## 🔒 Configuration Express

```javascript
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";

// Helmet pour les headers de sécurité
app.use(helmet());

// Sanitize les requêtes MongoDB
app.use(mongoSanitize());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requêtes par IP
  message: {
    success: false,
    error: { code: "RATE_LIMIT", message: "Trop de requêtes" },
  },
});
app.use("/api/", limiter);

// Rate limit plus strict pour l'auth
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 5, // max 5 tentatives
  message: {
    success: false,
    error: {
      code: "AUTH_RATE_LIMIT",
      message: "Trop de tentatives de connexion",
    },
  },
});
app.use("/api/auth/login", authLimiter);
```

---

## 📁 Variables d'Environnement

### Ne JAMAIS commiter

- `.env`
- Clés API
- Secrets JWT
- Chaînes de connexion DB

### Template `.env.example`

```env
PORT=3000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/marketplace
JWT_SECRET=votre_secret_super_long_et_complexe
JWT_EXPIRE=7d
```

---

## 🔑 Contrôle d'Accès (RBAC)

```javascript
// Middleware d'autorisation
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: "UNAUTHORIZED", message: "Non authentifié" },
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "Accès non autorisé" },
      });
    }

    next();
  };
};

// Usage
import { auth } from "../middlewares/auth.middleware.js";
import { authorize } from "../middlewares/authorize.middleware.js";
import { deleteProduct } from "../controllers/product.controller.js";

router.delete(
  "/products/:id",
  auth,
  authorize("ADMIN", "SELLER"),
  deleteProduct,
);
```

---

## 📊 Logs de Sécurité

```javascript
// Logger les événements de sécurité
const securityLogger = (event, userId, details) => {
  console.log(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      event,
      userId,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
      details,
    }),
  );
};

// Events à logger:
// - LOGIN_SUCCESS
// - LOGIN_FAILED
// - LOGOUT
// - PASSWORD_CHANGE
// - PERMISSION_DENIED
// - SUSPICIOUS_ACTIVITY
```

---

## ✅ Checklist Sécurité

- [ ] Helmet configuré
- [ ] Rate limiting en place
- [ ] Validation des entrées (Joi)
- [ ] Sanitization MongoDB
- [ ] JWT sécurisé
- [ ] Mots de passe hashés
- [ ] CORS configuré correctement
- [ ] Variables sensibles dans .env
- [ ] HTTPS en production
- [ ] Logs de sécurité actifs
