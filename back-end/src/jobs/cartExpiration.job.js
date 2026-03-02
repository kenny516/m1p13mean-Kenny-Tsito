import Cart from "../models/Cart.js";
import { runCartExpirationOnce } from "../services/cart.service.js";

const DEFAULT_CART_EXPIRATION_JOB_INTERVAL_MS = 15 * 60 * 1000;
const DEFAULT_CART_EXPIRATION_JOB_BATCH_SIZE = 50;

let intervalId = null;
let isRunning = false;

const disableLegacyTTLIndex = async () => {
  try {
    const indexes = await Cart.collection.indexes();
    const ttlIndex = indexes.find(
      (index) =>
        index.key?.expiresAt === 1 &&
        typeof index.expireAfterSeconds === "number",
    );

    if (!ttlIndex) {
      return;
    }

    await Cart.collection.dropIndex(ttlIndex.name);
    console.log(
      `[cart-expiration] Legacy TTL index dropped: ${ttlIndex.name}`,
    );
  } catch (error) {
    console.error(
      "[cart-expiration] Impossible de supprimer l'index TTL legacy:",
      error.message,
    );
  }
};

export const startCartExpirationJob = ({
  intervalMs = Number(process.env.CART_EXPIRATION_JOB_INTERVAL_MS) ||
    DEFAULT_CART_EXPIRATION_JOB_INTERVAL_MS,
  batchSize = Number(process.env.CART_EXPIRATION_JOB_BATCH_SIZE) ||
    DEFAULT_CART_EXPIRATION_JOB_BATCH_SIZE,
} = {}) => {
  if (intervalId) {
    return;
  }

  const tick = async () => {
    if (isRunning) {
      return;
    }

    isRunning = true;

    let result = null;
    try {
      result = await runCartExpirationOnce({ batchSize });
    } finally {
      isRunning = false;
    }

    if (!result.skipped && (result.processed > 0 || result.errors > 0)) {
      console.log(
        `[cart-expiration] processed=${result.processed}, errors=${result.errors}, ttl=${result.ttlMinutes}m, inspected=${result.inspected}`,
      );
    }
  };

  disableLegacyTTLIndex().catch((error) => {
    console.error("[cart-expiration] TTL cleanup failed:", error.message);
  });

  intervalId = setInterval(() => {
    tick().catch((error) => {
      console.error("[cart-expiration] Tick failed:", error.message);
    });
  }, intervalMs);

  tick().catch((error) => {
    console.error("[cart-expiration] Initial run failed:", error.message);
  });

  console.log(
    `[cart-expiration] Job started (interval=${intervalMs}ms, batch=${batchSize})`,
  );
};

export const stopCartExpirationJob = () => {
  if (!intervalId) {
    return;
  }

  clearInterval(intervalId);
  intervalId = null;
  console.log("[cart-expiration] Job stopped");
};
