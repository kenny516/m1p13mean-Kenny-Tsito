import mongoose from "mongoose";

// ==========================================
// Constantes réutilisables (exportées)
// ==========================================

export const MOVEMENT_TYPES = [
	"SUPPLY",
	"SALE",
	"RETURN_CUSTOMER",
	"RETURN_SUPPLIER",
	"ADJUSTMENT_PLUS",
	"ADJUSTMENT_MINUS",
	"RESERVATION",
	"RESERVATION_CANCEL",
];

export const IN_MOVEMENTS = ["SUPPLY", "RETURN_CUSTOMER", "ADJUSTMENT_PLUS", "RESERVATION_CANCEL"];

export const SALE_STATUSES = ["CONFIRMED", "DELIVERED", "CANCELLED"];

export const PAYMENT_METHODS = ["WALLET", "CARD", "MOBILE_MONEY", "CASH_ON_DELIVERY"];

export const ADJUSTMENT_REASONS = [
	"INVENTORY_COUNT",
	"DAMAGED",
	"LOST",
	"STOLEN",
	"EXPIRED",
	"OTHER",
];

export const REFERENCE_PREFIXES = {
	SUPPLY: "SUP",
	SALE: "SAL",
	RETURN_CUSTOMER: "RTC",
	RETURN_SUPPLIER: "RTS",
	ADJUSTMENT_PLUS: "AJP",
	ADJUSTMENT_MINUS: "AJM",
	RESERVATION: "RES",
	RESERVATION_CANCEL: "REC",
};

export const VALID_SALE_TRANSITIONS = {
	CONFIRMED: ["DELIVERED", "CANCELLED"],
	DELIVERED: [],
	CANCELLED: [],
};

/**
 * Modèle header pour la gestion de stock
 * Les lignes détaillées sont stockées dans StockMovementLine
 */
const stockMovementSchema = new mongoose.Schema(
	{
		// Numéro de référence unique (généré automatiquement)
		reference: {
			type: String,
			unique: true,
			required: true,
		},
		// Type de mouvement
		movementType: {
			type: String,
			enum: MOVEMENT_TYPES,
			required: true,
		},
		// Direction du mouvement (calculé automatiquement)
		direction: {
			type: String,
			enum: ["IN", "OUT"],
			required: true,
		},
		// Coût/Montant total du mouvement (somme des lignes)
		totalAmount: {
			type: Number,
			default: 0,
			min: 0,
		},

		// Lignes associées (dénormalisé)
		lineIds: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "StockMovementLine",
			},
		],

		// Panier lié (réservation ou vente)
		cartId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Cart",
		},

		// ========== INFORMATIONS VENTE (movementType: SALE) ==========
		sale: {
			cartId: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "Cart",
			},
			paymentTransaction: {
				type: mongoose.Schema.Types.ObjectId,
				ref: "WalletTransaction",
			},
			// Adresse de livraison
			deliveryAddress: {
				street: String,
				city: String,
				postalCode: String,
				country: String,
			},
			// Statut de la commande
			status: {
				type: String,
				enum: SALE_STATUSES,
				default: "CONFIRMED",
			},
			paymentMethod: {
				type: String,
				enum: PAYMENT_METHODS,
			},
			// Dates importantes
			confirmedAt: Date,
			deliveredAt: Date,
			cancelledAt: Date,
		},

		// ========== INFORMATIONS APPROVISIONNEMENT (movementType: SUPPLY) ==========
		supply: {
			supplier: {
				name: String,
				contact: String,
			},
			invoiceNumber: String,
			notes: String,
		},

		// ========== INFORMATIONS AJUSTEMENT ==========
		adjustment: {
			reason: {
				type: String,
				enum: ADJUSTMENT_REASONS,
			},
			notes: String,
		},

		// Utilisateur ayant effectué le mouvement
		performedBy: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		},

		// Notes générales
		note: String,

		// Date métier
		date: Date,
	},
	{ timestamps: true },
);

// Index pour performance
stockMovementSchema.index({ movementType: 1, createdAt: -1 });
stockMovementSchema.index({ performedBy: 1, createdAt: -1 });
stockMovementSchema.index({ cartId: 1, createdAt: -1 });
stockMovementSchema.index({ "sale.cartId": 1, createdAt: -1 });
stockMovementSchema.index({ "sale.status": 1 });

// Génération automatique de la référence et direction
stockMovementSchema.pre("validate", function () {
	// Générer la référence si non définie
	if (!this.reference) {
		const date = new Date();
		const year = date.getFullYear().toString().slice(-2);
		const month = (date.getMonth() + 1).toString().padStart(2, "0");
		const day = date.getDate().toString().padStart(2, "0");

		const prefix = REFERENCE_PREFIXES[this.movementType] || "MOV";
		const random = Math.random().toString(36).substring(2, 8).toUpperCase();
		this.reference = `${prefix}-${year}${month}${day}-${random}`;
	}

	// Déterminer automatiquement la direction selon le type
	this.direction = IN_MOVEMENTS.includes(this.movementType) ? "IN" : "OUT";
});

export default mongoose.model("StockMovement", stockMovementSchema);
