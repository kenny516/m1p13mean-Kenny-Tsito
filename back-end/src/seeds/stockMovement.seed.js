import mongoose from "mongoose";
import Product from "../models/Product.js";
import Shop from "../models/Shop.js";
import User from "../models/User.js";
import StockMovement, { IN_MOVEMENTS } from "../models/StockMovement.js";
import StockMovementLine from "../models/StockMovementLine.js";
import config from "../config/env.js";

// Seed tag to keep runs traceable
const SEED_NOTE = "seed-stock-2026-03";

// Minimal movement plan per product SKU
const MOVEMENT_PLAN = [
	{
		sku: "TECH-001",
		movements: [
			{ type: "SUPPLY", quantity: 10, unitPrice: 4200000, notes: "Initial restock" },
			{
				type: "SALE",
				quantity: 2,
				unitPrice: 5500000,
				buyerEmail: "buyer@test.com",
				paymentMethod: "CARD",
				saleStatus: "DELIVERED",
			},
			{
				type: "RETURN_CUSTOMER",
				quantity: 1,
				unitPrice: 5500000,
				notes: "Customer returned one item",
			},
		],
	},
	{
		sku: "MODE-002",
		movements: [
			{ type: "SUPPLY", quantity: 15, unitPrice: 280000, notes: "Seasonal restock" },
			{
				type: "SALE",
				quantity: 1,
				unitPrice: 450000,
				buyerEmail: "buyer@test.com",
				paymentMethod: "MOBILE_MONEY",
				saleStatus: "CONFIRMED",
			},
		],
	},
	{
		sku: "BIO-001",
		movements: [
			{ type: "SUPPLY", quantity: 40, unitPrice: 28000, notes: "Bulk refill" },
			{ type: "SUPPLY", quantity: 20, unitPrice: 29000, notes: "Additional stock" },
		],
	},
];

const computeDirection = (movementType) => (IN_MOVEMENTS.includes(movementType) ? "IN" : "OUT");

const applyMovementTotals = (direction, quantity, runningTotal) => {
	if (direction === "IN") return runningTotal + quantity;
	return runningTotal - quantity;
};

async function seedStockMovements() {
	console.log("🚀 Connecting to Mongo...");
	await mongoose.connect(config.mongoUri);
	console.log("✅ Connected");

	// Clean previous seed batch to stay idempotent
	const previousHeaders = await StockMovement.find({ note: /seed-stock-2026-/ }).select("_id");
	const headerIds = previousHeaders.map((header) => header._id);
	if (headerIds.length) {
		await StockMovementLine.deleteMany({ moveId: { $in: headerIds } });
		await StockMovement.deleteMany({ _id: { $in: headerIds } });
	}

	let createdCount = 0;
	let skippedCount = 0;

	for (const plan of MOVEMENT_PLAN) {
		const product = await Product.findOne({ sku: plan.sku }).populate("shopId sellerId");
		if (!product) {
			console.log(`⚠️  Product ${plan.sku} not found, skipping`);
			skippedCount += plan.movements.length;
			continue;
		}

		// Start from the larger of cached stock and calculated stock to avoid negatives
		const snapshot = await StockMovementLine.calculateStock(product._id);
		let runningTotal = Math.max(snapshot.total || 0, product.stock?.cache?.total || 0);

		for (const move of plan.movements) {
			const direction = computeDirection(move.type);
			const stockBefore = runningTotal;
			const stockAfter = applyMovementTotals(direction, move.quantity, runningTotal);

			if (stockAfter < 0) {
				console.log(`⏭️  Skipping ${move.type} for ${plan.sku} (insufficient stock)`);
				skippedCount += 1;
				continue;
			}

			const movementDoc = {
				movementType: move.type,
				direction,
				performedBy: product.sellerId,
				shopId: product.shopId,
				note: SEED_NOTE,
				date: new Date(),
			};

			if (move.type === "SALE") {
				const saleStatus = move.saleStatus || "CONFIRMED";
				movementDoc.sale = {
					paymentMethod: move.paymentMethod,
					status: saleStatus,
					confirmedAt: new Date(),
					deliveredAt: saleStatus === "DELIVERED" ? new Date() : undefined,
				};
			}

			const [movement] = await StockMovement.create([movementDoc]);

			const lineDoc = {
				reference: `${movement.reference}-${product._id}`,
				moveId: movement._id,
				productId: product._id,
				shopId: product.shopId,
				movementType: move.type,
				direction,
				quantity: move.quantity,
				unitPrice: move.unitPrice || 0,
				totalAmount: (move.quantity || 0) * (move.unitPrice || 0),
				stockBefore,
				stockAfter,
				performedBy: product.sellerId,
				date: new Date(),
			};

			const [line] = await StockMovementLine.create([lineDoc]);

			movement.lineIds = [line._id];
			movement.totalAmount = line.totalAmount || 0;
			await movement.save();
			createdCount += 1;
			runningTotal = stockAfter;
			console.log(`✅ ${move.type} created for ${plan.sku} (qty ${move.quantity})`);
		}

		// Sync product stock cache with aggregated movements
		const updatedStock = await StockMovementLine.calculateStock(product._id);
		product.stock.cache.total = updatedStock.total;
		product.stock.cache.reserved = updatedStock.reserved;
		product.stock.cache.available = updatedStock.available;
		product.stock.cache.lastUpdated = new Date();
		await product.save();
	}

	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
	console.log(`✅ Stock movements created: ${createdCount}`);
	console.log(`⏭️  Movements skipped: ${skippedCount}`);
	console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

	await mongoose.disconnect();
	console.log("👋 Disconnected");
	process.exit(0);
}

seedStockMovements().catch((err) => {
	console.error("❌ Seed failed", err);
	process.exit(1);
});
