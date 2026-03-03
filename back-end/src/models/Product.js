import mongoose from "mongoose";

/**
 * Modèle Produit
 * Organisé par domaines fonctionnels
 */
const productSchema = new mongoose.Schema(
  {
    // === RELATIONS ===
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

    // === IDENTIFICATION & INFORMATIONS ===
    sku: {
      type: String,
      unique: true,
      sparse: true,
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
    category: {
      type: String,
      required: true,
    },
    tags: [String],
    characteristics: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
    images: [
      {
        url: { type: String, required: true, trim: true },
        fileId: { type: String, trim: true },
      },
    ],

    // === TARIFICATION ===
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    originalPrice: {
      type: Number,
      min: 0,
    },

    // === GESTION DU STOCK ===
    stock: {
      cache: {
        total: { type: Number, default: 0 },
        reserved: { type: Number, default: 0 },
        available: { type: Number, default: 0 },
        lastUpdated: { type: Date, default: Date.now },
      },
      alert: {
        lowThreshold: { type: Number, default: 5 },
        outOfStock: { type: Number, default: 0 },
      },
    },

    // === MODÉRATION ===
    status: {
      type: String,
      enum: ["DRAFT", "PENDING", "ACTIVE", "REJECTED", "ARCHIVED"],
      default: "DRAFT",
    },
    rejectionReason: String,

    // === STATISTIQUES ===
    stats: {
      views: { type: Number, default: 0 },
      sales: { type: Number, default: 0 },
      deliveredSales: { type: Number, default: 0 },
      rating: { type: Number, default: 0 },
      reviewCount: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

const serializeImages = (_doc, ret) => {
  if (Array.isArray(ret?.images)) {
    ret.images = ret.images
      .map((image) => {
        if (typeof image === "string") return image;
        return image?.url || null;
      })
      .filter(Boolean);
  }

  return ret;
};

productSchema.set("toJSON", { transform: serializeImages });
productSchema.set("toObject", { transform: serializeImages });

// Index pour recherche full-text
productSchema.index({ title: "text", description: "text", tags: "text" });
// Index composites
productSchema.index({ shopId: 1, status: 1 });
productSchema.index({ category: 1, status: 1, price: 1 });
productSchema.index({ status: 1, createdAt: -1 });
productSchema.index({ tags: 1 });
productSchema.index({ "stock.cache.available": 1, status: 1 });

// Virtual pour vérifier si stock bas
productSchema.virtual("isLowStock").get(function () {
  return this.stock.cache.available <= this.stock.alert.lowThreshold;
});

// Virtual pour vérifier rupture
productSchema.virtual("isOutOfStock").get(function () {
  return this.stock.cache.available <= this.stock.alert.outOfStock;
});

export default mongoose.model("Product", productSchema);
