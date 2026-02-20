import mongoose from "mongoose";

/**
 * Modèle Boutique
 * Un vendeur (SELLER) peut avoir plusieurs boutiques
 */
const shopSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
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

    // === MODÉRATION ===
    status: {
      type: String,
      enum: ["DRAFT", "PENDING", "ACTIVE", "REJECTED", "ARCHIVED"],
      default: "DRAFT",
    },
    rejectionReason: String,
    isActive: {
      type: Boolean,
      default: false,
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

// Sync isActive avec le status avant chaque sauvegarde
shopSchema.pre("save", function () {
  this.isActive = this.status === "ACTIVE";
});

// Sync isActive pour les opérations findOneAndUpdate
shopSchema.pre(["findOneAndUpdate", "updateOne", "updateMany"], function () {
  const update = this.getUpdate();
  if (update.status || update.$set?.status) {
    const newStatus = update.status || update.$set.status;
    this.set({ isActive: newStatus === "ACTIVE" });
  }
});

// Index pour recherche full-text et filtres
shopSchema.index({ name: "text", description: "text" });
shopSchema.index({ isActive: 1 });
shopSchema.index({ categories: 1 });
shopSchema.index({ status: 1, createdAt: -1 });
shopSchema.index({ sellerId: 1, status: 1 });

export default mongoose.model("Shop", shopSchema);
