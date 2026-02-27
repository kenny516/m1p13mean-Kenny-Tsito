import mongoose from "mongoose";

/**
 * Modèle Utilisateur
 * Gère les trois profils: BUYER (acheteur), SELLER (vendeur), ADMIN (administrateur)
 */
const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "L'email est requis"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Email invalide"],
    },
    passwordHash: {
      type: String,
      required: [true, "Le mot de passe est requis"],
      select: false, // Ne pas retourner par défaut
    },
    role: {
      type: String,
      enum: ["BUYER", "SELLER", "ADMIN"],
      required: true,
    },
    profile: {
      firstName: { type: String, trim: true },
      lastName: { type: String, trim: true },
      phone: { type: String, trim: true },
      address: {
        street: String,
        city: String,
        postalCode: String,
        country: { type: String, default: "Madagascar" },
      },
      avatar: {
        url: { type: String, trim: true },
        fileId: { type: String, trim: true },
      },
    },
    walletId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wallet",
    },
    isValidated: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

const serializeAvatar = (_doc, ret) => {
  if (ret?.profile?.avatar && typeof ret.profile.avatar === "object") {
    ret.profile.avatar = ret.profile.avatar.url || null;
  }

  return ret;
};

userSchema.set("toJSON", { transform: serializeAvatar });
userSchema.set("toObject", { transform: serializeAvatar });

// Index pour optimiser les recherches
userSchema.index({ role: 1, isActive: 1 });

export default mongoose.model("User", userSchema);
