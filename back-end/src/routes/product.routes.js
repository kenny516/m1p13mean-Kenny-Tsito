import { Router } from "express";
import * as productController from "../controllers/product.controller.js";
import * as reviewController from "../controllers/review.controller.js";
import { auth, authorize } from "../middlewares/auth.middleware.js";
import { validate, validateQuery } from "../middlewares/validate.middleware.js";
import {
	createProductSchema,
	updateProductSchema,
	listProductsQuerySchema,
	updateStockSchema,
	productImageIndexParamsSchema,
} from "../validations/product.validation.js";
import {
	createReviewSchema,
	updateReviewSchema,
	sellerResponseSchema,
} from "../validations/review.validation.js";
import {
	uploadProductImages,
	parseJsonFields,
} from "../middlewares/upload.middleware.js";

const router = Router();

/**
 * @route   GET /api/products
 * @desc    Lister les produits avec filtres et pagination
 * @access  Public
 */
router.get("/", validateQuery(listProductsQuerySchema), productController.list);

/**
 * @route   GET /api/products/my-products
 * @desc    Lister les produits du vendeur connecté
 * @access  Private (SELLER)
 */
router.get(
	"/my-products",
	auth,
	authorize("SELLER"),
	validateQuery(listProductsQuerySchema),
	productController.listMyProducts,
);

/**
 * @route   GET /api/products/:id
 * @desc    Récupérer un produit par son ID
 * @access  Public
 */
router.get("/:id", productController.getOne);

/**
 * @route   POST /api/products
 * @desc    Créer un nouveau produit
 * @access  Private (SELLER)
 */
router.post(
	"/",
	auth,
	authorize("SELLER"),
	uploadProductImages,
	parseJsonFields(["tags", "characteristics", "stock"]),
	validate(createProductSchema),
	productController.create,
);

/**
 * @route   PUT /api/products/:id
 * @desc    Mettre à jour un produit
 * @access  Private (SELLER, ADMIN)
 */
router.put(
	"/:id",
	auth,
	authorize("SELLER", "ADMIN"),
	uploadProductImages,
	parseJsonFields(["tags", "characteristics", "stock"]),
	validate(updateProductSchema),
	productController.update,
);

/**
 * @route   POST /api/products/:id/images
 * @desc    Ajouter des images à un produit existant
 * @access  Private (SELLER, ADMIN)
 */
router.post(
	"/:id/images",
	auth,
	authorize("SELLER", "ADMIN"),
	uploadProductImages,
	productController.addImages,
);

/**
 * @route   DELETE /api/products/:id/image/:index
 * @desc    Supprimer une image produit par index
 * @access  Private (SELLER, ADMIN)
 */
router.delete(
	"/:id/image/:index",
	auth,
	authorize("SELLER", "ADMIN"),
	validate(productImageIndexParamsSchema, "params"),
	productController.deleteImageByIndex,
);

/**
 * @route   DELETE /api/products/:id
 * @desc    Supprimer un produit
 * @access  Private (SELLER, ADMIN)
 */
router.delete("/:id", auth, authorize("SELLER", "ADMIN"), productController.remove);

// ==========================================
// Routes Reviews (Avis)
// ==========================================

/**
 * @route   GET /api/products/:productId/reviews
 * @desc    Récupérer les avis d'un produit
 * @access  Public
 */
router.get("/:productId/reviews", reviewController.getProductReviews);

/**
 * @route   GET /api/products/:productId/reviews/stats
 * @desc    Récupérer les statistiques de rating d'un produit
 * @access  Public
 */
router.get("/:productId/reviews/stats", reviewController.getProductRatingStats);

/**
 * @route   POST /api/products/:productId/reviews
 * @desc    Créer un avis pour un produit
 * @access  Private (BUYER)
 */
router.post(
	"/:productId/reviews",
	auth,
	authorize("BUYER"),
	validate(createReviewSchema),
	reviewController.createReview,
);

export default router;
