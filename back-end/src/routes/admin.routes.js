import { Router } from "express";
import * as userController from "../controllers/user.controller.js";
import adminShopRoutes from "./admin.shop.routes.js";
import adminProductRoutes from "./admin.product.routes.js";
import { auth, authorize } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createUserSchema,
  updateUserSchema,
  resetPasswordSchema,
} from "../validations/user.validation.js";

const router = Router();

// Toutes les routes admin nécessitent authentification et rôle ADMIN
router.use(auth, authorize("ADMIN"));

/**
 * @route   GET /api/admin/users/stats
 * @desc    Récupérer les statistiques des utilisateurs
 * @access  Admin
 */
router.get("/users/stats", userController.getUserStats);

/**
 * @route   GET /api/admin/users
 * @desc    Liste des utilisateurs avec pagination et filtres
 * @access  Admin
 * @query   page, limit, role, isActive, isValidated, search
 */
router.get("/users", userController.getUsers);

/**
 * @route   GET /api/admin/users/:id
 * @desc    Récupérer un utilisateur par son ID
 * @access  Admin
 */
router.get("/users/:id", userController.getUserById);

/**
 * @route   POST /api/admin/users
 * @desc    Créer un nouvel utilisateur
 * @access  Admin
 */
router.post("/users", validate(createUserSchema), userController.createUser);

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Mettre à jour un utilisateur
 * @access  Admin
 */
router.put("/users/:id", validate(updateUserSchema), userController.updateUser);

/**
 * @route   PUT /api/admin/users/:id/password
 * @desc    Réinitialiser le mot de passe d'un utilisateur
 * @access  Admin
 */
router.put(
  "/users/:id/password",
  validate(resetPasswordSchema),
  userController.resetPassword,
);

/**
 * @route   PATCH /api/admin/users/:id/activate
 * @desc    Activer un utilisateur
 * @access  Admin
 */
router.patch("/users/:id/activate", userController.activateUser);

/**
 * @route   PATCH /api/admin/users/:id/deactivate
 * @desc    Désactiver un utilisateur
 * @access  Admin
 */
router.patch("/users/:id/deactivate", userController.deactivateUser);

/**
 * @route   PATCH /api/admin/users/:id/validate
 * @desc    Valider un utilisateur
 * @access  Admin
 */
router.patch("/users/:id/validate", userController.validateUser);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Supprimer un utilisateur
 * @access  Admin
 */
router.delete("/users/:id", userController.deleteUser);

/**
 * Routes de gestion des boutiques (admin)
 */
router.use("/shops", adminShopRoutes);

/**
 * Routes de gestion des produits (admin)
 */
router.use("/products", adminProductRoutes);

export default router;
