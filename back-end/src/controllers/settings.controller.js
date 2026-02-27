import * as settingsService from "../services/settings.service.js";

/**
 * Contrôleur de gestion des paramètres de la plateforme (Admin)
 * Gère uniquement les requêtes/réponses HTTP
 */

/**
 * Récupère les paramètres de la plateforme
 * GET /api/admin/settings
 */
export const getSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.getSettings();

    res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Met à jour les paramètres de la plateforme
 * PUT /api/admin/settings
 */
export const updateSettings = async (req, res, next) => {
  try {
    const settings = await settingsService.updateSettings(req.body);

    res.json({
      success: true,
      data: settings,
      message: "Paramètres mis à jour avec succès",
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getSettings,
  updateSettings,
};
