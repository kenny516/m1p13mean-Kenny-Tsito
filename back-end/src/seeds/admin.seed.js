import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/User.js";
import Wallet from "../models/Wallet.js";
import config from "../config/env.js";

/**
 * Script de seed pour créer le compte administrateur initial
 * Usage: node src/seeds/admin.seed.js
 */

const ADMIN_DATA = {
  email: "admin@marketplace.mg",
  password: "Admin@2026", // Mot de passe fort par défaut
  role: "ADMIN",
  profile: {
    firstName: "Administrateur",
    lastName: "Système",
    phone: "+261340000000",
  },
  isValidated: true,
  isActive: true,
};

async function seedAdmin() {
  try {
    console.log("🚀 Connexion à la base de données...");
    await mongoose.connect(config.mongoUri);
    console.log("✅ Connecté à MongoDB");

    // Vérifier si l'admin existe déjà
    const existingAdmin = await User.findOne({ email: ADMIN_DATA.email });
    if (existingAdmin) {
      console.log("ℹ️  Le compte admin existe déjà");
      console.log(`📧 Email: ${ADMIN_DATA.email}`);
      console.log("✅ Rien à faire");
      return;
    }

    console.log("📝 Création du compte administrateur...");

    // Hasher le mot de passe
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(ADMIN_DATA.password, salt);

    // Créer l'utilisateur admin (sans transaction pour développement local)
    const admin = await User.create({
      email: ADMIN_DATA.email,
      passwordHash,
      role: ADMIN_DATA.role,
      profile: ADMIN_DATA.profile,
      isValidated: ADMIN_DATA.isValidated,
      isActive: ADMIN_DATA.isActive,
    });

    // Créer le wallet pour l'admin
    const wallet = await Wallet.create({
      ownerId: admin._id,
      ownerModel: "User",
      balance: 0,
      currency: "MGA",
    });

    // Lier le wallet à l'admin
    admin.walletId = wallet._id;
    await admin.save();

    console.log("✅ Compte admin créé avec succès!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`📧 Email: ${ADMIN_DATA.email}`);
    console.log(`🔑 Mot de passe: ${ADMIN_DATA.password}`);
    console.log(
      `👤 Nom: ${admin.profile.firstName} ${admin.profile.lastName}`,
    );
    console.log(`💰 Wallet ID: ${wallet._id}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(
      "⚠️  Pensez à changer le mot de passe après la première connexion",
    );
  } catch (error) {
    console.error("❌ Erreur lors du seed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("👋 Déconnecté de MongoDB");
    process.exit(0);
  }
}

// Exécuter le seed
seedAdmin();
