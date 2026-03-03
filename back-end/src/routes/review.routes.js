import { Router } from "express";
import * as reviewController from "../controllers/review.controller.js";
import { auth, authorize } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
	updateReviewSchema,
	sellerResponseSchema,
} from "../validations/review.validation.js";

const router = Router();

/**
 * @route   PUT /api/reviews/:reviewId
 * @desc    Modifier son avis
 * @access  Private (BUYER)
 */
router.put(
	"/:reviewId",
	auth,
	authorize("BUYER"),
	validate(updateReviewSchema),
	reviewController.updateReview,
);

/**
 * @route   DELETE /api/reviews/:reviewId
 * @desc    Supprimer son avis
 * @access  Private (BUYER, ADMIN)
 */
router.delete(
	"/:reviewId",
	auth,
	authorize("BUYER", "ADMIN"),
	reviewController.deleteReview,
);

/**
 * @route   POST /api/reviews/:reviewId/response
 * @desc    Ajouter une réponse vendeur à un avis
 * @access  Private (SELLER)
 */
router.post(
	"/:reviewId/response",
	auth,
	authorize("SELLER"),
	validate(sellerResponseSchema),
	reviewController.addSellerResponse,
);

export default router;
