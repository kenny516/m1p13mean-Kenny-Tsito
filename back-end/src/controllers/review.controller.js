import * as reviewService from "../services/review.service.js";

/**
 * Créer un avis pour un produit
 * POST /api/products/:productId/reviews
 */
export const createReview = async (req, res, next) => {
	try {
		const { productId } = req.params;
		const review = await reviewService.createReview(
			productId,
			req.user._id,
			req.body,
		);

		res.status(201).json({
			success: true,
			data: review,
			message: "Avis créé avec succès",
		});
	} catch (error) {
		next(error);
	}
};

/**
 * Récupérer les avis d'un produit
 * GET /api/products/:productId/reviews
 */
export const getProductReviews = async (req, res, next) => {
	try {
		const { productId } = req.params;
		const { page, limit } = req.query;

		const result = await reviewService.getProductReviews(productId, {
			page: parseInt(page) || 1,
			limit: parseInt(limit) || 10,
		});

		res.json({
			success: true,
			data: result.reviews,
			pagination: result.pagination,
		});
	} catch (error) {
		next(error);
	}
};

/**
 * Récupérer les statistiques de rating d'un produit
 * GET /api/products/:productId/reviews/stats
 */
export const getProductRatingStats = async (req, res, next) => {
	try {
		const { productId } = req.params;
		const stats = await reviewService.getProductRatingStats(productId);

		res.json({
			success: true,
			data: stats,
		});
	} catch (error) {
		next(error);
	}
};

/**
 * Modifier son avis
 * PUT /api/reviews/:reviewId
 */
export const updateReview = async (req, res, next) => {
	try {
		const { reviewId } = req.params;
		const review = await reviewService.updateReview(
			reviewId,
			req.user._id,
			req.body,
		);

		res.json({
			success: true,
			data: review,
			message: "Avis modifié avec succès",
		});
	} catch (error) {
		next(error);
	}
};

/**
 * Supprimer son avis
 * DELETE /api/reviews/:reviewId
 */
export const deleteReview = async (req, res, next) => {
	try {
		const { reviewId } = req.params;
		const isAdmin = req.user.role === "ADMIN";
		const result = await reviewService.deleteReview(
			reviewId,
			req.user._id,
			isAdmin,
		);

		res.json({
			success: true,
			message: result.message,
		});
	} catch (error) {
		next(error);
	}
};

/**
 * Ajouter une réponse vendeur à un avis
 * POST /api/reviews/:reviewId/response
 */
export const addSellerResponse = async (req, res, next) => {
	try {
		const { reviewId } = req.params;
		const { comment } = req.body;

		const review = await reviewService.addSellerResponse(
			reviewId,
			req.user._id,
			comment,
		);

		res.json({
			success: true,
			data: review,
			message: "Réponse ajoutée avec succès",
		});
	} catch (error) {
		next(error);
	}
};
