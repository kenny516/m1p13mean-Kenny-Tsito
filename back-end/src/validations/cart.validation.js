import Joi from "joi";
import { PAYMENT_METHODS } from "../models/StockMovement.js";

const objectId = Joi.string()
	.pattern(/^[0-9a-fA-F]{24}$/)
	.message("ID MongoDB invalide");

export const addCartItemSchema = Joi.object({
	productId: objectId.required().messages({
		"any.required": "L'identifiant du produit est requis",
	}),
	quantity: Joi.number().integer().min(1).required().messages({
		"any.required": "La quantité est requise",
		"number.integer": "La quantité doit être un nombre entier",
		"number.min": "La quantité doit être au minimum 1",
	}),
}).strict();

export const updateCartItemSchema = Joi.object({
	quantity: Joi.number().integer().min(1).required().messages({
		"any.required": "La quantité est requise",
		"number.integer": "La quantité doit être un nombre entier",
		"number.min": "La quantité doit être au minimum 1",
	}),
}).strict();

export const checkoutCartSchema = Joi.object({
	deliveryAddress: Joi.object({
		street: Joi.string().required().messages({
			"any.required": "La rue est requise",
		}),
		city: Joi.string().required().messages({
			"any.required": "La ville est requise",
		}),
		postalCode: Joi.string().allow(""),
		country: Joi.string().default("Madagascar"),
	}).required(),
	paymentMethod: Joi.string()
		.valid(...PAYMENT_METHODS)
		.required()
		.messages({
			"any.required": "La méthode de paiement est requise",
			"any.only": `Méthode de paiement invalide. Valeurs acceptées : ${PAYMENT_METHODS.join(", ")}`,
		}),
	notes: Joi.string().max(500).allow(""),
}).strict();

export const returnOrderSchema = Joi.object({
	note: Joi.string().max(500).allow(""),
}).strict();
