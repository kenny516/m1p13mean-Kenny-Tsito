import mongoose from "mongoose";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import Shop from "../models/Shop.js";
import StockMovement from "../models/StockMovement.js";
import StockMovementLine from "../models/StockMovementLine.js";
import WalletTransaction from "../models/WalletTransaction.js";
import { ApiError } from "../middlewares/error.middleware.js";
import {
  createStockMovement,
  createCartMovementLine,
} from "./stockMovementLine.service.js";
import { updateSaleStatus } from "./stockMovement.service.js";
import {
  debitWallet,
  debitWalletByOwner,
  creditWalletByOwner,
} from "./wallet.service.js";
import { requireActiveProduct } from "./product.service.js";
import { requireActiveShop } from "./shop.service.js";
import { createOptionalSession } from "../utils/transaction.util.js";
import * as settingsService from "./settings.service.js";

// Fallback si les settings ne sont pas encore initialisés
const DEFAULT_CART_TTL_MINUTES = 120;

/**
 * Récupère la durée de vie du panier depuis les paramètres globaux
 * @returns {Promise<number>} La durée de vie du panier en minutes
 */
export const getCartTTL = async () => {
  try {
    return await settingsService.getCartTTLMinutes();
  } catch {
    return DEFAULT_CART_TTL_MINUTES;
  }
};

export const DEFAULT_CART_TTL = DEFAULT_CART_TTL_MINUTES;

const getExpiresAt = async () => {
  const ttl = await getCartTTL();
  return new Date(Date.now() + ttl * 60 * 1000);
};

const computeTotal = (items = []) =>
  items.reduce((sum, item) => sum + (item.totalAmount || 0), 0);

const loadShopCommissionRates = async (items = [], session = null) => {
  const uniqueShopIds = [
    ...new Set(items.map((item) => item.shopId?.toString()).filter(Boolean)),
  ];

  if (uniqueShopIds.length === 0) {
    return new Map();
  }

  const query = Shop.find({ _id: { $in: uniqueShopIds } }).select(
    "_id commissionRate",
  );
  if (session) query.session(session);

  const shops = await query;
  const rates = new Map();

  for (const shop of shops) {
    rates.set(shop._id.toString(), Number(shop.commissionRate) || 0);
  }

  return rates;
};

const groupSaleCommissionsByShop = async (saleId, session = null) => {
  const query = StockMovementLine.find({
    moveId: saleId,
    movementType: "SALE",
  }).select("shopId commissionAmount");

  if (session) query.session(session);

  const lines = await query;
  const grouped = new Map();

  for (const line of lines) {
    const shopId = line.shopId?.toString();
    if (!shopId) continue;
    const amount = Number(line.commissionAmount) || 0;
    grouped.set(shopId, (grouped.get(shopId) || 0) + amount);
  }

  return grouped;
};

const hasCommissionDebit = async (saleId, shopId, session = null) => {
  const query = WalletTransaction.findOne({
    type: "COMMISSION",
    stockMovementId: saleId,
    "metadata.shopId": shopId,
  }).select("_id");

  if (session) query.session(session);

  const existing = await query;
  return Boolean(existing);
};

const hasSaleIncomeCredit = async (saleId, shopId, session = null) => {
  const query = WalletTransaction.findOne({
    type: "SALE_INCOME",
    stockMovementId: saleId,
    "metadata.shopId": shopId,
  }).select("_id");

  if (session) query.session(session);

  const existing = await query;
  return Boolean(existing);
};

const hasRefundByType = async (
  stockMovementId,
  kind,
  shopId,
  session = null,
) => {
  const query = {
    type: "REFUND",
    stockMovementId,
    "metadata.kind": kind,
  };

  if (shopId) {
    query["metadata.shopId"] = shopId;
  }

  const findQuery = WalletTransaction.findOne(query).select("_id");
  if (session) findQuery.session(session);

  const existing = await findQuery;
  return Boolean(existing);
};

const hasWithdrawalByType = async (
  stockMovementId,
  kind,
  shopId,
  session = null,
) => {
  const query = {
    type: "WITHDRAWAL",
    stockMovementId,
    "metadata.kind": kind,
  };

  if (shopId) {
    query["metadata.shopId"] = shopId;
  }

  const findQuery = WalletTransaction.findOne(query).select("_id");
  if (session) findQuery.session(session);

  const existing = await findQuery;
  return Boolean(existing);
};

