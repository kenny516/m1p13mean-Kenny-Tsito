import mongoose from "mongoose";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import Shop from "../models/Shop.js";
import StockMovementLine from "../models/StockMovementLine.js";
import WalletTransaction from "../models/WalletTransaction.js";
import { ApiError } from "../middlewares/error.middleware.js";
import {
  createStockMovement,
  createCartMovementLine,
} from "./stockMovementLine.service.js";
import { updateSaleStatus } from "./stockMovement.service.js";
import { debitWallet, debitWalletByOwner } from "./wallet.service.js";
import { requireActiveProduct } from "./product.service.js";
import { createOptionalSession } from "../utils/transaction.util.js";
import * as settingsService from "./settings.service.js";

// Fallback si les settings ne sont pas encore initialisés
const DEFAULT_CART_TTL_MINUTES = 30;

/**
 * Récupère la durée de vie du panier depuis les paramètres globaux
 * @returns {Promise<number>} La durée de vie du panier en minutes
 */
const getCartTTL = async () => {
  try {
    return await settingsService.getCartTTLMinutes();
  } catch {
    return DEFAULT_CART_TTL_MINUTES;
  }
};

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
      },
    );
  }
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

  if (cart.expiresAt <= new Date()) {
    cart.status = "EXPIRED";
    await cart.save();
    throw new ApiError(400, "CART_EXPIRED", "Le panier a expiré");
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

    for (const item of cart.items) {
      const productQuery = Product.findById(item.productId);
      if (txn.session) productQuery.session(txn.session);
      const product = await productQuery;
      if (!product) {
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
        },
        userId,
        { session: txn.session, product, cache: true },
      );
    }

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

    await updateSaleStatus(cart.order.saleId, { status: "DELIVERED" }, userId);

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
