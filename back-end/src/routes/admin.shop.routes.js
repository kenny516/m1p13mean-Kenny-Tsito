import { Router } from "express";
import * as shopController from "../controllers/shop.controller.js";
import { auth, authorize } from "../middlewares/auth.middleware.js";
import { validate, validateQuery } from "../middlewares/validate.middleware.js";
import {
  moderateShopSchema,
  adminUpdateShopSchema,
  listShopsQuerySchema,
} from "../validations/shop.validation.js";

const router = Router();

// Protection explicite - toutes les routes nécessitent ADMIN
router.use(auth, authorize("ADMIN"));

/**
 * @route   GET /api/admin/shops/pending
 * @desc    Lister les boutiques en attente de modération
 * @access  Admin only
 */
router.get("/pending", validateQuery(listShopsQuerySchema), shopController.getPendingShops);

/**
 * @route   GET /api/admin/shops
 * @desc    Lister toutes les boutiques avec filtres et pagination
 * @access  Admin only
 */
router.get("/", validateQuery(listShopsQuerySchema), shopController.listAllShops);

/**
 * @route   PATCH /api/admin/shops/:id/moderate
 * @desc    Modérer une boutique (PENDING → ACTIVE|REJECTED)
 * @access  Admin only
 */
router.patch(
  "/:id/moderate",
  validate(moderateShopSchema),
  shopController.moderate,
);

/**
 * @route   PUT /api/admin/shops/:id
 * @desc    Mettre à jour les paramètres admin d'une boutique (commission rate, etc.)
 * @access  Admin only
 */
router.put(
  "/:id",
  validate(adminUpdateShopSchema),
  shopController.adminUpdate,
);

export default router;
