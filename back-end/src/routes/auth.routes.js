import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} from "../validations/auth.validation.js";
import { uploadAvatar, parseJsonFields } from "../middlewares/upload.middleware.js";

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Inscription d'un nouvel utilisateur
 * @access  Public
 */
router.post(
  "/register",
  uploadAvatar,
  parseJsonFields(["profile"]),
  validate(registerSchema),
  authController.register,
);

/**
 * @route   POST /api/auth/login
 * @desc    Connexion utilisateur
 * @access  Public
 */
router.post("/login", validate(loginSchema), authController.login);

/**
 * @route   GET /api/auth/me
 * @desc    Récupérer le profil de l'utilisateur connecté
 * @access  Private
 */
router.get("/me", auth, authController.getMe);

/**
 * @route   PUT /api/auth/profile
 * @desc    Mettre à jour le profil de l'utilisateur connecté
 * @access  Private
 */
router.put(
  "/profile",
  auth,
  uploadAvatar,
  parseJsonFields(["profile"]),
  validate(updateProfileSchema),
  authController.updateProfile,
);

/**
 * @route   PUT /api/auth/profile/avatar
 * @desc    Upload ou remplacer l'avatar de l'utilisateur connecté
 * @access  Private
 */
router.put("/profile/avatar", auth, uploadAvatar, authController.uploadAvatar);

/**
 * @route   DELETE /api/auth/profile/avatar
 * @desc    Supprimer l'avatar de l'utilisateur connecté
 * @access  Private
 */
router.delete("/profile/avatar", auth, authController.deleteAvatar);

/**
 * @route   PUT /api/auth/password
 * @desc    Changer le mot de passe
 * @access  Private
 */
router.put(
  "/password",
  auth,
  validate(changePasswordSchema),
  authController.changePassword,
);

/**
 * @route   POST /api/auth/check-email
 * @desc    Vérifier si un email existe déjà
 * @access  Public
 */
router.post("/check-email", authController.checkEmail);

export default router;
