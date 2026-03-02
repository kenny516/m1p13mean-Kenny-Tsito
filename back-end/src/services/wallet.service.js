import { Wallet, WalletTransaction } from "../models/index.js";
import { ApiError } from "../middlewares/error.middleware.js";

/**
 * Service de gestion des wallets
 * Opérations sur les portefeuilles et transactions
 */

/**
 * Récupère le wallet d'un utilisateur
 */
export const getUserWallet = async (userId) => {
  const wallet = await Wallet.findOne({ ownerId: userId, ownerModel: "User" });

  if (!wallet) {
    throw new ApiError(404, "NOT_FOUND", "Portefeuille non trouvé");
  }

  return {
    _id: wallet._id,
    balance: wallet.balance,
    currency: wallet.currency,
    pendingBalance: wallet.pendingBalance,
    totalEarned: wallet.totalEarned,
    totalSpent: wallet.totalSpent,
    isActive: wallet.isActive,
  };
};

export const ensureWalletByOwner = async (
  { ownerId, ownerModel = "User" },
  options = {},
) => {
  const session = options.session || null;

  const findQuery = Wallet.findOne({ ownerId, ownerModel });
  if (session) findQuery.session(session);
  const existingWallet = await findQuery;
  if (existingWallet) return existingWallet;

  const createOptions = session ? { session } : {};
  const [wallet] = await Wallet.create(
    [{ ownerId, ownerModel }],
    createOptions,
  );

  return wallet;
};

/**
 * Récupère l'historique des transactions d'un wallet
 */
export const getWalletTransactions = async (
  userId,
  filters = {},
  pagination = {},
) => {
  const wallet = await Wallet.findOne({ ownerId: userId, ownerModel: "User" });

  if (!wallet) {
    throw new ApiError(404, "NOT_FOUND", "Portefeuille non trouvé");
  }

  const { type, status, startDate, endDate } = filters;
  const page = pagination.page || 1;
  const limit = pagination.limit || 10;
  const skip = (page - 1) * limit;

  // Construire la query
  const query = { walletId: wallet._id };
  if (type) query.type = type;
  if (status) query.status = status;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const [transactions, total] = await Promise.all([
    WalletTransaction.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    WalletTransaction.countDocuments(query),
  ]);

  return {
    transactions: transactions.map((t) => ({
      _id: t._id,
      type: t.type,
      amount: t.amount,
      balanceBefore: t.balanceBefore,
      balanceAfter: t.balanceAfter,
      status: t.status,
      paymentMethod: t.paymentMethod,
      description: t.description,
      createdAt: t.createdAt,
    })),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  };
};

/**
 * Crédite un wallet (dépôt)
 */
export const creditWallet = async (
  userId,
  amount,
  paymentMethod,
  description = "",
  options = {},
) => {
  const session = options.session || null;

  if (amount <= 0) {
    throw new ApiError(400, "INVALID_AMOUNT", "Le montant doit être positif");
  }

  const walletQuery = Wallet.findOne({ ownerId: userId, ownerModel: "User" });
  if (session) walletQuery.session(session);
  const wallet = await walletQuery;

  if (!wallet) {
    throw new ApiError(404, "NOT_FOUND", "Portefeuille non trouvé");
  }

  const balanceBefore = wallet.balance;
  const balanceAfter = balanceBefore + amount;

  // Créer la transaction
  const createOptions = session ? { session } : {};
  const [transaction] = await WalletTransaction.create(
    [
      {
        walletId: wallet._id,
        type: "DEPOSIT",
        amount,
        balanceBefore,
        balanceAfter,
        status: "COMPLETED",
        paymentMethod,
        description,
      },
    ],
    createOptions,
  );

  // Mettre à jour le wallet
  await Wallet.findByIdAndUpdate(
    wallet._id,
    {
      $inc: { balance: amount, totalEarned: amount },
    },
    session ? { session } : undefined,
  );

  return {
    transaction: {
      _id: transaction._id,
      type: transaction.type,
      amount: transaction.amount,
      balanceAfter: transaction.balanceAfter,
      status: transaction.status,
    },
    newBalance: balanceAfter,
  };
};

