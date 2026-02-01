import mongoose from "mongoose";

/**
 * Modèle Panier avec TTL
 * Les paniers expirent automatiquement après un certain temps
 */
const cartItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    // Snapshot du prix au moment de l'ajout
    priceSnapshot: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    // Référence du mouvement de réservation
    reservationMovementId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "StockMovement",
    },
  },
  { _id: true }
);

const cartSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [cartItemSchema],
    // Date d'expiration du panier
    expiresAt: {
      type: Date,
      required: true,
      default: () => new Date(Date.now() + 30 * 60 * 1000), // 30 minutes par défaut
    },
  },
  { timestamps: true }
);

// Index pour l'utilisateur
cartSchema.index({ userId: 1 });
// TTL index pour supprimer automatiquement les paniers expirés
cartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Virtual pour calculer le total du panier
cartSchema.virtual("totalAmount").get(function () {
  return this.items.reduce(
    (sum, item) => sum + item.priceSnapshot * item.quantity,
    0
  );
});

// Virtual pour obtenir le nombre total d'articles
cartSchema.virtual("totalItems").get(function () {
  return this.items.reduce((sum, item) => sum + item.quantity, 0);
});

// Middleware pour libérer le stock réservé quand le panier expire/est supprimé
// Note: Doit être géré côté application car TTL ne déclenche pas les hooks

export default mongoose.model("Cart", cartSchema);
