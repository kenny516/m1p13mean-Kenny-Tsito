import Joi from "joi";
import { MOVEMENT_TYPES } from "../models/StockMovement.js";

const objectId = Joi.string()
	.pattern(/^[0-9a-fA-F]{24}$/)
	.message("ID MongoDB invalide");

export const createStockMovementLineSchema = Joi.object({
	movementType: Joi.string()
		.valid(...MOVEMENT_TYPES)
		.required()
		.messages({
			"any.required": "Le type de mouvement est requis",
			"any.only": `Type de mouvement invalide. Valeurs acceptées : ${MOVEMENT_TYPES.join(", ")}`,
		}),
	direction: Joi.string().valid("IN", "OUT").required().messages({
		"any.required": "La direction est requise",
		"any.only": "La direction doit être IN ou OUT",
	}),
	date: Joi.date().iso().required().messages({
		"any.required": "La date est requise",
	}),
	cartId: Joi.when("movementType", {
		is: Joi.valid("RESERVATION", "RESERVATION_CANCEL"),
		then: objectId.required().messages({
			"any.required": "L'identifiant du panier est requis",
		}),
		otherwise: objectId.optional(),
	}),
	moveId: objectId.optional(),
	productId: objectId.required().messages({
		"any.required": "L'identifiant du produit est requis",
	}),
	shopId: objectId.required().messages({
		"any.required": "L'identifiant de la boutique est requis",
	}),
	quantity: Joi.number().integer().min(1).required().messages({
		"any.required": "La quantité est requise",
		"number.base": "La quantité doit être un nombre",
		"number.integer": "La quantité doit être un entier",
		"number.min": "La quantité doit être au moins 1",
	}),
	unitPrice: Joi.number().min(0).required().messages({
		"any.required": "Le prix unitaire est requis",
		"number.base": "Le prix unitaire doit être un nombre",
		"number.min": "Le prix unitaire ne peut pas être négatif",
	}),
	totalAmount: Joi.number().min(0).required().messages({
		"any.required": "Le montant total est requis",
		"number.base": "Le montant total doit être un nombre",
		"number.min": "Le montant total ne peut pas être négatif",
	}),
}).strict();

export const updateStockMovementLineSchema = Joi.object({
	quantity: Joi.number().integer().min(1).optional(),
	unitPrice: Joi.number().min(0).optional(),
	date: Joi.date().iso().optional(),
	performedBy: objectId.optional(),
}).strict();

export const deleteStockMovementLineSchema = Joi.object({
	moveReference: Joi.string().optional(),
	moveLineReference: Joi.string().optional(),
	_id: objectId.optional(),
	moveId: objectId.optional(),
	ids: Joi.array().items(objectId).optional(),
}).strict();

export const listStockMovementLineQuerySchema = Joi.object({
	page: Joi.number().integer().min(1).default(1),
	limit: Joi.number().integer().min(1).max(100).default(10),
	movementType: Joi.string().valid(...MOVEMENT_TYPES),
	productId: objectId,
	shopId: objectId,
	startDate: Joi.date().iso(),
	endDate: Joi.date().iso().min(Joi.ref("startDate")),
});
