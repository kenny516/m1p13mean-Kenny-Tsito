import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
// custom in-place sanitizer will be used instead of express-mongo-sanitize
import config from "./src/config/env.js";
import routes from "./src/routes/index.js";
import {
  errorHandler,
  notFoundHandler,
} from "./src/middlewares/error.middleware.js";

const app = express();

// ============================================
// Middlewares de sécurité
// ============================================

// Helmet pour les headers de sécurité
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

// Sanitize in-place pour req.body, req.params et req.query
// On évite d'assigner `req.query` (Express 5 fournit un getter non-écrasable)
const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== "object") return;
  for (const key of Object.keys(obj)) {
    // supprimer les clés commençant par $ ou contenant un point
    if (key.startsWith("$") || key.includes(".")) {
      delete obj[key];
      continue;
    }

    const value = obj[key];
    if (value && typeof value === "object") {
      sanitizeObject(value);
    }
  }
};

app.use((req, res, next) => {
  try {
    // sanitize params (modifiable)
    sanitizeObject(req.params);

    // sanitize query in-place without reassigning
    if (req.query && typeof req.query === "object") {
      sanitizeObject(req.query);
    }

    // body will be available after json/urlencoded parsers; run sanitizer after parsers below
    next();
  } catch (err) {
    next(err);
  }
});

// ============================================
// Middlewares de parsing
// ============================================

// Parser JSON
app.use(express.json({ limit: "10mb" }));

// Parser URL-encoded
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Après parsers, sanitize le body en place
app.use((req, res, next) => {
  try {
    if (req.body && typeof req.body === "object") {
      sanitizeObject(req.body);
    }
    next();
  } catch (err) {
    next(err);
  }
});

// ============================================
// Logging
// ============================================

// Morgan logger en développement
if (config.nodeEnv === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// ============================================
// Rate Limiting
// ============================================

// Rate limiter global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // max 100 requêtes par IP
  message: {
    success: false,
    error: {
      code: "RATE_LIMIT",
      message: "Trop de requêtes, veuillez réessayer plus tard",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", globalLimiter);

// Rate limiter strict pour l'authentification
const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 heure
  max: 10, // max 10 tentatives
  message: {
    success: false,
    error: {
      code: "AUTH_RATE_LIMIT",
      message: "Trop de tentatives de connexion, veuillez réessayer plus tard",
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

// ============================================
// Routes
// ============================================

// Route de santé
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API Marketplace Centre Commercial",
    version: "1.0.0",
    documentation: "/api/docs",
  });
});

// Route de santé API
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    data: {
      status: "healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.nodeEnv,
    },
  });
});

// Routes API
app.use("/api", routes);

// ============================================
// Gestion des erreurs
// ============================================

// Route non trouvée (404)
app.use(notFoundHandler);

// Gestionnaire d'erreurs global
app.use(errorHandler);

export default app;