const creditCheckoutSalesToShops = async ({
  saleId,
  orderReference,
  cart,
  saleItems,
  session = null,
}) => {
  if (!saleId || !Array.isArray(saleItems) || saleItems.length === 0) {
    return;
  }

  const grossByShop = new Map();

  for (const item of saleItems) {
    const shopId = item.shopId?.toString();
    if (!shopId) continue;
    const lineTotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
    grossByShop.set(shopId, (grossByShop.get(shopId) || 0) + lineTotal);
  }

  for (const [shopId, grossAmount] of grossByShop.entries()) {
    const amount = Math.round(grossAmount);
    if (amount === 0) {
      continue;
    }

    const alreadyCredited = await hasSaleIncomeCredit(saleId, shopId, session);
    if (alreadyCredited) {
      continue;
    }

    await creditWalletByOwner(
      { ownerId: shopId, ownerModel: "Shop" },
      amount,
      {
        type: "SALE_INCOME",
        paymentMethod: "WALLET",
        description: `Revenu vente commande ${orderReference || cart._id}`,
        stockMovementId: saleId,
        metadata: {
          cartId: cart._id.toString(),
          saleId,
          shopId,
        },
        session,
      },
    );
  }
};

const debitDeliveryCommissions = async (cart, session = null) => {
  const saleId = cart?.order?.saleId;
  if (!saleId) {
    return;
  }

  const commissionByShop = await groupSaleCommissionsByShop(saleId, session);

  for (const [shopId, totalCommission] of commissionByShop.entries()) {
    const amount = Math.round(totalCommission);
    if (amount === 0) {
      continue;
    }

    const alreadyDebited = await hasCommissionDebit(saleId, shopId, session);
    if (alreadyDebited) {
      continue;
    }

    await debitWalletByOwner(
      { ownerId: shopId, ownerModel: "Shop" },
      amount,
      {
        type: "COMMISSION",
        allowNegative: true,
        paymentMethod: "WALLET",
        description: `Commission commande ${cart.order.reference || cart._id}`,
        stockMovementId: saleId,
        metadata: {
          cartId: cart._id.toString(),
          saleId,
          shopId,
        },
        session,
      },
    );
  }
};

const reverseSaleIncomeCredits = async ({
  saleId,
  returnMovementId,
  orderReference,
  cartId,
  session = null,
}) => {
  const query = WalletTransaction.find({
    type: "SALE_INCOME",
    stockMovementId: saleId,
  }).select("amount metadata");

  if (session) query.session(session);

  const saleIncomeTransactions = await query;

  for (const tx of saleIncomeTransactions) {
    const shopId = tx.metadata?.get("shopId") || tx.metadata?.shopId;
    if (!shopId) continue;

    const alreadyReversed = await hasWithdrawalByType(
      returnMovementId,
      "RETURN_SALE_INCOME",
      shopId,
      session,
    );

    if (alreadyReversed) {
      continue;
    }

    await debitWalletByOwner(
      { ownerId: shopId, ownerModel: "Shop" },
      Number(tx.amount) || 0,
      {
        type: "WITHDRAWAL",
        allowNegative: true,
        paymentMethod: "WALLET",
        description: `Annulation revenu vente commande ${orderReference || cartId}`,
        stockMovementId: returnMovementId,
        metadata: {
          kind: "RETURN_SALE_INCOME",
          cartId: cartId.toString(),
          saleId,
          returnMovementId,
          shopId,
        },
        session,
      },
    );
  }
};

const refundDeliveryCommissions = async ({
  saleId,
  returnMovementId,
  orderReference,
  cartId,
  session = null,
}) => {
  const query = WalletTransaction.find({
    type: "COMMISSION",
    stockMovementId: saleId,
  }).select("amount metadata");

  if (session) query.session(session);

  const commissionTransactions = await query;

  for (const tx of commissionTransactions) {
    const shopId = tx.metadata?.get("shopId") || tx.metadata?.shopId;
    if (!shopId) continue;

    const alreadyRefunded = await hasRefundByType(
      returnMovementId,
      "RETURN_COMMISSION",
      shopId,
      session,
    );

    if (alreadyRefunded) {
      continue;
    }

    await creditWalletByOwner(
      { ownerId: shopId, ownerModel: "Shop" },
      Number(tx.amount) || 0,
      {
        type: "REFUND",
        paymentMethod: "WALLET",
        description: `Remboursement commission commande ${orderReference || cartId}`,
        stockMovementId: returnMovementId,
        metadata: {
          kind: "RETURN_COMMISSION",
          cartId: cartId.toString(),
          saleId,
          returnMovementId,
          shopId,
        },
        session,
      },
    );
  }
};

const hasBuyerRefundForOrder = async (
  returnMovementId,
  cartId,
  session = null,
) => {
  const query = WalletTransaction.findOne({
    type: "REFUND",
    stockMovementId: returnMovementId,
    "metadata.kind": "RETURN_ORDER",
    "metadata.cartId": cartId.toString(),
  }).select("_id");

  if (session) query.session(session);

  const existing = await query;
  return Boolean(existing);
};

