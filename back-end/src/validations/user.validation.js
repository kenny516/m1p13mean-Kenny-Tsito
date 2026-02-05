import Joi from "joi";

/**
 * Schémas de validation pour la gestion des utilisateurs (Admin)
 */

/**
 * Schéma de validation pour la création d'un utilisateur
 */
export const createUserSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Email invalide",
    "any.required": "L'email est requis",
  }),

  password: Joi.string()
    .min(8)
    .required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .messages({
      "string.min": "Le mot de passe doit contenir au moins 8 caractères",
      "string.pattern.base":
        "Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre",
      "any.required": "Le mot de passe est requis",
    }),

  role: Joi.string().valid("BUYER", "SELLER", "ADMIN").required().messages({
    "any.only": "Le rôle doit être BUYER, SELLER ou ADMIN",
    "any.required": "Le rôle est requis",
  }),

  isValidated: Joi.boolean().default(true),

  isActive: Joi.boolean().default(true),

  profile: Joi.object({
    firstName: Joi.string().trim().min(2).max(50).required().messages({
      "string.min": "Le prénom doit contenir au moins 2 caractères",
      "string.max": "Le prénom ne peut pas dépasser 50 caractères",
      "any.required": "Le prénom est requis",
    }),

    lastName: Joi.string().trim().min(2).max(50).required().messages({
      "string.min": "Le nom doit contenir au moins 2 caractères",
      "string.max": "Le nom ne peut pas dépasser 50 caractères",
      "any.required": "Le nom est requis",
    }),

    phone: Joi.string()
      .pattern(/^(\+261|0)[0-9]{9}$/)
      .allow("", null)
      .messages({
        "string.pattern.base":
          "Numéro de téléphone invalide (format: +261XXXXXXXXX ou 0XXXXXXXXX)",
      }),

    avatar: Joi.string().uri().allow("", null),

    address: Joi.object({
      street: Joi.string().trim().max(200).allow("", null),
      city: Joi.string().trim().max(100).allow("", null),
      postalCode: Joi.string().trim().max(20).allow("", null),
      country: Joi.string().trim().max(100).default("Madagascar"),
    }),
  }).required(),
});

/**
 * Schéma de validation pour la mise à jour d'un utilisateur
 */
export const updateUserSchema = Joi.object({
  email: Joi.string().email().messages({
    "string.email": "Email invalide",
  }),

  role: Joi.string().valid("BUYER", "SELLER", "ADMIN").messages({
    "any.only": "Le rôle doit être BUYER, SELLER ou ADMIN",
  }),

  isValidated: Joi.boolean(),

  isActive: Joi.boolean(),

  profile: Joi.object({
    firstName: Joi.string().trim().min(2).max(50).messages({
      "string.min": "Le prénom doit contenir au moins 2 caractères",
      "string.max": "Le prénom ne peut pas dépasser 50 caractères",
    }),

    lastName: Joi.string().trim().min(2).max(50).messages({
      "string.min": "Le nom doit contenir au moins 2 caractères",
      "string.max": "Le nom ne peut pas dépasser 50 caractères",
    }),

    phone: Joi.string()
      .pattern(/^(\+261|0)[0-9]{9}$/)
      .allow("", null)
      .messages({
        "string.pattern.base":
          "Numéro de téléphone invalide (format: +261XXXXXXXXX ou 0XXXXXXXXX)",
      }),

    avatar: Joi.string().uri().allow("", null),

    address: Joi.object({
      street: Joi.string().trim().max(200).allow("", null),
      city: Joi.string().trim().max(100).allow("", null),
      postalCode: Joi.string().trim().max(20).allow("", null),
      country: Joi.string().trim().max(100),
    }),
  }),
});

/**
 * Schéma de validation pour la réinitialisation du mot de passe
 */
export const resetPasswordSchema = Joi.object({
  newPassword: Joi.string()
    .min(8)
    .required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .messages({
      "string.min": "Le mot de passe doit contenir au moins 8 caractères",
      "string.pattern.base":
        "Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre",
      "any.required": "Le nouveau mot de passe est requis",
    }),
});

export default {
  createUserSchema,
  updateUserSchema,
  resetPasswordSchema,
};
