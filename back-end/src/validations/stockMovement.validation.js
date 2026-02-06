import Joi from "joi";
import {
	MOVEMENT_TYPES,
	SALE_STATUSES,
	PAYMENT_METHODS,
	ADJUSTMENT_REASONS,
} from "../models/StockMovement.js";

// ==========================================
// Helpers réutilisables
// ==========================================

const objectId = Joi.string()
	.pattern(/^[0-9a-fA-F]{24}$/)
	.message("ID MongoDB invalide");

// ==========================================
// Sous-schémas conditionnels
// ==========================================

const saleSchema = Joi.object({
	buyerId: objectId.required().messages({
		"any.required": "L'identifiant de l'acheteur est requis pour une vente",
	}),
	productSnapshot: Joi.object({
		title: Joi.string().required(),
		sku: Joi.string().allow(null, ""),
		price: Joi.number().min(0).required(),
		originalPrice: Joi.number().min(0).allow(null),
		images: Joi.array().items(Joi.string()).default([]),
	})
		.required()
		.messages({
			"any.required": "Le snapshot produit est requis pour une vente",
		}),
	deliveryAddress: Joi.object({
		street: Joi.string().required(),
		city: Joi.string().required(),
		postalCode: Joi.string().allow(""),
		country: Joi.string().default("Madagascar"),
	})
		.required()
		.messages({
			"any.required": "L'adresse de livraison est requise pour une vente",
		}),
	paymentMethod: Joi.string()
		.valid(...PAYMENT_METHODS)
		.required()
		.messages({
			"any.required": "La méthode de paiement est requise",
			"any.only": `Méthode de paiement invalide. Valeurs acceptées : ${PAYMENT_METHODS.join(", ")}`,
		}),
}).strict();

const supplySchema = Joi.object({
	supplier: Joi.object({
		name: Joi.string().required().messages({
			"any.required": "Le nom du fournisseur est requis",
		}),
		contact: Joi.string().allow(""),
	}).required(),
	invoiceNumber: Joi.string().allow(""),
	costPerUnit: Joi.number().min(0).required().messages({
		"any.required": "Le coût unitaire est requis pour un approvisionnement",
	}),
	notes: Joi.string().allow(""),
}).strict();

const adjustmentSchema = Joi.object({
	reason: Joi.string()
		.valid(...ADJUSTMENT_REASONS)
		.required()
		.messages({
			"any.required": "La raison de l'ajustement est requise",
			"any.only": `Raison invalide. Valeurs acceptées : ${ADJUSTMENT_REASONS.join(", ")}`,
		}),
	notes: Joi.string().allow(""),
}).strict();

const reservationSchema = Joi.object({
	cartId: objectId.required().messages({
		"any.required": "L'identifiant du panier est requis pour une réservation",
	}),
	expiresAt: Joi.date().iso().greater("now").required().messages({
		"any.required": "La date d'expiration est requise pour une réservation",
		"date.greater": "La date d'expiration doit être dans le futur",
	}),
}).strict();

const transferSchema = Joi.object({
	fromShopId: objectId.required().messages({
		"any.required": "La boutique source est requise pour un transfert",
	}),
	toShopId: objectId.required().messages({
		"any.required": "La boutique destination est requise pour un transfert",
	}),
	transferReference: Joi.string().allow(""),
}).strict();

// ==========================================
// Schéma de création de mouvement de stock
// ==========================================

