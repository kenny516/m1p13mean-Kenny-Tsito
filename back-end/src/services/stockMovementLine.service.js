import mongoose from "mongoose";
import StockMovement from "../models/StockMovement.js";
import StockMovementLine from "../models/StockMovementLine.js";
import { IN_MOVEMENTS } from "../models/StockMovement.js";
import Product from "../models/Product.js";
import { ApiError } from "../middlewares/error.middleware.js";
import { requireActiveProduct } from "./product.service.js";
import { requireActiveShop } from "./shop.service.js";
import { parseSortOption } from "../utils/request.util.js";
import { createOptionalSession } from "../utils/transaction.util.js";

const RESERVATION_TYPES = new Set(["RESERVATION", "RESERVATION_CANCEL"]);

const _getDirection = (movementType) =>
  IN_MOVEMENTS.includes(movementType) ? "IN" : "OUT";

const _affectsTotal = (movementType) => !RESERVATION_TYPES.has(movementType);

const _getStockSnapshot = async (product, useCache) => {
  const cache = product?.stock?.cache;
  if (
    useCache &&
    cache &&
    typeof cache.total === "number" &&
    typeof cache.reserved === "number"
  ) {
    return {
      total: cache.total,
      reserved: cache.reserved,
      available: cache.total - cache.reserved,
    };
  }

  const stockData = await StockMovementLine.calculateStock(product._id);
  return {
    total: stockData.total,
    reserved: stockData.reserved,
    available: stockData.available,
  };
};

const _checkAvailability = async ({
  product,
  movementType,
  quantity,
  useCache,
}) => {
  const currentStock = await _getStockSnapshot(product, useCache);
  const direction = _getDirection(movementType);

  if (movementType === "RESERVATION") {
    const effectiveAvailable = currentStock.total - currentStock.reserved;
    if (quantity > effectiveAvailable) {
      throw new ApiError(
        400,
        "INSUFFICIENT_STOCK",
        `Stock insuffisant. Disponible : ${effectiveAvailable}, demande : ${quantity}`,
      );
    }
  } else if (direction === "OUT" && _affectsTotal(movementType)) {
    if (quantity > currentStock.total) {
      throw new ApiError(
        400,
        "INSUFFICIENT_STOCK",
        `Stock insuffisant. Disponible : ${currentStock.total}, demande : ${quantity}`,
      );
    }
  }

  return currentStock;
};

const _applyMovementToCache = (product, movementType, quantity, direction) => {
  const cache = product.stock.cache;
  const affectsTotal = _affectsTotal(movementType);

  if (movementType === "RESERVATION") {
    cache.reserved += quantity;
  } else if (movementType === "RESERVATION_CANCEL") {
    cache.reserved = Math.max(0, cache.reserved - quantity);
  } else {
    if (direction === "IN") {
      cache.total += quantity;
    } else {
      cache.total = Math.max(0, cache.total - quantity);
    }

    if (movementType === "SALE") {
      cache.reserved = Math.max(0, cache.reserved - quantity);
    }
  }

  if (affectsTotal) {
    cache.available = Math.max(0, cache.total - cache.reserved);
  }

  cache.lastUpdated = new Date();
};

const _syncHeaderData = async (moveId, session) => {
  const lines = await StockMovementLine.find({ moveId })
    .select("_id totalAmount commissionAmount")
    .session(session || null);

  const totalAmount = lines.reduce(
    (sum, line) => sum + (line.totalAmount || 0),
    0,
  );
  const totalCommissionAmount = lines.reduce(
    (sum, line) => sum + (line.commissionAmount || 0),
    0,
  );
  const lineIds = lines.map((line) => line._id);

  return StockMovement.findByIdAndUpdate(
    moveId,
    { $set: { totalAmount, totalCommissionAmount, lineIds } },
    { new: true, session: session || undefined },
  );
};

