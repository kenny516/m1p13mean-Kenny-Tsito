import mongoose from "mongoose";
import User from "../models/User.js";
import Shop from "../models/Shop.js";
import WalletTransaction from "../models/WalletTransaction.js";
import config from "../config/env.js";
import * as walletService from "../services/wallet.service.js";

const SEED_TAG = "wallet-seed-2026-03";

const WALLET_OPERATIONS = [
  {
    targetType: "USER",
    identifier: "techstore@marketplace.mg",
    operations: [
      { type: "DEPOSIT", amount: 2000000, description: "Initial deposit" },
      { type: "WITHDRAWAL", amount: 500000, description: "Payout to bank" },
    ],
  },
  {
    targetType: "USER",
    identifier: "modechic@marketplace.mg",
    operations: [
      { type: "DEPOSIT", amount: 1000000, description: "Initial deposit" },
      { type: "WITHDRAWAL", amount: 200000, description: "Supplier payment" },
    ],
  },
  {
    targetType: "USER",
    identifier: "admin@marketplace.mg",
    operations: [
      { type: "DEPOSIT", amount: 500000, description: "Admin float" },
    ],
  },
  {
    targetType: "SHOP",
    identifier: "TechStore Madagascar",
    operations: [
      { type: "SALE_INCOME", amount: 1100000, description: "Seed sale income" },
      { type: "COMMISSION", amount: 110000, description: "Seed commission debit" },
      { type: "REFUND", amount: 55000, description: "Seed commission refund" },
    ],
  },
  {
    targetType: "SHOP",
    identifier: "Mode Chic",
    operations: [
      { type: "SALE_INCOME", amount: 450000, description: "Seed sale income" },
      { type: "COMMISSION", amount: 54000, description: "Seed commission debit" },
    ],
  },
];

async function seedWallets() {
  console.log("🚀 Connecting to Mongo...");
  await mongoose.connect(config.mongoUri);
  console.log("✅ Connected");

  const existingSeed = await WalletTransaction.findOne({ "metadata.seedTag": SEED_TAG });
  if (existingSeed) {
    console.log("ℹ️  Wallet seed already applied; skipping to stay idempotent.");
    await mongoose.disconnect();
    process.exit(0);
  }

  let createdTx = 0;
  for (const entry of WALLET_OPERATIONS) {
    let ownerId = null;
    let ownerModel = "User";

    if (entry.targetType === "SHOP") {
      const shop = await Shop.findOne({ name: entry.identifier }).select("_id");
      if (!shop) {
        console.log(`⚠️  Shop ${entry.identifier} not found, skipping`);
        continue;
      }
      ownerId = shop._id;
      ownerModel = "Shop";
    } else {
      const user = await User.findOne({ email: entry.identifier }).select("_id");
      if (!user) {
        console.log(`⚠️  User ${entry.identifier} not found, skipping`);
        continue;
      }
      ownerId = user._id;
      ownerModel = "User";
    }

    await walletService.ensureWalletByOwner({ ownerId, ownerModel });

    for (const op of entry.operations) {
      try {
        const isCredit = ["DEPOSIT", "SALE_INCOME", "TRANSFER_IN", "REFUND"].includes(op.type);

        if (isCredit) {
          await walletService.creditWalletByOwner(
            { ownerId, ownerModel },
            op.amount,
            {
              type: op.type,
              paymentMethod: "WALLET",
              description: op.description,
              metadata: { seedTag: SEED_TAG },
            },
          );
        } else {
          await walletService.debitWalletByOwner(
            { ownerId, ownerModel },
            op.amount,
            {
              type: op.type,
              paymentMethod: "WALLET",
              description: op.description,
              metadata: { seedTag: SEED_TAG },
            },
          );
        }

        createdTx += 1;
        console.log(`✅ ${op.type} recorded for ${entry.identifier} (amount ${op.amount})`);
      } catch (error) {
        console.log(`⏭️  Skipping ${op.type} for ${entry.identifier}: ${error.message}`);
      }
    }
  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`✅ Wallet transactions created: ${createdTx}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  await mongoose.disconnect();
  console.log("👋 Disconnected");
  process.exit(0);
}

seedWallets().catch((err) => {
  console.error("❌ Wallet seed failed", err);
  process.exit(1);
});
