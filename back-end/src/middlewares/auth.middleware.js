import jwt from "jsonwebtoken";
import User from "../models/User.js";
import config from "../config/env.js";

/**
 * Middleware d'authentification JWT
 * Vérifie le token et attache l'utilisateur à la requête
 */
export const auth = async (req, res, next) => {
  try {
    // Récupérer le token depuis le header Authorization
    const authHeader = req.header("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: "NO_TOKEN",
          message: "Token d'authentification requis",
        },
      });
    }

    // Vérifier et décoder le token
    const decoded = jwt.verify(token, config.jwtSecret);

    // Récupérer l'utilisateur
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          code: "USER_NOT_FOUND",
          message: "Utilisateur non trouvé",
        },
      });
    }

    // Vérifier si l'utilisateur est actif
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: {
          code: "USER_INACTIVE",
          message: "Compte désactivé",
        },
      });
    }

    // Attacher l'utilisateur à la requête
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    // Gestion des erreurs JWT spécifiques
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        error: {
          code: "INVALID_TOKEN",
          message: "Token invalide",
        },
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        error: {
          code: "TOKEN_EXPIRED",
          message: "Token expiré",
        },
      });
    }

    next(error);
  }
};

/**
 * Middleware d'autorisation par rôle
 * Vérifie si l'utilisateur a le rôle requis
 * @param  {...string} allowedRoles - Liste des rôles autorisés
 */
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Non authentifié",
        },
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: {
          code: "FORBIDDEN",
          message: "Accès non autorisé pour ce rôle",
        },
      });
    }

    next();
  };
};

/**
 * Middleware optionnel d'authentification
 * Attache l'utilisateur si un token valide est présent, sinon continue
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (token) {
      const decoded = jwt.verify(token, config.jwtSecret);
      const user = await User.findById(decoded.userId);
      if (user && user.isActive) {
        req.user = user;
        req.token = token;
      }
    }
    next();
  } catch {
    // En cas d'erreur, on continue sans utilisateur
    next();
  }
};
