import { Router } from "express";
import * as productController from "../controllers/product.controller.js";
import { auth, authorize } from "../middlewares/auth.middleware.js";
import { validate, validateQuery } from "../middlewares/validate.middleware.js";
import {
	createProductSchema,
	updateProductSchema,
	listProductsQuerySchema,
	updateStockSchema,
	reserveStockSchema,
} from "../validations/product.validation.js";

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
	validate(updateProductSchema),
	productController.update,
);

/**
 * @route   DELETE /api/products/:id
 * @desc    Supprimer un produit
 * @access  Private (SELLER, ADMIN)
 */
router.delete("/:id", auth, authorize("SELLER", "ADMIN"), productController.remove);

/**
 * @route   PUT /api/products/:id/stock
 * @desc    Mettre à jour le stock (Ajout/Retrait/Définition)
 * @access  Private (SELLER, ADMIN)
 */
router.put(
	"/:id/stock",
	auth,
	authorize("SELLER", "ADMIN"),
	validate(updateStockSchema),
	productController.updateStock,
);

export default router;
