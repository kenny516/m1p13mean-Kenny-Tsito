import { Settings } from "../models/index.js";

/**
 * Service de gestion des paramètres de la plateforme
 * Implémente le pattern singleton pour les settings
 */

/**
 * Récupère les paramètres de la plateforme
 * Crée les paramètres par défaut si ils n'existent pas
 * @returns {Promise<Object>} Les paramètres de la plateforme
 */
export const getSettings = async () => {
  return await Settings.getSettings();
};

/**
 * Met à jour les paramètres de la plateforme
 * @param {Object} updates - Les paramètres à mettre à jour
 * @returns {Promise<Object>} Les paramètres mis à jour
 */
export const updateSettings = async (updates) => {
  return await Settings.updateSettings(updates);
};

/**
 * Récupère un paramètre spécifique
 * @param {string} key - La clé du paramètre
 * @returns {Promise<any>} La valeur du paramètre
 */
export const getSetting = async (key) => {
  const settings = await getSettings();
  return settings[key];
};

/**
 * Récupère le taux de commission par défaut
 * @returns {Promise<number>} Le taux de commission par défaut
 */
export const getDefaultCommissionRate = async () => {
  return await getSetting("defaultCommissionRate");
};

/**
 * Récupère la durée de vie du panier en minutes
 * @returns {Promise<number>} La durée de vie du panier en minutes
 */
export const getCartTTLMinutes = async () => {
  return await getSetting("cartTTLMinutes");
};

/**
 * Récupère le seuil d'alerte de stock bas
 * @returns {Promise<number>} Le seuil d'alerte de stock bas
 */
export const getLowStockThreshold = async () => {
  return await getSetting("lowStockThreshold");
};

/**
 * Récupère le seuil de rupture de stock
 * @returns {Promise<number>} Le seuil de rupture de stock
 */
export const getOutOfStockThreshold = async () => {
  return await getSetting("outOfStockThreshold");
};

/**
 * Vérifie si le mode maintenance est activé
 * @returns {Promise<boolean>} True si le mode maintenance est activé
 */
export const isMaintenanceMode = async () => {
  return await getSetting("maintenanceMode");
};

/**
 * Récupère le message de maintenance
 * @returns {Promise<string>} Le message de maintenance
 */
export const getMaintenanceMessage = async () => {
  return await getSetting("maintenanceMessage");
};

export default {
  getSettings,
  updateSettings,
  getSetting,
  getDefaultCommissionRate,
  getCartTTLMinutes,
  getLowStockThreshold,
  getOutOfStockThreshold,
  isMaintenanceMode,
  getMaintenanceMessage,
};
