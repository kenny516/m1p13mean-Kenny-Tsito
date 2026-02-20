import { Router } from "express";
import * as productController from "../controllers/product.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { moderateProductSchema } from "../validations/product.validation.js";

const router = Router();

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
