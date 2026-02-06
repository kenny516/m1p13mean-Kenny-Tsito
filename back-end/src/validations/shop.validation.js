import Joi from "joi";

/**
 * Schéma de validation pour la création d'une boutique
 */
export const createShopSchema = Joi.object({
	name: Joi.string().trim().min(3).max(100).required().messages({
		"string.empty": "Le nom de la boutique est requis",
		"string.min": "Le nom doit contenir au moins 3 caractères",
		"string.max": "Le nom ne doit pas dépasser 100 caractères",
	}),

	description: Joi.string().min(10).max(5000).optional().messages({
		"string.min": "La description doit contenir au moins 10 caractères",
		"string.max": "La description ne doit pas dépasser 5000 caractères",
	}),

	logo: Joi.string().uri().optional().messages({
		"string.uri": "Le logo doit être une URL valide",
	}),

	banner: Joi.string().uri().optional().messages({
		"string.uri": "La bannière doit être une URL valide",
	}),

	contact: Joi.object({
		email: Joi.string().email().optional().messages({
			"string.email": "L'email de contact doit être valide",
		}),
		phone: Joi.string()
			.pattern(/^(\+261|0)[0-9]{9}$/)
			.optional()
			.messages({
				"string.pattern.base": "Le numéro de téléphone doit être un numéro malgache valide",
			}),
		address: Joi.string().max(500).optional().messages({
			"string.max": "L'adresse ne doit pas dépasser 500 caractères",
		}),
	}).optional(),

	categories: Joi.array().items(Joi.string().trim()).max(10).optional().messages({
		"array.max": "Maximum 10 catégories autorisées",
	}),
}).strict();

/**
 * Schéma de validation pour la mise à jour d'une boutique
 * Exclut les champs protégés: status, isActive, commissionRate, stats
 */
export const updateShopSchema = Joi.object({
	name: Joi.string().trim().min(3).max(100).optional().messages({
		"string.min": "Le nom doit contenir au moins 3 caractères",
		"string.max": "Le nom ne doit pas dépasser 100 caractères",
	}),

	description: Joi.string().min(10).max(5000).optional().messages({
		"string.min": "La description doit contenir au moins 10 caractères",
		"string.max": "La description ne doit pas dépasser 5000 caractères",
	}),

	logo: Joi.string().uri().optional().allow(null, "").messages({
		"string.uri": "Le logo doit être une URL valide",
	}),

	banner: Joi.string().uri().optional().allow(null, "").messages({
		"string.uri": "La bannière doit être une URL valide",
	}),

	contact: Joi.object({
		email: Joi.string().email().optional().messages({
			"string.email": "L'email de contact doit être valide",
		}),
		phone: Joi.string()
			.pattern(/^(\+261|0)[0-9]{9}$/)
			.optional()
			.messages({
				"string.pattern.base": "Le numéro de téléphone doit être un numéro malgache valide",
			}),
		address: Joi.string().max(500).optional().messages({
			"string.max": "L'adresse ne doit pas dépasser 500 caractères",
		}),
	}).optional(),

	categories: Joi.array().items(Joi.string().trim()).max(10).optional().messages({
		"array.max": "Maximum 10 catégories autorisées",
	}),
}).strict();

/**
 * Schéma de validation pour les paramètres de liste des boutiques
 */
export const listShopsQuerySchema = Joi.object({
	page: Joi.number().integer().min(1).optional().default(1).messages({
		"number.base": "La page doit être un nombre",
		"number.min": "La page doit être au moins 1",
	}),

	limit: Joi.number().integer().min(1).max(100).optional().default(10).messages({
		"number.base": "La limite doit être un nombre",
		"number.min": "La limite doit être au moins 1",
		"number.max": "La limite ne doit pas dépasser 100",
	}),

	search: Joi.string().trim().optional().messages({
		"string.empty": "La recherche ne doit pas être vide",
	}),

	category: Joi.string().trim().optional().messages({
		"string.empty": "La catégorie ne doit pas être vide",
	}),

	status: Joi.string()
		.valid("DRAFT", "PENDING", "ACTIVE", "REJECTED", "ARCHIVED")
		.optional()
		.messages({
			"any.only": "Le statut doit être DRAFT, PENDING, ACTIVE, REJECTED ou ARCHIVED",
		}),

	sellerId: Joi.string().optional(),

	sort: Joi.alternatives().try(Joi.string(), Joi.object()).optional(),
});

/**
 * Schéma de validation pour la modération admin (Approuver/Rejeter)
 */
export const moderateShopSchema = Joi.object({
	status: Joi.string().valid("ACTIVE", "REJECTED").required().messages({
		"any.only": "Le statut doit être ACTIVE ou REJECTED",
		"any.required": "Le statut de modération est requis",
	}),

	rejectionReason: Joi.string()
		.min(10)
		.max(1000)
		.when("status", {
			is: "REJECTED",
			then: Joi.required(),
			otherwise: Joi.optional().allow(null, ""),
		})
		.messages({
			"string.min": "La raison du rejet doit contenir au moins 10 caractères",
			"string.max": "La raison du rejet ne doit pas dépasser 1000 caractères",
			"any.required": "La raison du rejet est requise pour un rejet",
		}),
}).strict();

/**
 * Schéma de validation pour la mise à jour admin (commissionRate)
 */
export const adminUpdateShopSchema = Joi.object({
	commissionRate: Joi.number().min(0).max(100).optional().messages({
		"number.min": "Le taux de commission doit être au moins 0",
		"number.max": "Le taux de commission ne doit pas dépasser 100",
	}),

	name: Joi.string().trim().min(3).max(100).optional().messages({
		"string.min": "Le nom doit contenir au moins 3 caractères",
		"string.max": "Le nom ne doit pas dépasser 100 caractères",
	}),

	description: Joi.string().min(10).max(5000).optional().messages({
		"string.min": "La description doit contenir au moins 10 caractères",
		"string.max": "La description ne doit pas dépasser 5000 caractères",
	}),

	categories: Joi.array().items(Joi.string().trim()).max(10).optional().messages({
		"array.max": "Maximum 10 catégories autorisées",
	}),
}).strict();
