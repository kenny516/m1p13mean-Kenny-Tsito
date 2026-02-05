import mongoose from "mongoose";
import Product from "../models/Product.js";
import Shop from "../models/Shop.js";
import User from "../models/User.js"; // Requis pour populate
import config from "../config/env.js";

/**
 * Script de seed pour créer des produits de démonstration
 * Prérequis: Exécuter shop.seed.js d'abord pour créer les boutiques
 * Usage: node src/seeds/product.seed.js
 */

const PRODUCTS_DATA = [
	// Produits TechStore Madagascar
	{
		shopName: "TechStore Madagascar",
		products: [
			{
				sku: "TECH-001",
				title: "iPhone 15 Pro Max 256GB",
				description: "Le dernier iPhone avec puce A17 Pro, écran Super Retina XDR 6.7 pouces et système de caméra pro.",
				category: "Téléphonie",
				tags: ["apple", "iphone", "smartphone", "premium"],
				price: 5500000,
				originalPrice: 6000000,
				stock: { cache: { available: 15, reserved: 2 }, alert: { threshold: 5 } },
			},
			{
				sku: "TECH-002",
				title: "MacBook Pro M3 14 pouces",
				description: "MacBook Pro avec puce M3, 16GB RAM, 512GB SSD. Performances exceptionnelles pour les professionnels.",
				category: "Informatique",
				tags: ["apple", "macbook", "laptop", "pro"],
				price: 8500000,
				originalPrice: 9000000,
				stock: { cache: { available: 8, reserved: 0 }, alert: { threshold: 3 } },
			},
			{
				sku: "TECH-003",
				title: "Samsung Galaxy S24 Ultra",
				description: "Smartphone Samsung flagship avec S Pen intégré, caméra 200MP et Galaxy AI.",
				category: "Téléphonie",
				tags: ["samsung", "galaxy", "smartphone", "android"],
				price: 4800000,
				originalPrice: 5200000,
				stock: { cache: { available: 20, reserved: 5 }, alert: { threshold: 5 } },
			},
			{
				sku: "TECH-004",
				title: "AirPods Pro 2ème génération",
				description: "Écouteurs sans fil Apple avec réduction active du bruit et audio spatial personnalisé.",
				category: "Électronique",
				tags: ["apple", "airpods", "ecouteurs", "audio"],
				price: 850000,
				originalPrice: 950000,
				stock: { cache: { available: 30, reserved: 3 }, alert: { threshold: 10 } },
			},
			{
				sku: "TECH-005",
				title: "Dell XPS 15 Intel Core i7",
				description: "Ultrabook premium avec écran OLED 3.5K, 32GB RAM, 1TB SSD.",
				category: "Informatique",
				tags: ["dell", "xps", "laptop", "windows"],
				price: 7200000,
				stock: { cache: { available: 5, reserved: 1 }, alert: { threshold: 2 } },
			},
		],
	},
	// Produits Mode Chic
	{
		shopName: "Mode Chic",
		products: [
			{
				sku: "MODE-001",
				title: "Robe été fleurie collection 2024",
				description: "Robe légère à motifs floraux, parfaite pour l'été malgache. 100% coton bio.",
				category: "Mode",
				tags: ["robe", "femme", "été", "fleurie"],
				price: 150000,
				originalPrice: 180000,
				stock: { cache: { available: 50, reserved: 10 }, alert: { threshold: 15 } },
			},
			{
				sku: "MODE-002",
				title: "Costume homme slim fit noir",
				description: "Costume élégant coupe slim, tissu italien. Parfait pour les occasions formelles.",
				category: "Mode",
				tags: ["costume", "homme", "formel", "noir"],
				price: 450000,
				originalPrice: 500000,
				stock: { cache: { available: 20, reserved: 2 }, alert: { threshold: 5 } },
			},
			{
				sku: "MODE-003",
				title: "Sac à main cuir véritable",
				description: "Sac à main en cuir de vache pleine fleur, fait à la main à Madagascar.",
				category: "Accessoires",
				tags: ["sac", "cuir", "femme", "artisanal"],
				price: 280000,
				originalPrice: 320000,
				stock: { cache: { available: 25, reserved: 5 }, alert: { threshold: 8 } },
			},
			{
				sku: "MODE-004",
				title: "Chaussures de sport Nike Air Max",
				description: "Chaussures de running Nike Air Max, confort et style au quotidien.",
				category: "Accessoires",
				tags: ["nike", "chaussures", "sport", "running"],
				price: 380000,
				stock: { cache: { available: 40, reserved: 8 }, alert: { threshold: 12 } },
			},
			{
				sku: "MODE-005",
				title: "Jean slim homme bleu délavé",
				description: "Jean slim fit en denim stretch, coupe moderne et confortable.",
				category: "Vêtements",
				tags: ["jean", "homme", "slim", "denim"],
				price: 120000,
				originalPrice: 140000,
				stock: { cache: { available: 60, reserved: 0 }, alert: { threshold: 20 } },
			},
		],
	},
	// Produits Bio Market
	{
		shopName: "Bio Market",
		products: [
			{
				sku: "BIO-001",
				title: "Huile essentielle de ravintsara 30ml",
				description: "Huile essentielle 100% pure et naturelle de Madagascar. Propriétés antivirales reconnues.",
				category: "Santé",
				tags: ["huile", "essentielle", "ravintsara", "bio"],
				price: 45000,
				stock: { cache: { available: 100, reserved: 15 }, alert: { threshold: 30 } },
			},
			{
				sku: "BIO-002",
				title: "Miel de litchi bio 500g",
				description: "Miel pur de litchi récolté dans les forêts de l'Est. Certifié bio.",
				category: "Alimentation",
				tags: ["miel", "litchi", "bio", "madagascar"],
				price: 35000,
				originalPrice: 40000,
				stock: { cache: { available: 80, reserved: 5 }, alert: { threshold: 25 } },
			},
			{
				sku: "BIO-003",
				title: "Chocolat noir 70% cacao bio",
				description: "Tablette de chocolat noir fabriquée avec du cacao malgache premium.",
				category: "Alimentation",
				tags: ["chocolat", "cacao", "bio", "premium"],
				price: 25000,
				stock: { cache: { available: 120, reserved: 20 }, alert: { threshold: 40 } },
			},
			{
				sku: "BIO-004",
				title: "Spiruline en poudre 250g",
				description: "Spiruline cultivée à Madagascar, riche en protéines et nutriments essentiels.",
				category: "Santé",
				tags: ["spiruline", "superaliment", "proteine", "bio"],
				price: 85000,
				originalPrice: 95000,
				stock: { cache: { available: 45, reserved: 3 }, alert: { threshold: 15 } },
			},
			{
				sku: "BIO-005",
				title: "Vanille bourbon gousses premium 100g",
				description: "Gousses de vanille bourbon de Madagascar, qualité export, séchage traditionnel.",
				category: "Alimentation",
				tags: ["vanille", "bourbon", "premium", "épice"],
				price: 180000,
				originalPrice: 200000,
				stock: { cache: { available: 30, reserved: 8 }, alert: { threshold: 10 } },
			},
		],
	},
];

