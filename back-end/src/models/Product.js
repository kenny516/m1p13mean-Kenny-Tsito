import mongoose from "mongoose";

/**
 * Modèle Produit
 * Contient les informations produit avec cache de stock
 */
const productSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop",
      required: true,
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sku: {
      type: String,
      unique: true,
      sparse: true, // Permet null mais unique si défini
    },
    title: {
      type: String,
      required: [true, "Le titre est requis"],
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    originalPrice: Number, // Pour les promotions
    // Stock calculé - mis à jour via agrégation des mouvements
    // Peut être dénormalisé pour performance (recalculé périodiquement)
    stockCache: {
      total: { type: Number, default: 0 },
      reserved: { type: Number, default: 0 },
      available: { type: Number, default: 0 },
      lastUpdated: { type: Date, default: Date.now },
    },
    // Seuils d'alerte
    stockAlert: {
      lowThreshold: { type: Number, default: 5 }, // Seuil stock bas
      outOfStock: { type: Number, default: 0 }, // Seuil rupture
    },
    images: [String],
    category: {
      type: String,
      required: true,
    },
    tags: [String],
    characteristics: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
    status: {
      type: String,
      enum: ["DRAFT", "PENDING", "ACTIVE", "REJECTED", "ARCHIVED"],
      default: "DRAFT",
    },
    rejectionReason: String,
    stats: {
      views: { type: Number, default: 0 },
      sales: { type: Number, default: 0 },
      rating: { type: Number, default: 0 },
      reviewCount: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// Index pour recherche full-text
productSchema.index({ title: "text", description: "text", tags: "text" });
// Index composites
productSchema.index({ shopId: 1, status: 1 });
productSchema.index({ category: 1, status: 1, price: 1 });
productSchema.index({ status: 1, createdAt: -1 });
productSchema.index({ tags: 1 });
productSchema.index({ sku: 1 });
productSchema.index({ "stockCache.available": 1, status: 1 }); // Pour alertes stock

// Virtual pour vérifier si stock bas
productSchema.virtual("isLowStock").get(function () {
  return this.stockCache.available <= this.stockAlert.lowThreshold;
});

// Virtual pour vérifier rupture
productSchema.virtual("isOutOfStock").get(function () {
  return this.stockCache.available <= this.stockAlert.outOfStock;
});

export default mongoose.model("Product", productSchema);