const buildItemSnapshot = (product) => {
  const unitPrice = product.price || 0;
  const images = (product.images || [])
    .map((image) => {
      if (typeof image === "string") return image;
      return image?.url || null;
    })
    .filter(Boolean);

  return {
    title: product.title,
    description: product.description,
    images,
    unitPrice,
    availableStock: product.stock?.cache?.available || 0,
  };
};

const findActiveCartByUser = async (userId, session = null) => {
  const query = Cart.findOne({ userId, status: "CART" });
  if (session) query.session(session);
  return (await query.exec()) || null;
};

export const releaseCartReservations = async (
  cart,
  { session = null, performedBy, note, skipMissingProduct = false } = {},
) => {
  if (!cart || !Array.isArray(cart.items) || cart.items.length === 0) {
    return;
  }

  for (const item of cart.items) {
    const productQuery = Product.findById(item.productId);
    if (session) productQuery.session(session);

    const product = await productQuery;
    if (!product) {
      if (skipMissingProduct) {
        console.warn(
          `[cart-expiration] Produit introuvable lors de la libération du panier ${cart._id} pour item ${item.productId}`,
        );
        continue;
      }
      throw new ApiError(404, "NOT_FOUND", "Produit non trouvé");
    }

    await createCartMovementLine(
      {
        productId: product._id.toString(),
        shopId: product.shopId.toString(),
        movementType: "RESERVATION_CANCEL",
        quantity: item.quantity,
        unitPrice: product.price,
        cartId: cart._id,
        date: new Date(),
        note,
      },
      performedBy,
      { session, product, cache: true },
    );
  }
};

const isCartExpiredByPolicy = (cart, now, ttlMinutes) => {
  if (!cart) {
    return false;
  }

  const expiresAt = cart.expiresAt ? new Date(cart.expiresAt) : null;
  const updatedAt = cart.updatedAt ? new Date(cart.updatedAt) : null;

  if (!expiresAt || !updatedAt || Number.isNaN(ttlMinutes)) {
    return false;
  }

  const dynamicExpiresAt = new Date(
    updatedAt.getTime() + ttlMinutes * 60 * 1000,
  );
  return expiresAt <= now && dynamicExpiresAt <= now;
};

const expireOneCart = async (cartId, now, ttlMinutes) => {
  const txn = await createOptionalSession();

  try {
    const cartQuery = Cart.findOne({ _id: cartId, status: "CART" });
    if (txn.session) {
      cartQuery.session(txn.session);
    }

    const cart = await cartQuery;
    if (!cart || !isCartExpiredByPolicy(cart, now, ttlMinutes)) {
      if (txn.ownsSession) {
        await txn.commit();
      }
      return { expired: false, skipped: true };
    }

    await releaseCartReservations(cart, {
      session: txn.session,
      note: "Cart expiration",
      skipMissingProduct: true,
    });

    // Marquer comme expiré mais conserver les items pour permettre la restauration
    cart.status = "EXPIRED";
    // Note: items et totalAmount sont conservés pour permettre la restauration ultérieure

    const saveOptions = txn.session ? { session: txn.session } : {};
    await cart.save(saveOptions);

    if (txn.ownsSession) {
      await txn.commit();
    }

    return { expired: true, skipped: false };
  } catch (error) {
    if (txn.ownsSession) {
      await txn.abort();
    }
    throw error;
  } finally {
    if (txn.ownsSession) {
      await txn.end();
    }
  }
};

export const runCartExpirationOnce = async ({ batchSize = 50 } = {}) => {
  const ttlMinutes = await getCartTTL();
  const now = new Date();

  const candidates = await Cart.find({
    status: "CART",
    expiresAt: { $lte: now },
  })
    .select("_id expiresAt updatedAt")
    .sort({ expiresAt: 1 })
    .limit(batchSize)
    .lean();

  let processed = 0;
  let errors = 0;

  for (const candidate of candidates) {
    if (!isCartExpiredByPolicy(candidate, now, ttlMinutes)) {
      continue;
    }

    try {
      const result = await expireOneCart(candidate._id, now, ttlMinutes);
      if (result.expired) {
        processed += 1;
      }
    } catch (error) {
      errors += 1;
      console.error(
        `[cart-expiration] Echec expiration panier ${candidate._id}:`,
        error.message,
      );
    }
  }

  return {
    skipped: false,
    processed,
    errors,
    inspected: candidates.length,
    ttlMinutes,
  };
};

