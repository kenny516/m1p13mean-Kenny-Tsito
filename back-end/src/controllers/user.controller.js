import * as userService from "../services/user.service.js";

/**
 * Contrôleur de gestion des utilisateurs (Admin)
 * Gère uniquement les requêtes/réponses HTTP
 */

/**
 * Liste des utilisateurs avec pagination et filtres
 * GET /api/admin/users
 */
export const getUsers = async (req, res, next) => {
  try {
    const { page, limit, role, isActive, isValidated, search } = req.query;

    const filters = {};
    if (role) filters.role = role;
    if (isActive !== undefined) filters.isActive = isActive === "true";
    if (isValidated !== undefined) filters.isValidated = isValidated === "true";
    if (search) filters.search = search;

    const pagination = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
    };

    const result = await userService.getUsers(filters, pagination);

    res.json({
      success: true,
      data: result.users,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupère un utilisateur par son ID
 * GET /api/admin/users/:id
 */
export const getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Crée un nouvel utilisateur
 * POST /api/admin/users
 */
export const createUser = async (req, res, next) => {
  try {
    const user = await userService.createUser(req.body);

    res.status(201).json({
      success: true,
      data: user,
      message: "Utilisateur créé avec succès",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Met à jour un utilisateur
 * PUT /api/admin/users/:id
 */
export const updateUser = async (req, res, next) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);

    res.json({
      success: true,
      data: user,
      message: "Utilisateur mis à jour avec succès",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Réinitialise le mot de passe d'un utilisateur
 * PUT /api/admin/users/:id/password
 */
export const resetPassword = async (req, res, next) => {
  try {
    const { newPassword } = req.body;
    await userService.resetUserPassword(req.params.id, newPassword);

    res.json({
      success: true,
      message: "Mot de passe réinitialisé avec succès",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Active un utilisateur
 * PATCH /api/admin/users/:id/activate
 */
export const activateUser = async (req, res, next) => {
  try {
    const user = await userService.activateUser(req.params.id);

    res.json({
      success: true,
      data: user,
      message: "Utilisateur activé avec succès",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Désactive un utilisateur
 * PATCH /api/admin/users/:id/deactivate
 */
export const deactivateUser = async (req, res, next) => {
  try {
    const user = await userService.deactivateUser(req.params.id);

    res.json({
      success: true,
      data: user,
      message: "Utilisateur désactivé avec succès",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Valide un utilisateur
 * PATCH /api/admin/users/:id/validate
 */
export const validateUser = async (req, res, next) => {
  try {
    const user = await userService.validateUser(req.params.id);

    res.json({
      success: true,
      data: user,
      message: "Utilisateur validé avec succès",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Supprime un utilisateur
 * DELETE /api/admin/users/:id
 */
export const deleteUser = async (req, res, next) => {
  try {
    await userService.deleteUser(req.params.id);

    res.json({
      success: true,
      message: "Utilisateur supprimé avec succès",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupère les statistiques des utilisateurs
 * GET /api/admin/users/stats
 */
export const getUserStats = async (req, res, next) => {
  try {
    const stats = await userService.getUserStats();

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  resetPassword,
  activateUser,
  deactivateUser,
  validateUser,
  deleteUser,
  getUserStats,
};
