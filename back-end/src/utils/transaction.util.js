import mongoose from "mongoose";

/**
 * Cache pour savoir si les transactions sont supportées
 */
let transactionsSupported = null;

/**
 * Vérifie si MongoDB supporte les transactions (replica set ou mongos)
 * @returns {Promise<boolean>} True si les transactions sont supportées
 */
export const checkTransactionSupport = async () => {
  if (transactionsSupported !== null) {
    return transactionsSupported;
  }

  try {
    const admin = mongoose.connection.db.admin();
    const serverStatus = await admin.serverStatus();

    // Vérifier si c'est un replica set ou mongos
    const isReplicaSet = serverStatus.repl !== undefined;
    const isMongos = serverStatus.process === "mongos";

    transactionsSupported = isReplicaSet || isMongos;

    if (!transactionsSupported) {
      console.warn("⚠️ MongoDB standalone détecté - transactions désactivées");
    }

    return transactionsSupported;
  } catch (error) {
    // En cas d'erreur, on suppose que les transactions ne sont pas supportées
    console.warn(
      "⚠️ Impossible de vérifier le support des transactions:",
      error.message,
    );
    transactionsSupported = false;
    return false;
  }
};

/**
 * Exécute une opération avec ou sans transaction selon le support MongoDB
 * @param {Function} operation - Fonction async qui prend (session?) en paramètre
 * @returns {Promise<any>} Le résultat de l'opération
 */
export const withOptionalTransaction = async (operation) => {
  const supportsTransactions = await checkTransactionSupport();

  if (supportsTransactions) {
    // Exécuter avec transaction
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const result = await operation(session);
      await session.commitTransaction();
      return result;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } else {
    // Exécuter sans transaction
    return operation(null);
  }
};

/**
 * Crée un wrapper de session optionnel
 * @param {ClientSession|null} providedSession - Session fournie ou null
 * @returns {Promise<{session: ClientSession|null, ownsSession: boolean, commit: Function, abort: Function, end: Function}>}
 */
export const createOptionalSession = async (providedSession = null) => {
  const supportsTransactions = await checkTransactionSupport();

  if (!supportsTransactions) {
    // Pas de support des transactions, retourner un wrapper no-op
    return {
      session: null,
      ownsSession: false,
      commit: async () => {},
      abort: async () => {},
      end: async () => {},
    };
  }

  if (providedSession) {
    // Session fournie, ne pas la gérer
    return {
      session: providedSession,
      ownsSession: false,
      commit: async () => {},
      abort: async () => {},
      end: async () => {},
    };
  }

  // Créer une nouvelle session
  const session = await mongoose.startSession();
  session.startTransaction();

  return {
    session,
    ownsSession: true,
    commit: async () => {
      await session.commitTransaction();
    },
    abort: async () => {
      await session.abortTransaction();
    },
    end: async () => {
      session.endSession();
    },
  };
};