/**
 * Débite un wallet (retrait)
 */
export const debitWallet = async (
  userId,
  amount,
  paymentMethod,
  description = "",
  options = {},
) => {
  return debitWalletByOwner(
    { ownerId: userId, ownerModel: "User" },
    amount,
    {
      paymentMethod,
      description,
      type: "WITHDRAWAL",
      allowNegative: false,
      session: options.session || null,
    },
  );
};

export const debitWalletByOwner = async (
  { ownerId, ownerModel = "User" },
  amount,
  options = {},
) => {
  const {
    paymentMethod = "WALLET",
    description = "",
    type = "WITHDRAWAL",
    allowNegative = false,
    stockMovementId,
    metadata,
    status = "COMPLETED",
    session = null,
  } = options;

  if (amount <= 0) {
    throw new ApiError(400, "INVALID_AMOUNT", "Le montant doit être positif");
  }

  const walletQuery = Wallet.findOne({ ownerId, ownerModel });
  if (session) walletQuery.session(session);
  const wallet = await walletQuery;

  if (!wallet) {
    throw new ApiError(404, "NOT_FOUND", "Portefeuille non trouvé");
  }

  if (!allowNegative && wallet.balance < amount) {
    throw new ApiError(400, "INSUFFICIENT_BALANCE", "Solde insuffisant");
  }

  const balanceBefore = wallet.balance;
  const balanceAfter = balanceBefore - amount;

  // Créer la transaction
  const createOptions = session ? { session } : {};
  const [transaction] = await WalletTransaction.create(
    [
      {
        walletId: wallet._id,
        type,
        amount,
        balanceBefore,
        balanceAfter,
        status,
        paymentMethod,
        description,
        stockMovementId,
        metadata,
      },
    ],
    createOptions,
  );

  // Mettre à jour le wallet
  await Wallet.findByIdAndUpdate(
    wallet._id,
    {
      $inc: { balance: -amount, totalSpent: amount },
    },
    session ? { session } : undefined,
  );

  return {
    transaction: {
      _id: transaction._id,
      type: transaction.type,
      amount: transaction.amount,
      balanceAfter: transaction.balanceAfter,
      status: transaction.status,
    },
    newBalance: balanceAfter,
  };
};

export const creditWalletByOwner = async (
  { ownerId, ownerModel = "User" },
  amount,
  options = {},
) => {
  const {
    paymentMethod = "WALLET",
    description = "",
    type = "DEPOSIT",
    stockMovementId,
    metadata,
    status = "COMPLETED",
    session = null,
  } = options;

  if (amount <= 0) {
    throw new ApiError(400, "INVALID_AMOUNT", "Le montant doit être positif");
  }

  const walletQuery = Wallet.findOne({ ownerId, ownerModel });
  if (session) walletQuery.session(session);
  const wallet = await walletQuery;

  if (!wallet) {
    throw new ApiError(404, "NOT_FOUND", "Portefeuille non trouvé");
  }

  const balanceBefore = wallet.balance;
  const balanceAfter = balanceBefore + amount;

  const createOptions = session ? { session } : {};
  const [transaction] = await WalletTransaction.create(
    [
      {
        walletId: wallet._id,
        type,
        amount,
        balanceBefore,
        balanceAfter,
        status,
        paymentMethod,
        description,
        stockMovementId,
        metadata,
      },
    ],
    createOptions,
  );

  await Wallet.findByIdAndUpdate(
    wallet._id,
    {
      $inc: { balance: amount, totalEarned: amount },
    },
    session ? { session } : undefined,
  );

  return {
    transaction: {
      _id: transaction._id,
      type: transaction.type,
      amount: transaction.amount,
      balanceAfter: transaction.balanceAfter,
      status: transaction.status,
    },
    newBalance: balanceAfter,
  };
};

export default {
  ensureWalletByOwner,
  getUserWallet,
  getWalletTransactions,
  creditWallet,
  debitWallet,
  debitWalletByOwner,
  creditWalletByOwner,
};