export const getCart = async (userId) => {
  const cart = await findActiveCartByUser(userId);
  if (!cart) {
    const expiresAt = await getExpiresAt();
    const [created] = await Cart.create([
      {
        userId,
        items: [],
        status: "CART",
        totalAmount: 0,
        expiresAt,
      },
    ]);

    return created;
  }
  return cart;
};

export const addItem = async (
  userId,
  { productId, quantity },
  options = {},
) => {
  const txn = await createOptionalSession(options.session);

  try {
    const cart = options.cart || (await getCart(userId, txn.session));
    const itemIndex =
      options.itemIndex !== undefined
        ? options.itemIndex
        : cart.items.findIndex(
            (cartItem) => cartItem.productId.toString() === productId,
          );
    const product =
      options.product ||
      (await requireActiveProduct(productId, null, txn.session));

    await createCartMovementLine(
      {
        productId: product._id.toString(),
        shopId: product.shopId.toString(),
        movementType: "RESERVATION",
        quantity,
        unitPrice: product.price,
        cartId: cart._id,
        date: new Date(),
      },
      userId,
      { session: txn.session, product, cache: true },
    );

    const snapshot = buildItemSnapshot(product);
    if (itemIndex !== -1) {
      cart.items[itemIndex].quantity += quantity;
      cart.items[itemIndex].shopId = product.shopId;
      cart.items[itemIndex].productSnapshot = snapshot;
      cart.items[itemIndex].totalAmount =
        product.price * cart.items[itemIndex].quantity;
    } else {
      cart.items.push({
        productId: product._id,
        shopId: product.shopId,
        quantity,
        productSnapshot: snapshot,
        totalAmount: product.price * quantity,
      });
    }

    cart.totalAmount = computeTotal(cart.items);
    cart.expiresAt = await getExpiresAt();

    const saveOptions = txn.session ? { session: txn.session } : {};
    const updatedCart = await cart.save(saveOptions);
    if (txn.ownsSession) await txn.commit();
    return updatedCart;
  } catch (error) {
    if (txn.ownsSession) await txn.abort();
    throw error;
  } finally {
    if (txn.ownsSession) await txn.end();
  }
};

export const updateItem = async (userId, productId, quantity) => {
  const txn = await createOptionalSession();

  try {
    let newCart = null;

    const cart = await getCart(userId, txn.session);
    const itemIndex = cart.items.findIndex(
      (cartItem) => cartItem.productId.toString() === productId,
    );
    const product = await requireActiveProduct(productId, null, txn.session);

    // Calculate delta: (Target Quantity) - (Current Quantity)
    // If item doesn't exist, delta is the full target quantity
    const currentQty = itemIndex !== -1 ? cart.items[itemIndex].quantity : 0;
    const delta = quantity - currentQty;

    // Determination logic
    const isAdd = delta > 0;
    const isRemove = delta < 0;

    if (isAdd) {
      // Adding: pass the positive delta
      newCart = await addItem(
        userId,
        { productId, quantity: delta },
        { cart, itemIndex, product, session: txn.session },
      );
    } else if (isRemove) {
      newCart = await removeItem(
        userId,
        { productId, quantity: Math.abs(delta) },
        { cart, itemIndex, product, session: txn.session },
      );
    } else {
      if (itemIndex === -1) {
        throw new ApiError(
          404,
          "ITEM_NOT_FOUND",
          "L'article n'est pas dans le panier",
        );
      }
      newCart = cart;
    }

    if (txn.ownsSession) await txn.commit();
    return newCart;
  } catch (error) {
    if (txn.ownsSession) await txn.abort();
    throw error;
  } finally {
    if (txn.ownsSession) await txn.end();
  }
};

