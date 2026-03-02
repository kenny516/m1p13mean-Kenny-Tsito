import mongoose from "mongoose";

/**
 * Modèle Portefeuille
 * Chaque utilisateur et boutique possède un portefeuille
 */
const walletSchema = new mongoose.Schema(
  {
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "ownerModel",
    },
    ownerModel: {
      type: String,
      required: true,
      enum: ["User", "Shop"],
    },
    balance: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: "MGA", // Ariary malgache
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    // Montant en attente (ex: ventes non encore livrées)
    pendingBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Montant total gagné (historique)
    totalEarned: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Montant total dépensé (historique)
    totalSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

// Index unique pour s'assurer qu'un propriétaire n'a qu'un seul wallet
walletSchema.index({ ownerId: 1, ownerModel: 1 }, { unique: true });

export default mongoose.model("Wallet", walletSchema);
