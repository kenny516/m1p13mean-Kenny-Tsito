import Joi from "joi";

/**
 * Schémas de validation pour les wallets
 */

/**
 * Schéma de validation pour un dépôt
 */
export const depositSchema = Joi.object({
  amount: Joi.number().positive().required().messages({
    "number.positive": "Le montant doit être positif",
    "any.required": "Le montant est requis",
  }),

  paymentMethod: Joi.string()
    .valid("CARD", "MOBILE_MONEY", "BANK_TRANSFER", "CASH")
    .required()
    .messages({
      "any.only": "Méthode de paiement invalide",
      "any.required": "La méthode de paiement est requise",
    }),

  description: Joi.string().trim().max(500).allow("", null),
});

/**
 * Schéma de validation pour un retrait
 */
export const withdrawSchema = Joi.object({
  amount: Joi.number().positive().required().messages({
    "number.positive": "Le montant doit être positif",
    "any.required": "Le montant est requis",
  }),

  paymentMethod: Joi.string()
    .valid("CARD", "MOBILE_MONEY", "BANK_TRANSFER", "CASH")
    .optional()
    .messages({
      "any.only": "Méthode de paiement invalide",
    }),

  description: Joi.string().trim().max(500).allow("", null),
});

export default {
  depositSchema,
  withdrawSchema,
};