export const removeItem = async (
  userId,
  { productId, quantity },
  options = {},
) => {
  const txn = await createOptionalSession(options.session);

  try {
    const cart =
      options.cart || (await findActiveCartByUser(userId, txn.session));
    if (!cart) {
      throw new ApiError(404, "CART_NOT_FOUND", "Panier non trouvé");
    }
    const itemIndex =
      options.itemIndex !== undefined
        ? options.itemIndex
        : cart.items.findIndex(
            (cartItem) => cartItem.productId.toString() === productId,
          );

    if (itemIndex === -1) {
      throw new ApiError(
        404,
        "ITEM_NOT_FOUND",
        "L'article n'est pas dans le panier",
      );
    }

    const effectiveQuantity =
      quantity === -1 ? cart.items[itemIndex].quantity : quantity;
    const product =
      options.product ||
      (await requireActiveProduct(productId, null, txn.session));

    await createCartMovementLine(
      {
        productId: product._id.toString(),
        shopId: product.shopId.toString(),
        movementType: "RESERVATION_CANCEL",
        quantity: effectiveQuantity,
        unitPrice: product.price,
        cartId: cart._id,
        date: new Date(),
      },
      userId,
      { session: txn.session, product, cache: true },
    );

    const snapshot = buildItemSnapshot(product);
    if (cart.items[itemIndex].quantity > effectiveQuantity) {
      cart.items[itemIndex].quantity -= effectiveQuantity;
      cart.items[itemIndex].shopId = product.shopId;
      cart.items[itemIndex].productSnapshot = snapshot;
      cart.items[itemIndex].totalAmount =
        product.price * cart.items[itemIndex].quantity;
    } else {
      cart.items.splice(itemIndex, 1);
    }

    cart.totalAmount = computeTotal(cart.items);
    cart.expiresAt = await getExpiresAt();

    const saveOptions = txn.session ? { session: txn.session } : {};
    const updatedCart = await cart.save(saveOptions);
    if (txn.ownsSession) await txn.commit();

    return updatedCart;
  } catch (error) {
    if (txn.ownsSession) await txn.abort();
    throw error;
  } finally {
    if (txn.ownsSession) await txn.end();
  }
};

export const clearCart = async (userId) => {
  const txn = await createOptionalSession();

  try {
    const cart = await findActiveCartByUser(userId, txn.session);
    if (!cart) {
      const createOptions = txn.session ? { session: txn.session } : {};
      const expiresAt = await getExpiresAt();
      const [emptyCart] = await Cart.create(
        [
          {
            userId,
            items: [],
            status: "CART",
            totalAmount: 0,
            expiresAt,
          },
        ],
        createOptions,
      );
      if (txn.ownsSession) await txn.commit();
      return emptyCart;
    }

    await releaseCartReservations(cart, {
      session: txn.session,
      performedBy: userId,
    });

    cart.items = [];
    cart.totalAmount = 0;
    cart.expiresAt = await getExpiresAt();

    const saveOptions = txn.session ? { session: txn.session } : {};
    const updatedCart = await cart.save(saveOptions);
    if (txn.ownsSession) await txn.commit();

    return updatedCart;
  } catch (error) {
    if (txn.ownsSession) await txn.abort();
    throw error;
  } finally {
    if (txn.ownsSession) await txn.end();
  }
};

export const checkoutCart = async (userId, payload) => {
  const txn = await createOptionalSession();

  try {
    const cart = await findActiveCartByUser(userId, txn.session);
    if (!cart || cart.items.length === 0) {
      throw new ApiError(400, "CART_EMPTY", "Le panier est vide");
    }

    const computedTotal = computeTotal(cart.items);
    if (cart.totalAmount !== computedTotal) {
      cart.totalAmount = computedTotal;
    }

    let paymentTransaction = null;
    if (payload.paymentMethod === "WALLET") {
      const result = await debitWallet(
        userId,
        cart.totalAmount,
        "WALLET",
        `Achat via panier ${cart._id}`,
        { session: txn.session },
      );
      paymentTransaction = result.transaction;
    }

    const commissionRatesByShop = await loadShopCommissionRates(
      cart.items,
      txn.session,
    );

    const saleItems = [];
    for (const item of cart.items) {
      const product = await requireActiveProduct(
        item.productId,
        null,
        txn.session,
      );
      const unitPrice = item.productSnapshot?.unitPrice || product.price;
      const lineTotal = item.quantity * unitPrice;
      const shopId = item.shopId.toString();
      const commissionRate = commissionRatesByShop.get(shopId) || 0;
      const commissionAmount = Math.round((lineTotal * commissionRate) / 100);

      saleItems.push({
        productId: item.productId.toString(),
        shopId,
        quantity: item.quantity,
        cartId: cart._id,
        unitPrice,
        commissionRate,
        commissionAmount,
        product,
      });
    }

    const { header, lines } = await createStockMovement(
      {
        movementType: "SALE",
        sale: {
          cartId: cart._id,
          paymentTransaction: paymentTransaction?._id,
          deliveryAddress: payload.deliveryAddress,
          paymentMethod: payload.paymentMethod,
        },
        items: saleItems,
      },
      userId,
      { session: txn.session, cache: true },
    );

    if (payload.paymentMethod === "WALLET") {
      await creditCheckoutSalesToShops({
        saleId: header._id.toString(),
        orderReference: header.reference,
        cart,
        saleItems,
        session: txn.session,
      });
    }

    cart.status = "ORDER";

    cart.order.reference = header.reference;
    cart.order.saleId = header._id.toString();

    cart.order.paymentMethod = payload.paymentMethod;
    cart.order.paymentTransaction = paymentTransaction?._id.toString();

    const saveOptions = txn.session ? { session: txn.session } : {};
    await cart.save(saveOptions);

    const createOptions = txn.session ? { session: txn.session } : {};
    const nextCartExpiresAt = await getExpiresAt();
    const [nextCart] = await Cart.create(
      [
        {
          userId,
          items: [],
          status: "CART",
          totalAmount: 0,
          expiresAt: nextCartExpiresAt,
        },
      ],
      createOptions,
    );

    if (txn.ownsSession) await txn.commit();

    return {
      cart: nextCart,
      order: cart,
      paymentTransaction,
    };
  } catch (error) {
    if (txn.ownsSession) await txn.abort();
    throw error;
  } finally {
    if (txn.ownsSession) await txn.end();
  }
};