export const createStockMovementSchema = Joi.object({
	productId: objectId.required().messages({
		"any.required": "L'identifiant du produit est requis",
	}),
	shopId: objectId.required().messages({
		"any.required": "L'identifiant de la boutique est requis",
	}),
	movementType: Joi.string()
		.valid(...MOVEMENT_TYPES)
		.required()
		.messages({
			"any.required": "Le type de mouvement est requis",
			"any.only": `Type de mouvement invalide. Valeurs acceptées : ${MOVEMENT_TYPES.join(", ")}`,
		}),
	quantity: Joi.number().integer().min(1).required().messages({
		"any.required": "La quantité est requise",
		"number.min": "La quantité doit être au minimum 1",
		"number.integer": "La quantité doit être un nombre entier",
	}),
	unitPrice: Joi.number().min(0).default(0).messages({
		"number.min": "Le prix unitaire ne peut pas être négatif",
	}),
	notes: Joi.string().max(1000).allow(""),
	groupId: Joi.string().allow(""),

	// Sous-objets conditionnels selon movementType
	sale: Joi.when("movementType", {
		is: "SALE",
		then: saleSchema.required(),
		otherwise: Joi.forbidden(),
	}),
	supply: Joi.when("movementType", {
		is: "SUPPLY",
		then: supplySchema.required(),
		otherwise: Joi.forbidden(),
	}),
	adjustment: Joi.when("movementType", {
		is: Joi.valid("ADJUSTMENT_PLUS", "ADJUSTMENT_MINUS"),
		then: adjustmentSchema.required(),
		otherwise: Joi.forbidden(),
	}),
	reservation: Joi.when("movementType", {
		is: Joi.valid("RESERVATION", "RESERVATION_CANCEL"),
		then: reservationSchema.required(),
		otherwise: Joi.forbidden(),
	}),
	transfer: Joi.when("movementType", {
		is: Joi.valid("TRANSFER_IN", "TRANSFER_OUT"),
		then: transferSchema.required(),
		otherwise: Joi.forbidden(),
	}),
}).strict();

// ==========================================
// Schéma de mise à jour du statut de vente
// ==========================================

export const updateSaleStatusSchema = Joi.object({
	status: Joi.string()
		.valid(...SALE_STATUSES)
		.required()
		.messages({
			"any.required": "Le nouveau statut est requis",
			"any.only": `Statut invalide. Valeurs acceptées : ${SALE_STATUSES.join(", ")}`,
		}),
	trackingNumber: Joi.when("status", {
		is: "SHIPPED",
		then: Joi.string().required().messages({
			"any.required": "Le numéro de suivi est requis lors de l'expédition",
		}),
		otherwise: Joi.string().allow(""),
	}),
	notes: Joi.string().max(500).allow(""),
}).strict();

// ==========================================
// Schéma de filtrage / liste des mouvements
// ==========================================

export const listStockMovementsQuerySchema = Joi.object({
	page: Joi.number().integer().min(1).default(1),
	limit: Joi.number().integer().min(1).max(100).default(10),
	productId: objectId,
	shopId: objectId,
	movementType: Joi.string().valid(...MOVEMENT_TYPES),
	direction: Joi.string().valid("IN", "OUT"),
	startDate: Joi.date().iso(),
	endDate: Joi.date().iso().min(Joi.ref("startDate")),
	groupId: Joi.string(),
	sort: Joi.string()
		.pattern(/^[a-zA-Z]+_(asc|desc)$/)
		.default("createdAt_desc")
		.messages({
			"string.pattern.base": "Le tri doit être au format champ_asc ou champ_desc",
		}),
});

// ==========================================
// Schéma de filtrage des ventes
// ==========================================

export const listSalesQuerySchema = Joi.object({
	page: Joi.number().integer().min(1).default(1),
	limit: Joi.number().integer().min(1).max(100).default(10),
	shopId: objectId,
	buyerId: objectId,
	status: Joi.string().valid(...SALE_STATUSES),
	startDate: Joi.date().iso(),
	endDate: Joi.date().iso().min(Joi.ref("startDate")),
	sort: Joi.string()
		.pattern(/^[a-zA-Z]+_(asc|desc)$/)
		.default("createdAt_desc")
		.messages({
			"string.pattern.base": "Le tri doit être au format champ_asc ou champ_desc",
		}),
});

// ==========================================
// Schéma de filtrage des approvisionnements
// ==========================================

export const listSuppliesQuerySchema = Joi.object({
	page: Joi.number().integer().min(1).default(1),
	limit: Joi.number().integer().min(1).max(100).default(10),
	shopId: objectId,
	startDate: Joi.date().iso(),
	endDate: Joi.date().iso().min(Joi.ref("startDate")),
	sort: Joi.string()
		.pattern(/^[a-zA-Z]+_(asc|desc)$/)
		.default("createdAt_desc")
		.messages({
			"string.pattern.base": "Le tri doit être au format champ_asc ou champ_desc",
		}),
});
