import mongoose from "mongoose";

/**
 * Modèle Settings (Singleton)
 * Stocke les paramètres globaux de configuration de la plateforme
 * Une seule entrée existe en base de données
 */
const settingsSchema = new mongoose.Schema(
  {
    // === PARAMÈTRES COMMISSION ===
    defaultCommissionRate: {
      type: Number,
      default: 10, // Pourcentage par défaut pour les nouvelles boutiques
      min: 0,
      max: 100,
    },

    // === PARAMÈTRES PANIER ===
    cartTTLMinutes: {
      type: Number,
      default: 30, // Durée de vie du panier en minutes
      min: 5,
      max: 1440, // Max 24h
    },

    // === PARAMÈTRES STOCK ===
    lowStockThreshold: {
      type: Number,
      default: 10, // Seuil d'alerte stock bas
      min: 0,
    },
    outOfStockThreshold: {
      type: Number,
      default: 0, // Seuil de rupture de stock
      min: 0,
    },

    // === PARAMÈTRES GÉNÉRAUX ===
    currency: {
      type: String,
      default: "MGA", // Ariary malgache
      trim: true,
    },
    platformName: {
      type: String,
      default: "Marketplace",
      trim: true,
    },

    // === MODE MAINTENANCE ===
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    maintenanceMessage: {
      type: String,
      default: "La plateforme est en maintenance. Veuillez réessayer plus tard.",
    },

    // === PARAMÈTRES EMAIL ===
    contactEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    supportEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },

    // === PARAMÈTRES PAIEMENT ===
    minOrderAmount: {
      type: Number,
      default: 0, // Montant minimum de commande
      min: 0,
    },
    maxOrderAmount: {
      type: Number,
      default: 0, // 0 = pas de limite
      min: 0,
    },

    // === PARAMÈTRES WALLET ===
    minWithdrawalAmount: {
      type: Number,
      default: 10000, // Montant minimum de retrait
      min: 0,
    },
    adminGlobalWalletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
      default: null,
    },

    // === PARAMÈTRES RETOUR ===
    returnWindowDays: {
      type: Number,
      default: 7, // Délai en jours pour retourner une commande après livraison
      min: 1,
      max: 365,
    },
  },
  {
    timestamps: true,
    // Empêche la création de plusieurs documents
    capped: { max: 1, size: 4096 },
  }
);

// Méthode statique pour récupérer les settings (crée si n'existe pas)
settingsSchema.statics.getSettings = async function (options = {}) {
  // NOTE: this collection is capped; MongoDB forbids writes in transactions
  // on capped collections. We intentionally ignore any provided session here.
  let settings = await this.findOne();
  if (!settings) {
    [settings] = await this.create([{}]);
  }
  return settings;
};

// Méthode statique pour mettre à jour les settings
settingsSchema.statics.updateSettings = async function (updates, options = {}) {
  // options.session is accepted for API compatibility but ignored.
  const settings = await this.getSettings(options);
  Object.assign(settings, updates);
  await settings.save();
  return settings;
};

export default mongoose.model("Settings", settingsSchema);
