import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/User.js";
import Wallet from "../models/Wallet.js";
import config from "../config/env.js";

/**
 * Script de seed pour créer des comptes acheteurs de test
 * Usage: node src/seeds/buyer.seed.js
 */

const BUYERS_DATA = [
  {
    email: "buyer1@marketplace.mg",
    password: "Buyer@2026",
    profile: {
      firstName: "Rafidy",
      lastName: "Andriamahefa",
      phone: "+261344444444",
      address: {
        street: "Ankorondrano",
        city: "Antananarivo",
        postalCode: "101",
      },
    },
    walletBalance: 5000000, // 5 million MGA pour tester les achats
  },
  {
    email: "buyer2@marketplace.mg",
    password: "Buyer@2026",
    profile: {
      firstName: "Voahirana",
      lastName: "Rasoamanarivo",
      phone: "+261345555555",
      address: {
        street: "Ambohijatovo",
        city: "Antananarivo",
        postalCode: "101",
      },
    },
    walletBalance: 2000000, // 2 million MGA
  },
  {
    email: "buyer3@marketplace.mg",
    password: "Buyer@2026",
    profile: {
      firstName: "Tiana",
      lastName: "Raveloson",
      phone: "+261346666666",
      address: {
        street: "Talatamaty",
        city: "Antananarivo",
        postalCode: "106",
      },
    },
    walletBalance: 10000000, // 10 million MGA pour tester les gros achats
  },
];

async function seedBuyers() {
  try {
    console.log("🚀 Connexion à la base de données...");
    await mongoose.connect(config.mongoUri);
    console.log("✅ Connecté à MongoDB");

    const createdBuyers = [];

    for (const buyerData of BUYERS_DATA) {
      // Vérifier si l'acheteur existe déjà
      let buyer = await User.findOne({ email: buyerData.email });

      if (buyer) {
        console.log(`ℹ️  L'acheteur ${buyerData.email} existe déjà`);
        createdBuyers.push(buyer);
        continue;
      }

      console.log(`📝 Création de l'acheteur ${buyerData.email}...`);

      // Hasher le mot de passe
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(buyerData.password, salt);

      // Créer l'utilisateur acheteur
      buyer = await User.create({
        email: buyerData.email,
        passwordHash,
        role: "BUYER",
        profile: buyerData.profile,
        isValidated: true,
        isActive: true,
      });

      // Créer le wallet avec le solde initial
      const wallet = await Wallet.create({
        ownerId: buyer._id,
        ownerModel: "User",
        balance: buyerData.walletBalance,
        currency: "MGA",
      });

      // Lier le wallet à l'acheteur
      buyer.walletId = wallet._id;
      await buyer.save();

      createdBuyers.push(buyer);
      console.log(`✅ Acheteur ${buyerData.email} créé avec succès!`);
    }

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📋 Récapitulatif des comptes acheteurs:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    for (const buyerData of BUYERS_DATA) {
      const buyer = createdBuyers.find((b) => b.email === buyerData.email);
      if (buyer) {
        const wallet = await Wallet.findOne({ ownerId: buyer._id });
        console.log(
          `\n👤 ${buyer.profile.firstName} ${buyer.profile.lastName}`,
        );
        console.log(`   📧 Email: ${buyerData.email}`);
        console.log(`   🔑 Mot de passe: ${buyerData.password}`);
        console.log(
          `   💰 Solde wallet: ${wallet?.balance?.toLocaleString() || 0} MGA`,
        );
      }
    }

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ Seed des acheteurs terminé!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  } catch (error) {
    console.error("❌ Erreur lors du seed:", error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("📦 Déconnecté de MongoDB");
  }
}

// Exécuter le seed
seedBuyers();
