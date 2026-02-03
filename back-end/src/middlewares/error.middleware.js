import config from "../config/env.js";

/**
 * Middleware de gestion centralisée des erreurs
 * Capture toutes les erreurs et retourne une réponse formatée
 */
export const errorHandler = (err, req, res, _next) => {
  // Log de l'erreur en développement
  if (config.nodeEnv === "development") {
    console.error("❌ Erreur:", err);
  }

  // Erreur de validation Mongoose
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((error) => error.message);
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Erreur de validation",
        details: messages,
      },
    });
  }

  // Erreur de duplication MongoDB (unique constraint)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({
      success: false,
      error: {
        code: "CONFLICT",
        message: `${field} existe déjà`,
        details: { field, value: err.keyValue[field] },
      },
    });
  }

  // Erreur de cast MongoDB (ID invalide)
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      error: {
        code: "INVALID_ID",
        message: "ID invalide",
        details: { field: err.path, value: err.value },
      },
    });
  }

  // Erreur JWT
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      error: {
        code: "INVALID_TOKEN",
        message: "Token invalide",
      },
    });
  }

  // Erreur d'expiration JWT
  if (err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      error: {
        code: "TOKEN_EXPIRED",
        message: "Token expiré",
      },
    });
  }

  // Erreur personnalisée avec statusCode
  if (err.statusCode) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code || "ERROR",
        message: err.message,
        details: err.details,
      },
    });
  }

  // Erreur par défaut (500)
  res.status(500).json({
    success: false,
    error: {
      code: "INTERNAL_ERROR",
      message:
        config.nodeEnv === "production"
          ? "Une erreur interne est survenue"
          : err.message,
    },
  });
};

/**
 * Middleware pour les routes non trouvées
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: "NOT_FOUND",
      message: `Route ${req.method} ${req.originalUrl} non trouvée`,
    },
  });
};

/**
 * Classe d'erreur personnalisée pour l'API
 */
export class ApiError extends Error {
  constructor(statusCode, code, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}
