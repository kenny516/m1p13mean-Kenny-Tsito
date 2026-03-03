import Joi from "joi";

/**
 * Schémas de validation pour les paramètres de la plateforme (Admin)
 */

/**
 * Schéma de validation pour la mise à jour des paramètres
 */
export const updateSettingsSchema = Joi.object({
  // === PARAMÈTRES COMMISSION ===
  defaultCommissionRate: Joi.number().min(0).max(100).messages({
    "number.min": "Le taux de commission doit être supérieur ou égal à 0",
    "number.max": "Le taux de commission ne peut pas dépasser 100%",
  }),

  // === PARAMÈTRES PANIER ===
  cartTTLMinutes: Joi.number().integer().min(5).max(1440).messages({
    "number.min": "La durée de vie du panier doit être d'au moins 5 minutes",
    "number.max":
      "La durée de vie du panier ne peut pas dépasser 24 heures (1440 minutes)",
    "number.integer": "La durée de vie du panier doit être un nombre entier",
  }),

  // === PARAMÈTRES STOCK ===
  lowStockThreshold: Joi.number().integer().min(0).messages({
    "number.min": "Le seuil de stock bas doit être supérieur ou égal à 0",
    "number.integer": "Le seuil de stock bas doit être un nombre entier",
  }),

  outOfStockThreshold: Joi.number().integer().min(0).messages({
    "number.min": "Le seuil de rupture de stock doit être supérieur ou égal à 0",
    "number.integer":
      "Le seuil de rupture de stock doit être un nombre entier",
  }),

  // === PARAMÈTRES GÉNÉRAUX ===
  currency: Joi.string().trim().min(1).max(10).messages({
    "string.min": "La devise est requise",
    "string.max": "La devise ne peut pas dépasser 10 caractères",
  }),

  platformName: Joi.string().trim().min(1).max(100).messages({
    "string.min": "Le nom de la plateforme est requis",
    "string.max": "Le nom de la plateforme ne peut pas dépasser 100 caractères",
  }),

  // === MODE MAINTENANCE ===
  maintenanceMode: Joi.boolean(),

  maintenanceMessage: Joi.string().trim().max(500).allow("", null).messages({
    "string.max":
      "Le message de maintenance ne peut pas dépasser 500 caractères",
  }),

  // === PARAMÈTRES EMAIL ===
  contactEmail: Joi.string().email().allow("", null).messages({
    "string.email": "Email de contact invalide",
  }),

  supportEmail: Joi.string().email().allow("", null).messages({
    "string.email": "Email de support invalide",
  }),

  // === PARAMÈTRES PAIEMENT ===
  minOrderAmount: Joi.number().min(0).messages({
    "number.min": "Le montant minimum de commande doit être supérieur ou égal à 0",
  }),

  maxOrderAmount: Joi.number().min(0).messages({
    "number.min": "Le montant maximum de commande doit être supérieur ou égal à 0",
  }),

  // === PARAMÈTRES WALLET ===
  minWithdrawalAmount: Joi.number().min(0).messages({
    "number.min": "Le montant minimum de retrait doit être supérieur ou égal à 0",
  }),
  adminGlobalWalletId: Joi.string()
    .pattern(/^[a-f\d]{24}$/i)
    .allow(null, "")
    .messages({
      "string.pattern.base": "L'identifiant du wallet admin global est invalide",
    }),

  // === PARAMÈTRES RETOUR ===
  returnWindowDays: Joi.number().integer().min(1).max(365).messages({
    "number.min": "Le délai de retour doit être d'au moins 1 jour",
    "number.max": "Le délai de retour ne peut pas dépasser 365 jours",
    "number.integer": "Le délai de retour doit être un nombre entier",
  }),
});

export default {
  updateSettingsSchema,
};
