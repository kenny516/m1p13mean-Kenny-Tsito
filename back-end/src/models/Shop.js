import mongoose from "mongoose";

/**
 * Modèle Boutique
 * Chaque vendeur (SELLER) peut avoir une boutique
 */
const shopSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true, // Un vendeur = une boutique
    },
    name: {
      type: String,
      required: [true, "Le nom de la boutique est requis"],
      trim: true,
    },
    description: String,
    logo: String,
    banner: String,
    contact: {
      email: String,
      phone: String,
      address: String,
    },
    categories: [String],
    isActive: {
      type: Boolean,
      default: false, // Nécessite validation admin
    },
    commissionRate: {
      type: Number,
      default: 10, // Pourcentage de commission
      min: 0,
      max: 100,
    },
    stats: {
      totalSales: { type: Number, default: 0 },
      totalProducts: { type: Number, default: 0 },
      rating: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// Index pour recherche full-text et filtres
shopSchema.index({ name: "text", description: "text" });
shopSchema.index({ isActive: 1 });
shopSchema.index({ categories: 1 });

export default mongoose.model("Shop", shopSchema);