export const confirmDelivery = async (userId, cartId) => {
  const txn = await createOptionalSession();

  try {
    const cartQuery = Cart.findOne({ _id: cartId, userId });
    if (txn.session) cartQuery.session(txn.session);
    const cart = await cartQuery;
    if (!cart) {
      throw new ApiError(404, "NOT_FOUND", "Panier non trouvé");
    }
    if (cart.status !== "ORDER") {
      throw new ApiError(
        400,
        "INVALID_STATUS",
        "Le panier n'est pas en cours de commande",
      );
    }

    await updateSaleStatus(
      cart.order.saleId,
      { status: "DELIVERED" },
      userId,
      { session: txn.session },
    );

    await debitDeliveryCommissions(cart, txn.session);
 
    cart.status = "DELIVERED";
    const saveOptions = txn.session ? { session: txn.session } : {};
    await cart.save(saveOptions);

    if (txn.ownsSession) await txn.commit();
    return cart;
  } catch (error) {
    if (txn.ownsSession) await txn.abort();
    throw error;
  } finally {
    if (txn.ownsSession) await txn.end();
  }
};

export const returnOrder = async (userId, orderId, payload = {}) => {
  const txn = await createOptionalSession();

  try {
    const cartQuery = Cart.findOne({ _id: orderId, userId });
    if (txn.session) cartQuery.session(txn.session);
    const cart = await cartQuery;

    if (!cart) {
      throw new ApiError(404, "NOT_FOUND", "Commande non trouvée");
    }

    if (cart.status === "RETURNED") {
      return cart;
    }

    if (!["ORDER", "DELIVERED"].includes(cart.status)) {
      throw new ApiError(
        400,
        "INVALID_STATUS",
        "Seules les commandes en cours ou livrées peuvent être retournées",
      );
    }

    if (!cart.order?.saleId) {
      throw new ApiError(400, "INVALID_ORDER", "Commande invalide");
    }

    const saleQuery = StockMovement.findOne({
      _id: cart.order.saleId,
      movementType: "SALE",
    });
    if (txn.session) saleQuery.session(txn.session);
    const saleMovement = await saleQuery;

    if (!saleMovement) {
      throw new ApiError(404, "NOT_FOUND", "Mouvement de vente introuvable");
    }

    const saleLinesQuery = StockMovementLine.find({ moveId: saleMovement._id });
    if (txn.session) saleLinesQuery.session(txn.session);
    const saleLines = await saleLinesQuery;

    if (!saleLines.length) {
      throw new ApiError(400, "INVALID_ORDER", "Commande sans lignes de vente");
    }

    const existingReturnQuery = StockMovement.findOne({
      movementType: "RETURN_CUSTOMER",
      cartId: cart._id,
    })
      .sort({ createdAt: -1 })
      .select("_id reference");
    if (txn.session) existingReturnQuery.session(txn.session);
    let returnMovement = await existingReturnQuery;

    if (!returnMovement) {
      const returnItems = saleLines.map((line) => ({
        productId: line.productId.toString(),
        shopId: line.shopId.toString(),
        quantity: line.quantity,
        unitPrice: line.unitPrice,
      }));

      const result = await createStockMovement(
        {
          movementType: "RETURN_CUSTOMER",
          cartId: cart._id,
          date: new Date(),
          items: returnItems,
          note:
            payload.note ||
            `Retour client de la commande ${cart.order.reference || cart._id}`,
        },
        userId,
        { session: txn.session, cache: true },
      );

      returnMovement = result.header;
    }

    const alreadyRefundedBuyer = await hasBuyerRefundForOrder(
      returnMovement._id,
      cart._id,
      txn.session,
    );

    if (!alreadyRefundedBuyer) {
      await creditWalletByOwner(
        { ownerId: userId, ownerModel: "User" },
        cart.totalAmount,
        {
          type: "REFUND",
          paymentMethod: "WALLET",
          description: `Remboursement commande ${cart.order.reference || cart._id}`,
          stockMovementId: returnMovement._id,
          metadata: {
            kind: "RETURN_ORDER",
            cartId: cart._id.toString(),
            saleId: saleMovement._id.toString(),
            returnMovementId: returnMovement._id.toString(),
          },
          session: txn.session,
        },
      );
    }

    await reverseSaleIncomeCredits({
      saleId: saleMovement._id.toString(),
      returnMovementId: returnMovement._id.toString(),
      orderReference: cart.order.reference,
      cartId: cart._id,
      session: txn.session,
    });

    await refundDeliveryCommissions({
      saleId: saleMovement._id.toString(),
      returnMovementId: returnMovement._id.toString(),
      orderReference: cart.order.reference,
      cartId: cart._id,
      session: txn.session,
    });

    if (saleMovement.sale?.status !== "RETURNED") {
      await updateSaleStatus(
        saleMovement._id,
        { status: "RETURNED" },
        userId,
        { session: txn.session },
      );
    }

    cart.status = "RETURNED";
    const saveOptions = txn.session ? { session: txn.session } : {};
    await cart.save(saveOptions);

    if (txn.ownsSession) await txn.commit();
    return cart;
  } catch (error) {
    if (txn.ownsSession) await txn.abort();
    throw error;
  } finally {
    if (txn.ownsSession) await txn.end();
  }
};

