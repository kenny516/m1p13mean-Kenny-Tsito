import * as walletService from "../services/wallet.service.js";

/**
 * Contrôleur de gestion des wallets
 * Gère uniquement les requêtes/réponses HTTP
 */

/**
 * Récupère le wallet de l'utilisateur connecté
 * GET /api/wallets
 */
export const getMyWallet = async (req, res, next) => {
  try {
    const wallet = await walletService.getUserWallet(req.user._id);

    res.json({
      success: true,
      data: wallet,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupère l'historique des transactions
 * GET /api/wallets/transactions
 */
export const getTransactions = async (req, res, next) => {
  try {
    const { page, limit, type, status, startDate, endDate } = req.query;

    const filters = {};
    if (type) filters.type = type;
    if (status) filters.status = status;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const pagination = {
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 10,
    };

    const result = await walletService.getWalletTransactions(
      req.user._id,
      filters,
      pagination,
    );

    res.json({
      success: true,
      data: result.transactions,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Effectue un dépôt
 * POST /api/wallets/deposit
 */
export const deposit = async (req, res, next) => {
  try {
    const { amount, paymentMethod, description } = req.body;

    const result = await walletService.creditWallet(
      req.user._id,
      amount,
      paymentMethod,
      description,
    );

    res.status(201).json({
      success: true,
      data: result,
      message: "Dépôt effectué avec succès",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Effectue un retrait
 * POST /api/wallets/withdraw
 */
export const withdraw = async (req, res, next) => {
  try {
    const { amount, paymentMethod, description } = req.body;

    const result = await walletService.debitWallet(
      req.user._id,
      amount,
      paymentMethod,
      description,
    );

    res.status(201).json({
      success: true,
      data: result,
      message: "Retrait effectué avec succès",
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getMyWallet,
  getTransactions,
  deposit,
  withdraw,
};
