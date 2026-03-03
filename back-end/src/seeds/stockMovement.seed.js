import mongoose from "mongoose";
import Product from "../models/Product.js";
import StockMovement from "../models/StockMovement.js";
import StockMovementLine from "../models/StockMovementLine.js";
import config from "../config/env.js";
import * as stockMovementService from "../services/stockMovement.service.js";

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

const resolveId = (value) => {
	if (!value) return null;
	if (typeof value === "string") return value;
	if (value?._id) return value._id.toString();
	if (typeof value.toString === "function") {
		const stringValue = value.toString();
		if (stringValue && stringValue !== "[object Object]") return stringValue;
	}
	return null;
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

		const resolvedShopId = resolveId(product.shopId);
		const resolvedSellerId = resolveId(product.sellerId);

		if (!resolvedShopId || !resolvedSellerId) {
			console.log(`⚠️  Invalid shop/seller reference for ${plan.sku}, skipping`);
			skippedCount += plan.movements.length;
			continue;
		}

		for (const move of plan.movements) {
			try {
				const payload = {
					movementType: move.type,
					shopId: resolvedShopId,
					note: `${SEED_NOTE} - ${move.notes || "seed"}`,
					date: new Date(),
					items: [
						{
							productId: product._id.toString(),
							shopId: resolvedShopId,
							quantity: move.quantity,
							unitPrice: move.unitPrice || 0,
						},
					],
				};

				if (move.type === "SALE") {
					payload.sale = {
						paymentMethod: move.paymentMethod || "CARD",
					};
				}

				const movement = await stockMovementService.createMovement(
					payload,
					resolvedSellerId,
				);

				if (move.type === "SALE" && move.saleStatus === "DELIVERED") {
					await stockMovementService.updateSaleStatus(
						movement._id.toString(),
						{ status: "DELIVERED" },
						resolvedSellerId,
					);
				}

				createdCount += 1;
				console.log(`✅ ${move.type} created for ${plan.sku} (qty ${move.quantity})`);
			} catch (error) {
				console.log(`⏭️  Skipping ${move.type} for ${plan.sku}: ${error.message}`);
				skippedCount += 1;
			}
		}
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