/**
 * Récupérer les commandes d'un utilisateur
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} filters - Filtres optionnels (status)
 * @param {Object} pagination - Options de pagination
 */
export const getOrders = async (userId, filters = {}, pagination = {}) => {
  const { status } = filters;
  const page = pagination.page || 1;
  const limit = pagination.limit || 10;
  const skip = (page - 1) * limit;

  // Construire la query - les commandes sont des paniers avec status ORDER ou DELIVERED
  const query = {
    userId,
    status: { $in: ["ORDER", "DELIVERED", "RETURNED"] },
  };

  if (status) {
    query.status = status;
  }

  const [orders, total] = await Promise.all([
    Cart.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit),
    Cart.countDocuments(query),
  ]);

  return {
    orders,
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
 * Récupérer une commande par son ID
 * @param {string} userId - ID de l'utilisateur
 * @param {string} orderId - ID de la commande (cart)
 */
export const getOrderById = async (userId, orderId) => {
  const order = await Cart.findOne({
    _id: orderId,
    userId,
    status: { $in: ["ORDER", "DELIVERED", "RETURNED"] },
  });

  if (!order) {
    throw new ApiError(404, "NOT_FOUND", "Commande non trouvée");
  }

  return order;
};

/**
 * Récupère la liste des paniers expirés de l'utilisateur qui ont encore des items
 * @param {string} userId - ID de l'utilisateur
 * @returns {Promise<Array>} Liste des paniers expirés avec leurs items
 */
export const getExpiredCarts = async (userId) => {
  const expiredCarts = await Cart.find({
    userId,
    status: "EXPIRED",
    "items.0": { $exists: true },
  })
    .sort({ updatedAt: -1 })
    .lean();

  // Enrichir chaque panier avec les infos de disponibilité
  const enrichedCarts = await Promise.all(
    expiredCarts.map(async (cart) => {
      let availableItems = 0;
      let unavailableItems = 0;

      for (const item of cart.items) {
        try {
          // Vérifier si le produit est toujours actif
          const product = await Product.findOne({
            _id: item.productId,
            status: "ACTIVE",
          }).lean();

          if (!product) {
            unavailableItems++;
            continue;
          }

          // Vérifier si le shop est actif
          const shop = await Shop.findOne({
            _id: product.shopId,
            isActive: true,
          }).lean();

          if (!shop) {
            unavailableItems++;
            continue;
          }

          // Vérifier le stock disponible
          const stockData = await StockMovementLine.calculateStock(product._id);
          const effectiveAvailable = stockData.total - stockData.reserved;

          if (effectiveAvailable > 0) {
            availableItems++;
          } else {
            unavailableItems++;
          }
        } catch {
          unavailableItems++;
        }
      }

      return {
        ...cart,
        itemsCount: cart.items.length,
        availableItems,
        unavailableItems,
        expiredAt: cart.updatedAt,
      };
    })
  );

  return enrichedCarts;
};

/**
 * Restaure un panier expiré spécifique de l'utilisateur
 * Si l'utilisateur a un panier actif, les items restaurés sont fusionnés
 * 
 * @param {string} userId - ID de l'utilisateur
 * @param {string} cartId - ID du panier expiré à restaurer
 * @returns {Object} { cart, restored: [], notRestored: [] }
 */
export const restoreExpiredCart = async (userId, cartId) => {
  // Pas de transaction pour éviter les conflits d'écriture MongoDB
  // Les opérations de réservation sont gérées individuellement

  // 1. Trouver le panier expiré spécifique
  const query = {
    userId,
    status: "EXPIRED",
    "items.0": { $exists: true },
  };

  // Si un cartId est fourni, chercher ce panier spécifique
  if (cartId) {
    query._id = cartId;
  }

  const expiredCart = await Cart.findOne(query).sort({ updatedAt: -1 });

  if (!expiredCart) {
    throw new ApiError(
      404,
      "NO_EXPIRED_CART",
      "Aucun panier expiré à restaurer",
    );
  }

  // 2. Récupérer ou créer le panier actif
  let activeCart = await findActiveCartByUser(userId);

  if (!activeCart) {
    const expiresAt = await getExpiresAt();
    activeCart = await Cart.create({
      userId,
      items: [],
      status: "CART",
      totalAmount: 0,
      expiresAt,
    });
  }

  const restored = [];
  const notRestored = [];

  // 3. Vérifier et restaurer chaque item du panier expiré
  for (const item of expiredCart.items) {
    try {
      // Vérifier produit actif
      const product = await requireActiveProduct(item.productId);

      // Vérifier shop actif
      await requireActiveShop(product.shopId);

      // Vérifier stock disponible
      const stockData = await StockMovementLine.calculateStock(product._id);
      const effectiveAvailable = stockData.total - stockData.reserved;

      let quantityToRestore = item.quantity;

      if (effectiveAvailable < item.quantity) {
        if (effectiveAvailable > 0) {
          // Restauration partielle - ajuster la quantité
          quantityToRestore = effectiveAvailable;
        } else {
          // Stock épuisé - ne pas restaurer cet item
          notRestored.push({
            productId: item.productId,
            productSnapshot: item.productSnapshot,
            originalQuantity: item.quantity,
            reason: "INSUFFICIENT_STOCK",
            message: "Stock épuisé",
          });
          continue;
        }
      }

      // Vérifier si le produit est déjà dans le panier actif
      const existingItemIndex = activeCart.items.findIndex(
        (cartItem) =>
          cartItem.productId.toString() === item.productId.toString(),
      );

      // Recréer la réservation de stock (sans transaction)
      await createCartMovementLine(
        {
          productId: product._id.toString(),
          shopId: product.shopId.toString(),
          movementType: "RESERVATION",
          quantity: quantityToRestore,
          unitPrice: product.price,
          cartId: activeCart._id,
          date: new Date(),
        },
        userId,
        { product, cache: true },
      );

      // Mettre à jour le snapshot avec le prix actuel
      const updatedSnapshot = buildItemSnapshot(product);

      if (existingItemIndex !== -1) {
        // Fusionner avec l'item existant
        activeCart.items[existingItemIndex].quantity += quantityToRestore;
        activeCart.items[existingItemIndex].totalAmount =
          product.price * activeCart.items[existingItemIndex].quantity;
        activeCart.items[existingItemIndex].productSnapshot = updatedSnapshot;
      } else {
        // Ajouter comme nouvel item
        activeCart.items.push({
          productId: product._id,
          shopId: product.shopId,
          quantity: quantityToRestore,
          productSnapshot: updatedSnapshot,
          totalAmount: product.price * quantityToRestore,
        });
      }

      restored.push({
        productId: item.productId,
        productSnapshot: item.productSnapshot,
        originalQuantity: item.quantity,
        restoredQuantity: quantityToRestore,
        adjustedQuantity: quantityToRestore < item.quantity,
      });
    } catch (error) {
      notRestored.push({
        productId: item.productId,
        productSnapshot: item.productSnapshot,
        originalQuantity: item.quantity,
        reason: error.code || "VALIDATION_ERROR",
        message: error.message,
      });
    }
  }

  if (restored.length === 0) {
    throw new ApiError(
      400,
      "CANNOT_RESTORE",
      "Aucun article n'a pu être restauré (produits indisponibles ou stock épuisé)",
    );
  }

  // 4. Mettre à jour le panier actif
  activeCart.totalAmount = computeTotal(activeCart.items);
  activeCart.expiresAt = await getExpiresAt();
  await activeCart.save();

  // 5. Vider les items du panier expiré pour éviter double restauration
  expiredCart.items = [];
  expiredCart.totalAmount = 0;
  await expiredCart.save();

  return {
    cart: activeCart,
    restored,
    notRestored,
  };
};
