import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "../models/User.js";
import Shop from "../models/Shop.js";
import Wallet from "../models/Wallet.js";
import config from "../config/env.js";

/**
 * Script de seed pour créer des boutiques avec leurs vendeurs
 * Usage: node src/seeds/shop.seed.js
 */

const SELLERS_DATA = [
	{
		email: "techstore@marketplace.mg",
		password: "Seller@2026",
		profile: {
			firstName: "Jean",
			lastName: "Rakoto",
			phone: "+261341111111",
		},
		shop: {
			name: "TechStore Madagascar",
			description: "Votre destination pour les produits électroniques de qualité",
			categories: ["Électronique", "Informatique", "Téléphonie"],
			contact: {
				email: "contact@techstore.mg",
				phone: "+261341111111",
				address: "Analakely, Antananarivo 101",
			},
			commissionRate: 10,
		},
	},
	{
		email: "modechic@marketplace.mg",
		password: "Seller@2026",
		profile: {
			firstName: "Marie",
			lastName: "Razafy",
			phone: "+261342222222",
		},
		shop: {
			name: "Mode Chic",
			description: "Boutique de mode tendance pour homme et femme",
			categories: ["Mode", "Vêtements", "Accessoires"],
			contact: {
				email: "contact@modechic.mg",
				phone: "+261342222222",
				address: "Tanjombato, Antananarivo 102",
			},
			commissionRate: 12,
		},
	},
	{
		email: "biomarket@marketplace.mg",
		password: "Seller@2026",
		profile: {
			firstName: "Paul",
			lastName: "Andria",
			phone: "+261343333333",
		},
		shop: {
			name: "Bio Market",
			description: "Produits bio et naturels de Madagascar",
			categories: ["Alimentation", "Bio", "Santé"],
			contact: {
				email: "contact@biomarket.mg",
				phone: "+261343333333",
				address: "Ivandry, Antananarivo 101",
			},
			commissionRate: 8,
		},
	},
];

async function seedShops() {
	try {
		console.log("🚀 Connexion à la base de données...");
		await mongoose.connect(config.mongoUri);
		console.log("✅ Connecté à MongoDB");

		const createdShops = [];

		for (const sellerData of SELLERS_DATA) {
			// Vérifier si le vendeur existe déjà
			let seller = await User.findOne({ email: sellerData.email });

			if (seller) {
				console.log(`ℹ️  Le vendeur ${sellerData.email} existe déjà`);
				const existingShop = await Shop.findOne({ sellerId: seller._id });
				if (existingShop) {
					console.log(`ℹ️  La boutique ${existingShop.name} existe déjà`);
					createdShops.push({ seller, shop: existingShop });
					continue;
				}
			} else {
				// Créer le vendeur
				console.log(`📝 Création du vendeur ${sellerData.email}...`);
				const salt = await bcrypt.genSalt(12);
				const passwordHash = await bcrypt.hash(sellerData.password, salt);

				seller = await User.create({
					email: sellerData.email,
					passwordHash,
					role: "SELLER",
					profile: sellerData.profile,
					isValidated: true,
					isActive: true,
				});

				// Créer le wallet
				const wallet = await Wallet.create({
					ownerId: seller._id,
					ownerModel: "User",
					balance: 0,
					currency: "MGA",
				});

				seller.walletId = wallet._id;
				await seller.save();
			}

			// Créer la boutique
			console.log(`🏪 Création de la boutique ${sellerData.shop.name}...`);
			const shop = await Shop.create({
				sellerId: seller._id,
				name: sellerData.shop.name,
				description: sellerData.shop.description,
				categories: sellerData.shop.categories,
				contact: sellerData.shop.contact,
				commissionRate: sellerData.shop.commissionRate,
				isActive: true, // Boutique déjà validée pour les tests
			});

			createdShops.push({ seller, shop });
			console.log(`✅ Boutique ${shop.name} créée`);
		}

		console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
		console.log("✅ Seed des boutiques terminé!");
		console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
		console.log("\n📋 Boutiques créées:");
		for (const { seller, shop } of createdShops) {
			console.log(`\n🏪 ${shop.name}`);
			console.log(`   📧 Vendeur: ${seller.email}`);
			console.log(`   🔑 Mot de passe: Seller@2026`);
			console.log(`   📍 ID Boutique: ${shop._id}`);
		}
		console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
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
seedShops();
