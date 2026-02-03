import * as authService from "../services/auth.service.js";

/**
 * Inscription d'un nouvel utilisateur
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const { email, password, role, profile } = req.body;
    const result = await authService.registerUser({
      email,
      password,
      role,
      profile,
    });

    res
      .status(201)
      .json({ success: true, data: result, message: "Inscription réussie" });
  } catch (error) {
    next(error);
  }
};

/**
 * Connexion utilisateur
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.loginUser({ email, password });

    res.json({ success: true, data: result, message: "Connexion réussie" });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupérer le profil de l'utilisateur connecté
 * GET /api/auth/me
 */
export const getMe = async (req, res, next) => {
  try {
    const profile = await authService.getUserProfile(req.user._id);
    res.json({ success: true, data: profile });
  } catch (error) {
    next(error);
  }
};

/**
 * Mettre à jour le profil de l'utilisateur connecté
 * PUT /api/auth/profile
 */
export const updateProfile = async (req, res, next) => {
  try {
    const { profile } = req.body;
    const updated = await authService.updateUserProfile(req.user._id, profile);
    res.json({
      success: true,
      data: updated,
      message: "Profil mis à jour avec succès",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Changer le mot de passe
 * PUT /api/auth/password
 */
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    await authService.changeUserPassword(
      req.user._id,
      currentPassword,
      newPassword,
    );
    res.json({ success: true, message: "Mot de passe modifié avec succès" });
  } catch (error) {
    next(error);
  }
};

/**
 * Vérifier si un email existe déjà
 * POST /api/auth/check-email
 */
export const checkEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    const exists = await authService.checkEmailExists(email);
    res.json({ success: true, data: { exists } });
  } catch (error) {
    next(error);
  }
};
