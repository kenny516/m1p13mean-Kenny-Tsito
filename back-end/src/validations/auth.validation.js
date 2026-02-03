import Joi from "joi";

/**
 * Schéma de validation pour l'inscription
 */
export const registerSchema = Joi.object({
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

  confirmPassword: Joi.string().valid(Joi.ref("password")).required().messages({
    "any.only": "Les mots de passe ne correspondent pas",
    "any.required": "La confirmation du mot de passe est requise",
  }),

  role: Joi.string().valid("BUYER", "SELLER").default("BUYER").messages({
    "any.only": "Le rôle doit être BUYER ou SELLER",
  }),

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
      .messages({
        "string.pattern.base":
          "Numéro de téléphone invalide (format: +261XXXXXXXXX ou 0XXXXXXXXX)",
      }),

    address: Joi.object({
      street: Joi.string().trim().max(200),
      city: Joi.string().trim().max(100),
      postalCode: Joi.string().trim().max(20),
      country: Joi.string().trim().max(100).default("Madagascar"),
    }),
  }).required(),
});

/**
 * Schéma de validation pour la connexion
 */
export const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Email invalide",
    "any.required": "L'email est requis",
  }),

  password: Joi.string().required().messages({
    "any.required": "Le mot de passe est requis",
  }),
});

/**
 * Schéma de validation pour la mise à jour du profil
 */
export const updateProfileSchema = Joi.object({
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

    address: Joi.object({
      street: Joi.string().trim().max(200).allow("", null),
      city: Joi.string().trim().max(100).allow("", null),
      postalCode: Joi.string().trim().max(20).allow("", null),
      country: Joi.string().trim().max(100).default("Madagascar"),
    }),

    avatar: Joi.string().uri().allow("", null).messages({
      "string.uri": "L'URL de l'avatar est invalide",
    }),
  }).required(),
});

/**
 * Schéma de validation pour le changement de mot de passe
 */
export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    "any.required": "Le mot de passe actuel est requis",
  }),

  newPassword: Joi.string()
    .min(8)
    .required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .messages({
      "string.min":
        "Le nouveau mot de passe doit contenir au moins 8 caractères",
      "string.pattern.base":
        "Le nouveau mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre",
      "any.required": "Le nouveau mot de passe est requis",
    }),

  confirmPassword: Joi.string()
    .valid(Joi.ref("newPassword"))
    .required()
    .messages({
      "any.only": "Les mots de passe ne correspondent pas",
      "any.required": "La confirmation du mot de passe est requise",
    }),
});
