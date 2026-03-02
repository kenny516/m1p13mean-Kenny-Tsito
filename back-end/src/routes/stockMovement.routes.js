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
router.use(auth, authorize("SELLER", "ADMIN"));

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
	validateQuery(listStockMovementLineQuerySchema),
	stockMovementController.listLines,
);

/**
 * @route   POST /api/stock-movements/reconcile/:productId
 * @desc    Réconcilier le cache stock d'un produit (recalcul depuis les mouvements)
 * @access  Private (SELLER, ADMIN) - SELLER limité à ses produits
 */
router.post("/reconcile/:productId", stockMovementController.reconcile);

/**
 * @route   GET /api/stock-movements/sales
 * @desc    Lister les ventes (mouvements de type SALE)
 * @access  Private (SELLER, ADMIN)
 */
router.get("/sales", validateQuery(listSalesQuerySchema), stockMovementController.listSales);

/**
 * @route   GET /api/stock-movements/orders
 * @desc    Lister les commandes vendeur (SALE + RETURN_CUSTOMER)
 * @access  Private (SELLER)
 */
router.get(
	"/orders",
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
	validateQuery(listSuppliesQuerySchema),
	stockMovementController.listSupplies,
);

/**
 * @route   GET /api/stock-movements/product/:productId/stock
 * @desc    Consulter le stock calculé en temps réel d'un produit
 * @access  Private (SELLER, ADMIN)
 */
router.get("/product/:productId/stock", stockMovementController.getProductStock);

/**
 * @route   GET /api/stock-movements
 * @desc    Lister les mouvements de stock des boutiques du vendeur connecté
 * @access  Private (SELLER)
 */
router.get("/", validateQuery(listStockMovementsQuerySchema), stockMovementController.list);

/**
 * @route   GET /api/stock-movements/:id
 * @desc    Récupérer un mouvement par son ID
 * @access  Private (SELLER, ADMIN)
 */
router.get("/:id", stockMovementController.getOne);

/**
 * @route   POST /api/stock-movements
 * @desc    Créer un nouveau mouvement de stock
 * @access  Private (SELLER)
 */
router.post("/", validate(createStockMovementSchema), stockMovementController.create);

/**
 * @route   PATCH /api/stock-movements/:id/sale-status
 * @desc    Mettre à jour le statut d'une vente
 * @access  Private (SELLER, ADMIN)
 */
router.patch(
	"/:id/sale-status",
	validate(updateSaleStatusSchema),
	stockMovementController.updateSaleStatus,
);

export default router;
