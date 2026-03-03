import mongoose from "mongoose";
import User from "../models/User.js";
import config from "../config/env.js";
import * as userService from "../services/user.service.js";
import * as walletService from "../services/wallet.service.js";

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

      // Créer l'utilisateur acheteur via service
      const createdBuyer = await userService.createUser({
        email: buyerData.email,
        password: buyerData.password,
        role: "BUYER",
        profile: buyerData.profile,
        isValidated: true,
        isActive: true,
      });
      buyer = await User.findById(createdBuyer._id);

      // Créditer le wallet initial via service
      await walletService.creditWalletByOwner(
        { ownerId: buyer._id, ownerModel: "User" },
        buyerData.walletBalance,
        {
          type: "DEPOSIT",
          paymentMethod: "WALLET",
          description: `Seed initial balance for ${buyerData.email}`,
          metadata: { seedTag: "buyer-seed-2026-03" },
        },
      );

      createdBuyers.push(buyer);
      console.log(`✅ Acheteur ${buyerData.email} créé avec succès!`);
    }

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📋 Récapitulatif des comptes acheteurs:");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    for (const buyerData of BUYERS_DATA) {
      const buyer = createdBuyers.find((b) => b.email === buyerData.email);
      if (buyer) {
        const wallet = await walletService.getUserWallet(buyer._id);
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
