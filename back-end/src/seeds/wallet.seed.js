import mongoose from "mongoose";
import User from "../models/User.js";
import Shop from "../models/Shop.js";
import Wallet from "../models/Wallet.js";
import WalletTransaction from "../models/WalletTransaction.js";
import config from "../config/env.js";

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

const applyBalance = (wallet, op) => {
  const balanceBefore = wallet.balance;
  let balanceAfter = balanceBefore;

  if (["DEPOSIT", "SALE_INCOME", "TRANSFER_IN", "REFUND"].includes(op.type)) {
    balanceAfter += op.amount;
    wallet.totalEarned += op.amount;
  } else {
    balanceAfter -= op.amount;
    wallet.totalSpent += op.amount;
  }

  if (balanceAfter < 0) {
    throw new Error(`Operation ${op.type} would make balance negative for ${wallet._id}`);
  }

  wallet.balance = balanceAfter;
  return { balanceBefore, balanceAfter };
};

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

    const wallet = await Wallet.findOne({ ownerId, ownerModel });
    if (!wallet) {
      console.log(`⚠️  Wallet for ${entry.identifier} (${ownerModel}) not found, skipping`);
      continue;
    }

    for (const op of entry.operations) {
      const { balanceBefore, balanceAfter } = applyBalance(wallet, op);

      await WalletTransaction.create({
        walletId: wallet._id,
        type: op.type,
        amount: op.amount,
        balanceBefore,
        balanceAfter,
        status: "COMPLETED",
        description: op.description,
        metadata: { seedTag: SEED_TAG },
      });
      createdTx += 1;
      console.log(`✅ ${op.type} recorded for ${entry.identifier} (amount ${op.amount})`);
    }

    await wallet.save();
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
