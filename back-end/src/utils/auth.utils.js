import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import config from "../config/env.js";

/**
 * Générer un token JWT pour un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @returns {string} Token JWT
 */
export const generateToken = (userId) => {
  return jwt.sign({ userId }, config.jwtSecret, {
    expiresIn: config.jwtExpire,
  });
};

/**
 * Hasher un mot de passe avec bcrypt
 * @param {string} password - Mot de passe en clair
 * @param {number} rounds - Nombre de rounds pour le sel (défaut: 12)
 * @returns {Promise<string>} Mot de passe hashé
 */
export const hashPassword = async (password, rounds = 12) => {
  const salt = await bcrypt.genSalt(rounds);
  return bcrypt.hash(password, salt);
};

/**
 * Comparer un mot de passe avec un hash
 * @param {string} password - Mot de passe en clair
 * @param {string} hash - Hash du mot de passe
 * @returns {Promise<boolean>} True si le mot de passe correspond
 */
export const comparePassword = async (password, hash) => {
  return bcrypt.compare(password, hash);
};

/**
 * Préparer un objet utilisateur pour la réponse (sans mot de passe)
 * @param {Object} user - Document utilisateur Mongoose
 * @returns {Object} Utilisateur formaté pour la réponse
 */
export const formatUserResponse = (user) => {
  return {
    _id: user._id,
    email: user.email,
    role: user.role,
    profile: user.profile,
    isValidated: user.isValidated,
    walletId: user.walletId,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};
