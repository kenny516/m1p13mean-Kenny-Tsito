import { Router } from "express";
import * as stockMovementController from "../controllers/stockMovement.controller.js";
import { validateQuery } from "../middlewares/validate.middleware.js";
import { listStockMovementsQuerySchema } from "../validations/stockMovement.validation.js";

const router = Router();

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

export default router;