const _resolveProductAndShop = async (
  { productId, shopId },
  session,
  providedProduct,
) => {
  const resolvedProductId = providedProduct?._id?.toString() || productId;

  if (!resolvedProductId) {
    throw new ApiError(
      400,
      "INVALID_PRODUCT",
      "Produit requis pour le mouvement",
    );
  }

  // Resolve product first (needed to auto-resolve shopId when not provided)
  const product =
    providedProduct ||
    (await requireActiveProduct(resolvedProductId, null, session));

  const resolvedShopId = shopId || product.shopId?.toString();
  if (!resolvedShopId) {
    throw new ApiError(
      400,
      "INVALID_SHOP",
      "Boutique requise pour le mouvement",
    );
  }

  await requireActiveShop(resolvedShopId, session);

  if (product.status !== "ACTIVE") {
    throw new ApiError(
      400,
      "PRODUCT_NOT_ACTIVE",
      "Le produit doit être au statut ACTIVE",
    );
  }
  if (product.shopId.toString() !== resolvedShopId) {
    throw new ApiError(
      400,
      "INVALID_SHOP",
      "Le produit n'appartient pas a cette boutique",
    );
  }

  return { product, resolvedProductId, resolvedShopId };
};

const _createHeader = async (payload, performedBy, session) => {
  const resolvedHeaderShopId =
    payload.shopId ||
    (() => {
      const uniqueShopIds = [
        ...new Set(
          (payload.items || [])
            .map((item) => item?.shopId?.toString())
            .filter(Boolean),
        ),
      ];
      return uniqueShopIds.length === 1 ? uniqueShopIds[0] : undefined;
    })();

  const headerDoc = {
    movementType: payload.movementType,
    direction: _getDirection(payload.movementType),
    performedBy,
    note: payload.note,
    date: payload.date || new Date(),
    cartId: payload.cartId,
    shopId: resolvedHeaderShopId,
  };

  if (payload.movementType === "SALE") {
    headerDoc.sale = {
      cartId: payload.sale?.cartId,
      paymentTransaction: payload.sale?.paymentTransaction,
      deliveryAddress: payload.sale?.deliveryAddress,
      paymentMethod: payload.sale?.paymentMethod,
      status: payload.sale?.status || undefined,
      confirmedAt: payload.date,
    };
  }

  if (
    payload.movementType === "RESERVATION" ||
    payload.movementType === "RESERVATION_CANCEL"
  ) {
    headerDoc.cartId = payload.cartId;
  }

  if (payload.movementType === "SUPPLY") {
    headerDoc.supply = payload.supply;
  }

  if (
    payload.movementType === "ADJUSTMENT_PLUS" ||
    payload.movementType === "ADJUSTMENT_MINUS"
  ) {
    headerDoc.adjustment = payload.adjustment;
  }

  const [header] = await StockMovement.create([headerDoc], { session });
  return header;
};

const _createLine = async (header, item, options) => {
  const session = options.session || null;
  const useCache =
    options.cache !== undefined ? options.cache : options.useCache !== false;
  const providedProduct = item.product || options.product || null;

  const { product, resolvedProductId, resolvedShopId } =
    await _resolveProductAndShop(
      { productId: item.productId, shopId: item.shopId },
      session,
      providedProduct,
    );

  const currentStock = await _checkAvailability({
    product,
    movementType: header.movementType,
    quantity: item.quantity,
    useCache,
  });

  const affectsTotal = _affectsTotal(header.movementType);
  const stockBefore = currentStock.total;
  const stockAfter = affectsTotal
    ? header.direction === "IN"
      ? stockBefore + item.quantity
      : stockBefore - item.quantity
    : stockBefore;
  const totalAmount = item.quantity * (item.unitPrice || 0);

  const lineDoc = {
    reference: `${header.reference}-${resolvedProductId}`,
    moveId: header._id,
    productId: resolvedProductId,
    shopId: resolvedShopId,
    movementType: header.movementType,
    cartId: item.cartId || header.cartId,
    direction: header.direction,
    quantity: item.quantity,
    unitPrice: item.unitPrice || 0,
    commissionRate: item.commissionRate || 0,
    commissionAmount: item.commissionAmount || 0,
    totalAmount,
    stockBefore,
    stockAfter,
    performedBy: header.performedBy,
    date: item.date || header.date,
  };

  const [line] = await StockMovementLine.create([lineDoc], { session });

  _applyMovementToCache(
    product,
    header.movementType,
    item.quantity,
    header.direction,
  );
  await product.save({ session });

  if (header.movementType === "SALE") {
    await Product.findByIdAndUpdate(
      product._id,
      { $inc: { "stats.sales": item.quantity } },
      { session },
    );
  }

  return line;
};

