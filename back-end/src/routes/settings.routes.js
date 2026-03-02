import { Router } from "express";
import * as settingsController from "../controllers/settings.controller.js";
import { auth } from "../middlewares/auth.middleware.js";

const router = Router();

/**
 * @route   GET /api/settings
 * @desc    Récupérer les paramètres publics de la plateforme (accessible à tous les utilisateurs authentifiés)
 * @access  Authentifié (BUYER, SELLER, ADMIN)
 */
router.get("/", auth, settingsController.getSettings);

export default router;
