import { Router } from "express";
import * as shopController from "../controllers/shop.controller.js";
import { auth, authorize } from "../middlewares/auth.middleware.js";
import { validate, validateQuery } from "../middlewares/validate.middleware.js";
import {
	createShopSchema,
	updateShopSchema,
	listShopsQuerySchema,
} from "../validations/shop.validation.js";

const router = Router();

// ==========================================
// Routes publiques
// ==========================================

/**
 * @route   GET /api/shops
 * @desc    Lister les boutiques actives avec filtres et pagination
 * @access  Public
 */
router.get("/", validateQuery(listShopsQuerySchema), shopController.list);

/**
 * @route   GET /api/shops/my-shops
 * @desc    Lister les boutiques du vendeur connecté (tous statuts)
 * @access  Private (SELLER)
 */
router.get(
	"/my-shops",
	auth,
	authorize("SELLER"),
	validateQuery(listShopsQuerySchema),
	shopController.listMyShops,
);

/**
 * @route   GET /api/shops/:id
 * @desc    Récupérer une boutique par son ID
 * @access  Public
 */
router.get("/:id", shopController.getOne);

// ==========================================
// Routes protégées (SELLER)
// ==========================================

/**
 * @route   POST /api/shops
 * @desc    Créer une nouvelle boutique (statut DRAFT)
 * @access  Private (SELLER)
 */
router.post("/", auth, authorize("SELLER"), validate(createShopSchema), shopController.create);

/**
 * @route   PUT /api/shops/:id
 * @desc    Mettre à jour une boutique (contenu uniquement)
 * @access  Private (SELLER, ADMIN)
 */
router.put(
	"/:id",
	auth,
	authorize("SELLER", "ADMIN"),
	validate(updateShopSchema),
	shopController.update,
);

/**
 * @route   PATCH /api/shops/:id/submit
 * @desc    Soumettre une boutique pour validation (DRAFT/REJECTED → PENDING)
 * @access  Private (SELLER)
 */
router.patch("/:id/submit", auth, authorize("SELLER"), shopController.submitForReview);

/**
 * @route   PATCH /api/shops/:id/archive
 * @desc    Archiver une boutique (isActive → false)
 * @access  Private (SELLER, ADMIN)
 */
router.patch("/:id/archive", auth, authorize("SELLER", "ADMIN"), shopController.archive);

/**
 * @route   PATCH /api/shops/:id/activate
 * @desc    Réactiver une boutique (isActive → true)
 * @access  Private (SELLER, ADMIN)
 */
router.patch("/:id/activate", auth, authorize("SELLER", "ADMIN"), shopController.activate);

/**
 * @route   DELETE /api/shops/:id
 * @desc    Supprimer une boutique (tout statut)
 * @access  Private (SELLER, ADMIN)
 */
router.delete("/:id", auth, authorize("SELLER", "ADMIN"), shopController.remove);

export default router;
