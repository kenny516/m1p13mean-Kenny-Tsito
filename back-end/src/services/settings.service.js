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

export const getSettingsWithSession = async (session = null) => {
  return await Settings.getSettings({ session });
};

/**
 * Met à jour les paramètres de la plateforme
 * @param {Object} updates - Les paramètres à mettre à jour
 * @returns {Promise<Object>} Les paramètres mis à jour
 */
export const updateSettings = async (updates) => {
  return await Settings.updateSettings(updates);
};

export const updateSettingsWithSession = async (updates, session = null) => {
  return await Settings.updateSettings(updates, { session });
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

export const getSettingWithSession = async (key, session = null) => {
  const settings = await getSettingsWithSession(session);
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

export const getAdminGlobalWalletId = async (session = null) => {
  return await getSettingWithSession("adminGlobalWalletId", session);
};

export const setAdminGlobalWalletId = async (walletId, session = null) => {
  const normalizedWalletId = walletId ? walletId.toString() : null;
  return await updateSettingsWithSession(
    { adminGlobalWalletId: normalizedWalletId },
    session,
  );
};

export default {
  getSettings,
  getSettingsWithSession,
  updateSettings,
  updateSettingsWithSession,
  getSetting,
  getSettingWithSession,
  getDefaultCommissionRate,
  getCartTTLMinutes,
  getLowStockThreshold,
  getOutOfStockThreshold,
  isMaintenanceMode,
  getMaintenanceMessage,
  getAdminGlobalWalletId,
  setAdminGlobalWalletId,
};
