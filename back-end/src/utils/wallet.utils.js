import Wallet from "../models/Wallet.js";

/**
 * Créer un wallet pour un utilisateur ou une boutique
 * @param {string} ownerId - ID du propriétaire
 * @param {string} ownerModel - Type de propriétaire ('User' ou 'Shop')
 * @param {Object} session - Session Mongoose pour la transaction
 * @returns {Promise<Object>} Wallet créé
 */
export const createWallet = async (ownerId, ownerModel, session) => {
  const wallet = await Wallet.create(
    [
      {
        ownerId,
        ownerModel,
        balance: 0,
        pendingBalance: 0,
        currency: "MGA",
      },
    ],
    { session },
  );

  return wallet[0];
};

/**
 * Mettre à jour le solde d'un wallet
 * @param {string} walletId - ID du wallet
 * @param {number} amount - Montant à ajouter/retirer
 * @param {Object} session - Session Mongoose pour la transaction
 * @returns {Promise<Object>} Wallet mis à jour
 */
export const updateWalletBalance = async (walletId, amount, session) => {
  const wallet = await Wallet.findById(walletId).session(session);

  if (!wallet) {
    throw new Error("Wallet introuvable");
  }

  wallet.balance += amount;

  if (wallet.balance < 0) {
    throw new Error("Solde insuffisant");
  }

  await wallet.save({ session });
  return wallet;
};
