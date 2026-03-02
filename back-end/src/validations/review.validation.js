import Joi from "joi";

/**
 * Schéma de validation pour créer un avis
 */
export const createReviewSchema = Joi.object({
	rating: Joi.number().integer().min(1).max(5).required().messages({
		"number.base": "La note doit être un nombre",
		"number.min": "La note minimale est 1",
		"number.max": "La note maximale est 5",
		"any.required": "La note est requise",
	}),
	comment: Joi.string().max(1000).allow("", null).messages({
		"string.max": "Le commentaire ne peut pas dépasser 1000 caractères",
	}),
});

/**
 * Schéma de validation pour modifier un avis
 */
export const updateReviewSchema = Joi.object({
	rating: Joi.number().integer().min(1).max(5).messages({
		"number.base": "La note doit être un nombre",
		"number.min": "La note minimale est 1",
		"number.max": "La note maximale est 5",
	}),
	comment: Joi.string().max(1000).allow("", null).messages({
		"string.max": "Le commentaire ne peut pas dépasser 1000 caractères",
	}),
})
	.min(1)
	.messages({
		"object.min": "Au moins un champ doit être modifié",
	});

/**
 * Schéma de validation pour la réponse vendeur
 */
export const sellerResponseSchema = Joi.object({
	comment: Joi.string().max(500).required().messages({
		"string.max": "La réponse ne peut pas dépasser 500 caractères",
		"any.required": "La réponse est requise",
	}),
});
