import mongoose from "mongoose";

/**
 * Modèle Panier avec TTL
 * Les paniers expirent automatiquement après un certain temps
 */
const cartItemSchema = new mongoose.Schema(
	{
		productId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Product",
			required: true,
		},
		shopId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Shop",
			required: true,
		},
		// Snapshot du produit au moment de l'ajout
		productSnapshot: {
			title: { type: String, required: true },
			description: { type: String, required: true },
			images: { type: [String], default: [] },
			unitPrice: { type: Number, required: true, min: 0 },
		},
		quantity: {
			type: Number,
			required: true,
			min: 1,
		},
		totalAmount: {
			type: Number,
			required: true,
			min: 0,
		},
	},
	{ _id: true },
);

const cartSchema = new mongoose.Schema(
	{
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		status: {
			type: String,
			enum: ["CART", "ORDER", "EXPIRED", "RETURNED", "DELIVERED"],
			default: "CART",
		},
		order: { reference: String, paymentTransaction: String, paymentMethod: String, saleId: String },
		items: [cartItemSchema],
		totalAmount: {
			type: Number,
			required: true,
			default: 0,
			min: 0,
		},
		// Date d'expiration du panier
		expiresAt: {
			type: Date,
			required: true,
			default: () => new Date(Date.now() + 30 * 60 * 1000), // 30 minutes par défaut
		},
	},
	{ timestamps: true },
);

// Index pour l'utilisateur
cartSchema.index({ userId: 1 });
// TTL index pour supprimer automatiquement les paniers expirés
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("Cart", cartSchema);
