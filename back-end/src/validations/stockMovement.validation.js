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
	cartId: objectId.required().messages({
		"any.required": "L'identifiant du panier est requis pour une vente",
	}),
	paymentTransaction: objectId.allow(null),
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
	status: Joi.string()
		.valid(...SALE_STATUSES)
		.optional(),
});

const supplySchema = Joi.object({
	supplier: Joi.object({
		name: Joi.string().required().messages({
			"any.required": "Le nom du fournisseur est requis",
		}),
		contact: Joi.string().allow(""),
	}).required(),
	invoiceNumber: Joi.string().allow(""),
	notes: Joi.string().allow(""),
});

const adjustmentSchema = Joi.object({
	reason: Joi.string()
		.valid(...ADJUSTMENT_REASONS)
		.required()
		.messages({
			"any.required": "La raison de l'ajustement est requise",
			"any.only": `Raison invalide. Valeurs acceptées : ${ADJUSTMENT_REASONS.join(", ")}`,
		}),
	notes: Joi.string().allow(""),
});

// ==========================================
// Schéma de création de mouvement de stock
// ==========================================

export const createStockMovementSchema = Joi.object({
	movementType: Joi.string()
		.valid(...MOVEMENT_TYPES)
		.required()
		.messages({
			"any.required": "Le type de mouvement est requis",
			"any.only": `Type de mouvement invalide. Valeurs acceptées : ${MOVEMENT_TYPES.join(", ")}`,
		}),
	date: Joi.date().iso().required().messages({
		"any.required": "La date est requise",
	}),
	note: Joi.string().max(1000).allow(""),
	shopId: objectId.optional(),
	cartId: Joi.when("movementType", {
		is: Joi.valid("RESERVATION", "RESERVATION_CANCEL"),
		then: objectId.required().messages({
			"any.required": "L'identifiant du panier est requis",
		}),
		otherwise: Joi.forbidden(),
	}),
	items: Joi.array()
		.min(1)
		.items(
			Joi.object({
				productId: objectId.required().messages({
					"any.required": "L'identifiant du produit est requis",
				}),
				quantity: Joi.number().integer().min(1).required().messages({
					"any.required": "La quantité est requise",
					"number.min": "La quantité doit être au minimum 1",
					"number.integer": "La quantité doit être un nombre entier",
				}),
				unitPrice: Joi.number().min(0).required().messages({
					"any.required": "Le prix unitaire est requis",
					"number.min": "Le prix unitaire ne peut pas être négatif",
				}),
				shopId: objectId.optional(),
				cartId: objectId.optional(),
				date: Joi.date().iso().optional(),
			}),
		)
		.required(),

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
});

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
	sort: Joi.string()
		.pattern(/^[a-zA-Z0-9.]+_(asc|desc)$/)
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
	status: Joi.string().valid(...SALE_STATUSES),
	startDate: Joi.date().iso(),
	endDate: Joi.date().iso().min(Joi.ref("startDate")),
	sort: Joi.string()
		.pattern(/^[a-zA-Z0-9.]+_(asc|desc)$/)
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
		.pattern(/^[a-zA-Z0-9.]+_(asc|desc)$/)
		.default("createdAt_desc")
		.messages({
			"string.pattern.base": "Le tri doit être au format champ_asc ou champ_desc",
		}),
});

	// ==========================================
	// Schéma dashboard vendeur
	// ==========================================

	export const sellerDashboardSummaryQuerySchema = Joi.object({
		startDate: Joi.date().iso(),
		endDate: Joi.date().iso().min(Joi.ref("startDate")),
		groupBy: Joi.string().valid("day", "week", "month").default("day"),
		shopId: objectId,
		topLimit: Joi.number().integer().min(3).max(20).default(5),
	});
