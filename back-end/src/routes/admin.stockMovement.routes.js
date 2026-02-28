import { Router } from "express";
import * as stockMovementController from "../controllers/stockMovement.controller.js";
import { auth, authorize } from "../middlewares/auth.middleware.js";
import { validateQuery } from "../middlewares/validate.middleware.js";
import { listStockMovementsQuerySchema } from "../validations/stockMovement.validation.js";
import { listStockMovementLineQuerySchema } from "../validations/stockMovementLine.validation.js";

const router = Router();

// Protection explicite - toutes les routes nécessitent ADMIN
router.use(auth, authorize("ADMIN"));

/**
 * @route   GET /api/admin/stock-movements
 * @desc    Lister tous les mouvements de stock (sans filtre ownership)
 * @access  Admin only
 */
router.get(
	"/",
	validateQuery(listStockMovementsQuerySchema),
	stockMovementController.adminListAll,
);

/**
 * @route   POST /api/admin/stock-movements/reconcile/:productId
 * @desc    Réconcilier le cache stock d'un produit (recalcul depuis les mouvements)
 * @access  Admin only
 */
router.post("/reconcile/:productId", stockMovementController.reconcile);

/**
 * @route   GET /api/admin/stock-movements/lines
 * @desc    Lister toutes les lignes de mouvement de stock
 * @access  Admin only
 */
router.get(
	"/lines",
	validateQuery(listStockMovementLineQuerySchema),
	stockMovementController.listLines,
);

export default router;