export const createCartMovementLine = async (
  payload,
  performedBy,
  options = {},
) => {
  const txn = await createOptionalSession(options.session);
  const useCache =
    options.cache !== undefined ? options.cache : options.useCache !== false;
  const providedProduct = options.product || null;
  const movementType = payload.movementType;

  try {
    // TODO payload joi validation
    const {
      cartId,
      productId,
      quantity,
      unitPrice = 0,
      shopId,
      date,
    } = payload;

    const findQuery = StockMovementLine.findOne({
      movementType,
      cartId,
      productId,
    });
    if (txn.session) findQuery.session(txn.session);
    let line = await findQuery;

    const { product, resolvedProductId, resolvedShopId } =
      await _resolveProductAndShop(
        { productId, shopId },
        txn.session,
        providedProduct,
      );

    const currentStock = await _checkAvailability({
      product,
      movementType,
      quantity,
      useCache,
    });

    if (line) {
      line.quantity += quantity;
      line.unitPrice = unitPrice;
      line.totalAmount = line.quantity * unitPrice;
      line.stockBefore = currentStock.total;
      line.stockAfter = currentStock.total;
      line.shopId = resolvedShopId;
      line.performedBy = performedBy;
      line.date = date || line.date;

      const saveOptions = txn.session ? { session: txn.session } : {};
      await line.save(saveOptions);
    } else {
      const headerQuery = StockMovement.findOne({
        movementType,
        cartId,
      }).select("_id reference");
      if (txn.session) headerQuery.session(txn.session);
      let header = await headerQuery;

      if (!header) {
        header = await _createHeader(
          { movementType, cartId, date },
          performedBy,
          txn.session,
        );
      }

      const lineDoc = {
        reference: `${header.reference}-${resolvedProductId}`,
        moveId: header._id,
        productId: resolvedProductId,
        shopId: resolvedShopId,
        movementType,
        cartId,
        quantity,
        unitPrice,
        totalAmount: quantity * unitPrice,
        stockBefore: currentStock.total,
        stockAfter: currentStock.total,
        performedBy,
        date,
      };

      const createOptions = txn.session ? { session: txn.session } : {};
      [line] = await StockMovementLine.create([lineDoc], createOptions);
    }

    _applyMovementToCache(
      product,
      movementType,
      quantity,
      _getDirection(movementType),
    );
    const productSaveOptions = txn.session ? { session: txn.session } : {};
    await product.save(productSaveOptions);

    await _syncHeaderData(line.moveId, txn.session);

    if (txn.ownsSession) await txn.commit();
    return line;
  } catch (error) {
    if (txn.ownsSession) await txn.abort();
    throw error;
  } finally {
    if (txn.ownsSession) await txn.end();
  }
};

export const createStockMovement = async (
  payload,
  performedBy,
  options = {},
) => {
  const txn = await createOptionalSession(options.session);
  const useCache =
    options.cache !== undefined ? options.cache : options.useCache !== false;

  try {
    // TODO payload joi validation

    const header = await _createHeader(payload, performedBy, txn.session);

    const createdLines = [];
    for (const item of payload.items) {
      const line = await _createLine(header, item, {
        session: txn.session,
        useCache,
      });
      createdLines.push(line);
    }

    const syncedHeader = await _syncHeaderData(header._id, txn.session);

    if (txn.ownsSession) {
      await txn.commit();
    }

    return { header: syncedHeader, lines: createdLines };
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

export const listMovementLines = async (filters = {}) => {
  const {
    page = 1,
    limit = 10,
    movementType,
    productId,
    shopId,
    startDate,
    endDate,
    sort,
  } = filters;

  const query = {};
  if (movementType) query.movementType = movementType;
  if (productId) query.productId = productId;
  if (shopId) query.shopId = shopId;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const sortOptions = parseSortOption(sort);
  const skip = (page - 1) * limit;

  const [lines, total] = await Promise.all([
    StockMovementLine.find(query)
      .populate("productId", "title sku images price")
      .populate("shopId", "name")
      .populate("performedBy", "email profile")
      .sort(sortOptions)
      .skip(skip)
      .limit(limit),
    StockMovementLine.countDocuments(query),
  ]);

  return { lines, total, page, limit };
};
