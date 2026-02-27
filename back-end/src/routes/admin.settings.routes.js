import { Router } from "express";
import * as settingsController from "../controllers/settings.controller.js";
import { validate } from "../middlewares/validate.middleware.js";
import { updateSettingsSchema } from "../validations/settings.validation.js";

const router = Router();

/**
 * @route   GET /api/admin/settings
 * @desc    Récupérer les paramètres de la plateforme
 * @access  Admin only
 */
router.get("/", settingsController.getSettings);

/**
 * @route   PUT /api/admin/settings
 * @desc    Mettre à jour les paramètres de la plateforme
 * @access  Admin only
 */
router.put("/", validate(updateSettingsSchema), settingsController.updateSettings);

export default router;
