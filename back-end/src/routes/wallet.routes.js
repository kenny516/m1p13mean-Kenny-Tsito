import { Router } from "express";
import * as walletController from "../controllers/wallet.controller.js";
import { auth } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  depositSchema,
  withdrawSchema,
} from "../validations/wallet.validation.js";

const router = Router();

// Toutes les routes wallet nécessitent authentification
router.use(auth);

/**
 * @route   GET /api/wallets
 * @desc    Récupérer le wallet de l'utilisateur connecté
 * @access  Private
 */
router.get("/", walletController.getMyWallet);

/**
 * @route   GET /api/wallets/transactions
 * @desc    Récupérer l'historique des transactions
 * @access  Private
 * @query   page, limit, type, status, startDate, endDate
 */
router.get("/transactions", walletController.getTransactions);

/**
 * @route   POST /api/wallets/deposit
 * @desc    Effectuer un dépôt
 * @access  Private
 */
router.post("/deposit", validate(depositSchema), walletController.deposit);

/**
 * @route   POST /api/wallets/withdraw
 * @desc    Effectuer un retrait
 * @access  Private
 */
router.post("/withdraw", validate(withdrawSchema), walletController.withdraw);

export default router;
