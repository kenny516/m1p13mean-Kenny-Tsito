import mongoose from "mongoose";

/**
 * Modèle Review - Avis et notes des produits
 * Un utilisateur ne peut laisser qu'un seul avis par produit
 * Seuls les acheteurs ayant acheté le produit peuvent laisser un avis
 */
const reviewSchema = new mongoose.Schema(
	{
		productId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Product",
			required: [true, "Le produit est requis"],
		},
		userId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: [true, "L'utilisateur est requis"],
		},
		// Note de 1 à 5
		rating: {
			type: Number,
			required: [true, "La note est requise"],
			min: [1, "La note minimale est 1"],
			max: [5, "La note maximale est 5"],
		},
		// Commentaire optionnel
		comment: {
			type: String,
			trim: true,
			maxlength: [1000, "Le commentaire ne peut pas dépasser 1000 caractères"],
		},
		// Réponse du vendeur (optionnelle)
		sellerResponse: {
			comment: String,
			respondedAt: Date,
		},
		// Statut de l'avis
		isVerifiedPurchase: {
			type: Boolean,
			default: false,
		},
		isVisible: {
			type: Boolean,
			default: true,
		},
	},
	{
		timestamps: true,
	},
);

// Index unique : un utilisateur ne peut noter qu'une fois un produit
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

// Index pour récupérer les avis d'un produit triés par date
reviewSchema.index({ productId: 1, createdAt: -1 });

// Index pour les avis d'un utilisateur
reviewSchema.index({ userId: 1, createdAt: -1 });

/**
 * Méthode statique pour calculer la moyenne des notes d'un produit
 */
reviewSchema.statics.calculateAverageRating = async function (productId) {
	const result = await this.aggregate([
		{
			$match: {
				productId: new mongoose.Types.ObjectId(productId),
				isVisible: true,
			},
		},
		{
			$group: {
				_id: "$productId",
				avgRating: { $avg: "$rating" },
				reviewCount: { $sum: 1 },
			},
		},
	]);

	return result[0] || { avgRating: 0, reviewCount: 0 };
};

export default mongoose.model("Review", reviewSchema);
