import { Router } from "express";
import * as productController from "../controllers/product.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { moderateProductSchema } from "../validations/product.validation.js";

const router = Router();

/**
 * @route   GET /api/admin/products
 * @desc    Lister tous les produits (tous statuts) avec filtres
 * @access  Admin only
 * @query   page, limit, status, search, category, shopId, sort
 */
router.get("/", productController.listAll);

/**
 * @route   PUT /api/admin/products/:id/validate
 * @desc    Valider ou rejeter un produit (Modération)
 * @access  Admin only
 */
router.put(
  "/:id/validate",
  validate(moderateProductSchema),
  productController.moderate,
);

export default router;
