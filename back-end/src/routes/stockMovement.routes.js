import { Router } from "express";
import * as stockMovementController from "../controllers/stockMovement.controller.js";
import { auth, authorize } from "../middlewares/auth.middleware.js";
import { validate, validateQuery } from "../middlewares/validate.middleware.js";
import {
	createStockMovementSchema,
	updateSaleStatusSchema,
	listStockMovementsQuerySchema,
	listSalesQuerySchema,
	listSuppliesQuerySchema,
} from "../validations/stockMovement.validation.js";
import { listStockMovementLineQuerySchema } from "../validations/stockMovementLine.validation.js";

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(auth);

// ==========================================
// Routes vendeur
// ==========================================

/**
 * @route   GET /api/stock-movements/lines
 * @desc    Lister les lignes de mouvement de stock
 * @access  Private (SELLER, ADMIN)
 */
router.get(
	"/lines",
	authorize("SELLER", "ADMIN"),
	validateQuery(listStockMovementLineQuerySchema),
	stockMovementController.listLines,
);

/**
 * @route   GET /api/stock-movements/sales
 * @desc    Lister les ventes (mouvements de type SALE)
 * @access  Private (SELLER, ADMIN)
 */
router.get(
	"/sales",
	authorize("SELLER", "ADMIN"),
	validateQuery(listSalesQuerySchema),
	stockMovementController.listSales,
);

/**
 * @route   GET /api/stock-movements/orders
 * @desc    Lister les commandes vendeur (SALE + RETURN_CUSTOMER)
 * @access  Private (SELLER)
 */
router.get(
	"/orders",
	authorize("SELLER"),
	validateQuery(listSalesQuerySchema),
	stockMovementController.listSellerOrders,
);

/**
 * @route   GET /api/stock-movements/supplies
 * @desc    Lister les approvisionnements (mouvements de type SUPPLY)
 * @access  Private (SELLER, ADMIN)
 */
router.get(
	"/supplies",
	authorize("SELLER", "ADMIN"),
	validateQuery(listSuppliesQuerySchema),
	stockMovementController.listSupplies,
);

/**
 * @route   GET /api/stock-movements/product/:productId/stock
 * @desc    Consulter le stock calculé en temps réel d'un produit
 * @access  Private (SELLER, ADMIN)
 */
router.get(
	"/product/:productId/stock",
	authorize("SELLER", "ADMIN"),
	stockMovementController.getProductStock,
);

/**
 * @route   GET /api/stock-movements
 * @desc    Lister les mouvements de stock des boutiques du vendeur connecté
 * @access  Private (SELLER)
 */
router.get(
	"/",
	authorize("SELLER"),
	validateQuery(listStockMovementsQuerySchema),
	stockMovementController.list,
);

/**
 * @route   GET /api/stock-movements/:id
 * @desc    Récupérer un mouvement par son ID
 * @access  Private (SELLER, ADMIN)
 */
router.get("/:id", authorize("SELLER", "ADMIN"), stockMovementController.getOne);

/**
 * @route   POST /api/stock-movements
 * @desc    Créer un nouveau mouvement de stock
 * @access  Private (SELLER)
 */
router.post(
	"/",
	authorize("SELLER"),
	validate(createStockMovementSchema),
	stockMovementController.create,
);

/**
 * @route   PATCH /api/stock-movements/:id/sale-status
 * @desc    Mettre à jour le statut d'une vente
 * @access  Private (SELLER, ADMIN)
 */
router.patch(
	"/:id/sale-status",
	authorize("SELLER", "ADMIN"),
	validate(updateSaleStatusSchema),
	stockMovementController.updateSaleStatus,
);

export default router;
