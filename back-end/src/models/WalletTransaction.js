import mongoose from "mongoose";

/**
 * Modèle Transaction Wallet
 * Historique de toutes les transactions financières
 */
const walletTransactionSchema = new mongoose.Schema(
  {
    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "DEPOSIT", // Dépôt
        "WITHDRAWAL", // Retrait
        "PURCHASE", // Achat
        "SALE_INCOME", // Revenu de vente
        "REFUND", // Remboursement
        "COMMISSION", // Commission prélevée
        "TRANSFER_IN", // Transfert entrant
        "TRANSFER_OUT", // Transfert sortant
      ],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    // Solde avant la transaction
    balanceBefore: {
      type: Number,
      required: true,
    },
    // Solde après la transaction
    balanceAfter: {
      type: Number,
      required: true,
    },
    // Référence au mouvement de stock associé (pour les ventes/achats)
    stockMovementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StockMovement",
    },
    // Référence à une autre transaction (pour les transferts)
    relatedTransactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "WalletTransaction",
    },
    status: {
      type: String,
      enum: ["PENDING", "COMPLETED", "FAILED", "CANCELLED"],
      default: "COMPLETED",
    },
    // Méthode de paiement pour les dépôts/retraits
    paymentMethod: {
      type: String,
      enum: ["WALLET", "CARD", "MOBILE_MONEY", "BANK_TRANSFER", "CASH"],
    },
    // Référence externe (numéro de transaction externe)
    externalReference: String,
    description: String,
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
  },
  { timestamps: true }
);

// Index pour optimiser les recherches
walletTransactionSchema.index({ walletId: 1, createdAt: -1 });
walletTransactionSchema.index({ type: 1, status: 1 });
walletTransactionSchema.index({ stockMovementId: 1 });

export default mongoose.model("WalletTransaction", walletTransactionSchema);