async function seedProducts() {
	try {
		console.log("🚀 Connexion à la base de données...");
		await mongoose.connect(config.mongoUri);
		console.log("✅ Connecté à MongoDB");

		const createdProducts = [];
		let totalCreated = 0;
		let totalSkipped = 0;

		for (const shopData of PRODUCTS_DATA) {
			// Trouver la boutique
			const shop = await Shop.findOne({ name: shopData.shopName }).populate("sellerId");
			
			if (!shop) {
				console.log(`⚠️  Boutique "${shopData.shopName}" non trouvée. Exécutez d'abord shop.seed.js`);
				continue;
			}

			console.log(`\n🏪 Traitement de la boutique: ${shop.name}`);

			for (const productData of shopData.products) {
				// Vérifier si le produit existe déjà
				const existingProduct = await Product.findOne({ sku: productData.sku });
				
				if (existingProduct) {
					console.log(`   ℹ️  Produit ${productData.sku} existe déjà`);
					totalSkipped++;
					continue;
				}

				// Créer le produit
				const product = await Product.create({
					shopId: shop._id,
					sellerId: shop.sellerId._id,
					sku: productData.sku,
					title: productData.title,
					description: productData.description,
					category: productData.category,
					tags: productData.tags,
					price: productData.price,
					originalPrice: productData.originalPrice || null,
					stock: productData.stock,
					status: "ACTIVE", // Produits actifs pour les tests
				});

				createdProducts.push({ shop: shop.name, product });
				totalCreated++;
				console.log(`   ✅ Produit créé: ${product.title}`);
			}
		}

		console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
		console.log("✅ Seed des produits terminé!");
		console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
		console.log(`\n📊 Résumé:`);
		console.log(`   ✅ Produits créés: ${totalCreated}`);
		console.log(`   ⏭️  Produits ignorés (existants): ${totalSkipped}`);

		if (createdProducts.length > 0) {
			console.log("\n📋 Produits créés par boutique:");
			
			const groupedByShop = {};
			for (const { shop, product } of createdProducts) {
				if (!groupedByShop[shop]) groupedByShop[shop] = [];
				groupedByShop[shop].push(product);
			}

			for (const [shopName, products] of Object.entries(groupedByShop)) {
				console.log(`\n🏪 ${shopName}:`);
				for (const product of products) {
					const priceFormatted = new Intl.NumberFormat("fr-MG").format(product.price);
					console.log(`   📦 ${product.sku} - ${product.title} (${priceFormatted} MGA)`);
				}
			}
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
seedProducts();
