import Review from "../models/Review.js";
import Product from "../models/Product.js";
import StockMovementLine from "../models/StockMovementLine.js";
import StockMovement from "../models/StockMovement.js";
import { ApiError } from "../middlewares/error.middleware.js";
import mongoose from "mongoose";

/**
 * Vérifie si l'utilisateur a acheté le produit (vente livrée)
 */
export const hasUserPurchasedProduct = async (userId, productId) => {
	// Récupérer les mouvements de vente DELIVERED de l'utilisateur
	const deliveredSales = await StockMovement.find({
		movementType: "SALE",
		"sale.buyerId": userId,
		"sale.status": "DELIVERED",
	}).select("_id");

	if (deliveredSales.length === 0) {
		return false;
	}

	const moveIds = deliveredSales.map((s) => s._id);

	// Vérifier si le produit est dans les lignes de ces ventes
	const line = await StockMovementLine.findOne({
		moveId: { $in: moveIds },
		productId: productId,
	});

	return !!line;
};

/**
 * Créer un nouvel avis
 */
export const createReview = async (productId, userId, reviewData) => {
	// Vérifier que le produit existe
	const product = await Product.findById(productId);
	if (!product) {
		throw new ApiError(404, "NOT_FOUND", "Produit non trouvé");
	}

	// Vérifier si l'utilisateur a déjà laissé un avis
	const existingReview = await Review.findOne({ productId, userId });
	if (existingReview) {
		throw new ApiError(
			409,
			"ALREADY_REVIEWED",
			"Vous avez déjà laissé un avis pour ce produit",
		);
	}

	// Vérifier si l'utilisateur a acheté le produit
	const hasPurchased = await hasUserPurchasedProduct(userId, productId);

	// Créer l'avis
	const review = await Review.create({
		productId,
		userId,
		rating: reviewData.rating,
		comment: reviewData.comment,
		isVerifiedPurchase: hasPurchased,
	});

	// Recalculer la moyenne du produit
	await updateProductRating(productId);

	return review;
};

/**
 * Récupérer les avis d'un produit avec pagination
 */
export const getProductReviews = async (productId, options = {}) => {
	const { page = 1, limit = 10 } = options;
	const skip = (page - 1) * limit;

	const [reviews, total] = await Promise.all([
		Review.find({ productId, isVisible: true })
			.populate("userId", "profile.firstName profile.lastName")
			.sort({ createdAt: -1 })
			.skip(skip)
			.limit(limit)
			.lean(),
		Review.countDocuments({ productId, isVisible: true }),
	]);

	return {
		reviews,
		pagination: {
			page,
			limit,
			total,
			pages: Math.ceil(total / limit),
		},
	};
};

/**
 * Récupérer un avis par ID
 */
export const getReviewById = async (reviewId) => {
	const review = await Review.findById(reviewId)
		.populate("userId", "profile.name")
		.populate("productId", "title images");

	if (!review) {
		throw new ApiError(404, "NOT_FOUND", "Avis non trouvé");
	}

	return review;
};

/**
 * Modifier un avis (par son auteur)
 */
export const updateReview = async (reviewId, userId, updateData) => {
	const review = await Review.findById(reviewId);

	if (!review) {
		throw new ApiError(404, "NOT_FOUND", "Avis non trouvé");
	}

	if (review.userId.toString() !== userId.toString()) {
		throw new ApiError(403, "FORBIDDEN", "Vous ne pouvez pas modifier cet avis");
	}

	// Mise à jour autorisée: rating et comment
	if (updateData.rating !== undefined) {
		review.rating = updateData.rating;
	}
	if (updateData.comment !== undefined) {
		review.comment = updateData.comment;
	}

	await review.save();

	// Recalculer la moyenne du produit
	await updateProductRating(review.productId);

	return review;
};

/**
 * Supprimer un avis (par son auteur ou admin)
 */
export const deleteReview = async (reviewId, userId, isAdmin = false) => {
	const review = await Review.findById(reviewId);

	if (!review) {
		throw new ApiError(404, "NOT_FOUND", "Avis non trouvé");
	}

	if (!isAdmin && review.userId.toString() !== userId.toString()) {
		throw new ApiError(
			403,
			"FORBIDDEN",
			"Vous ne pouvez pas supprimer cet avis",
		);
	}

	const productId = review.productId;
	await Review.findByIdAndDelete(reviewId);

	// Recalculer la moyenne du produit
	await updateProductRating(productId);

	return { message: "Avis supprimé avec succès" };
};

/**
 * Ajouter une réponse du vendeur à un avis
 */
export const addSellerResponse = async (reviewId, sellerId, comment) => {
	const review = await Review.findById(reviewId).populate("productId");

	if (!review) {
		throw new ApiError(404, "NOT_FOUND", "Avis non trouvé");
	}

	// Vérifier que le vendeur est bien le propriétaire du produit
	if (review.productId.sellerId.toString() !== sellerId.toString()) {
		throw new ApiError(
			403,
			"FORBIDDEN",
			"Vous n'êtes pas autorisé à répondre à cet avis",
		);
	}

	review.sellerResponse = {
		comment,
		respondedAt: new Date(),
	};

	await review.save();
	return review;
};

/**
 * Mettre à jour les stats rating du produit
 */
export const updateProductRating = async (productId) => {
	const stats = await Review.calculateAverageRating(productId);

	await Product.findByIdAndUpdate(productId, {
		"stats.rating": Math.round(stats.avgRating * 10) / 10,
		"stats.reviewCount": stats.reviewCount,
	});
};

/**
 * Récupérer les statistiques de rating d'un produit
 */
export const getProductRatingStats = async (productId) => {
	const stats = await Review.aggregate([
		{
			$match: {
				productId: new mongoose.Types.ObjectId(productId),
				isVisible: true,
			},
		},
		{
			$group: {
				_id: "$rating",
				count: { $sum: 1 },
			},
		},
		{ $sort: { _id: -1 } },
	]);

	// Construire la distribution
	const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
	stats.forEach((s) => {
		distribution[s._id] = s.count;
	});

	const total = Object.values(distribution).reduce((a, b) => a + b, 0);
	const average =
		total > 0
			? Object.entries(distribution).reduce(
					(sum, [rating, count]) => sum + parseInt(rating) * count,
					0,
				) / total
			: 0;

	return {
		average: Math.round(average * 10) / 10,
		total,
		distribution,
	};
};
