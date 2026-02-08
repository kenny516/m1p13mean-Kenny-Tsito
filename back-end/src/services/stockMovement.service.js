import mongoose from "mongoose";
import StockMovement from "../models/StockMovement.js";
import { IN_MOVEMENTS, VALID_SALE_TRANSITIONS } from "../models/StockMovement.js";
import Product from "../models/Product.js";
import Shop from "../models/Shop.js";
import { ApiError } from "../middlewares/error.middleware.js";
import { requireActiveProduct } from "./product.service.js";
import { requireActiveShop } from "./shop.service.js";
import { parseSortOption } from "../utils/request.util.js";

// ==========================================
// Helpers internes
// ==========================================

/**
 * Détermine la direction du mouvement.
 */
const _getDirection = (movementType) => (IN_MOVEMENTS.includes(movementType) ? "IN" : "OUT");

const RESERVATION_TYPES = new Set(["RESERVATION", "RESERVATION_CANCEL"]);

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

	const stockData = await StockMovement.calculateStock(product._id);
	return {
		total: stockData.total,
		reserved: stockData.reserved,
		available: stockData.available,
	};
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



/**
 * Met à jour le cache stock d'un produit à partir de l'agrégation StockMovement.
 * Doit être appelé dans la même session de transaction.
 */
const _syncProductStockCache = async (productId, session = null) => {
	const stockData = await StockMovement.calculateStock(productId);

	const updateOp = Product.findByIdAndUpdate(
		productId,
		{
			$set: {
				"stock.cache.total": stockData.total,
				"stock.cache.reserved": stockData.reserved,
				"stock.cache.available": stockData.available,
				"stock.cache.lastUpdated": new Date(),
			},
		},
		{ new: true },
	);
	if (session) updateOp.session(session);
	return updateOp;
};

// ==========================================
// Création d'un mouvement de stock
// ==========================================

/**
 * Crée un mouvement de stock dans une transaction.
 * Calcule stockBefore/stockAfter, totalAmount, et met à jour product.stock.cache.
 */
export const createMovement = async (movementData, performedBy, options = {}) => {
	const providedSession = options.session || null;
	const session = providedSession || (await mongoose.startSession());
	const ownsSession = !providedSession;
	const useCache = options.useCache !== false;
	const providedProduct = options.product || null;

	if (ownsSession) {
		session.startTransaction();
	}

	try {
		const { productId, shopId, movementType, quantity, unitPrice = 0 } = movementData;

		const resolvedProductId = providedProduct?._id?.toString() || productId;
		const resolvedShopId = shopId || providedProduct?.shopId?.toString();
		if (!resolvedProductId) {
			throw new ApiError(400, "INVALID_PRODUCT", "Produit requis pour le mouvement");
		}
		if (!resolvedShopId) {
			throw new ApiError(400, "INVALID_SHOP", "Boutique requise pour le mouvement");
		}

		// 1. Valider shop et produit
		await requireActiveShop(resolvedShopId, session);
		const product = providedProduct
			? providedProduct
			: await requireActiveProduct(resolvedProductId, resolvedShopId, session);

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
				"Le produit n'appartient pas à cette boutique",
			);
		}

		// 2. Utiliser le cache s'il est fiable
		const currentStock = await _getStockSnapshot(product, useCache);
		const direction = _getDirection(movementType);

		// 3. Vérifier disponibilité pour les mouvements sortants
		if (movementType === "RESERVATION") {
			const effectiveAvailable = currentStock.total - currentStock.reserved;
			if (quantity > effectiveAvailable) {
				throw new ApiError(
					400,
					"INSUFFICIENT_STOCK",
					`Stock insuffisant. Disponible : ${effectiveAvailable}, demandé : ${quantity}`,
				);
			}
		} else if (direction === "OUT" && _affectsTotal(movementType)) {
			if (quantity > currentStock.total) {
				throw new ApiError(
					400,
					"INSUFFICIENT_STOCK",
					`Stock insuffisant. Disponible : ${currentStock.total}, demandé : ${quantity}`,
				);
			}
		}

		// 4. Calculer les valeurs d'audit
		const stockBefore = currentStock.total;
		const affectsTotal = _affectsTotal(movementType);
		const stockAfter = affectsTotal
			? direction === "IN"
				? stockBefore + quantity
				: stockBefore - quantity
			: stockBefore;
		const totalAmount = quantity * unitPrice;

		// 5. Construire le document mouvement
		const movementDoc = {
			productId: resolvedProductId,
			shopId: resolvedShopId,
			movementType,
			direction,
			quantity,
			unitPrice,
			totalAmount,
			stockBefore,
			stockAfter,
			performedBy,
			notes: movementData.notes,
			groupId: movementData.groupId,
		};

		// 6. Ajouter les sous-objets conditionnels
		if (movementType === "SALE") {
			movementDoc.sale = movementData.sale;
		}
		if (movementType === "SUPPLY") {
			movementDoc.supply = movementData.supply;
		}
		if (movementType === "ADJUSTMENT_PLUS" || movementType === "ADJUSTMENT_MINUS") {
			movementDoc.adjustment = movementData.adjustment;
		}
		if (movementType === "RESERVATION" || movementType === "RESERVATION_CANCEL") {
			movementDoc.reservation = movementData.reservation;
		}
		if (movementType === "TRANSFER_IN" || movementType === "TRANSFER_OUT") {
			movementDoc.transfer = movementData.transfer;
		}

		// 7. Sauvegarder le mouvement
		const [movement] = await StockMovement.create([movementDoc], {
			session,
		});

		// 8. Mettre à jour le cache stock du produit
		_applyMovementToCache(product, movementType, quantity, direction);
		await product.save({ session });

		// 9. Mettre à jour les stats de vente du produit si c'est une vente
		if (movementType === "SALE") {
			await Product.findByIdAndUpdate(
				product._id,
				{ $inc: { "stats.sales": quantity } },
				{ session },
			);
		}

		if (ownsSession) {
			await session.commitTransaction();
		}

		// Retourner le mouvement peuplé
		return StockMovement.findById(movement._id)
			.populate("productId", "title sku images price")
			.populate("shopId", "name")
			.populate("performedBy", "email profile");
	} catch (error) {
		if (ownsSession) {
			await session.abortTransaction();
		}
		throw error;
	} finally {
		if (ownsSession) {
			session.endSession();
		}
	}
};

// ==========================================
// Lecture d'un mouvement
// ==========================================

export const getMovementById = async (id) => {
	const movement = await StockMovement.findById(id)
		.populate("productId", "title sku images price")
		.populate("shopId", "name")
		.populate("performedBy", "email profile")
		.populate("sale.buyerId", "email profile");

	if (!movement) {
		throw new ApiError(404, "NOT_FOUND", "Mouvement de stock non trouvé");
	}
	return movement;
};

// ==========================================
// Liste des mouvements avec filtres + pagination
// ==========================================

export const listMovements = async (filters = {}) => {
	const {
		page = 1,
		limit = 10,
		productId,
		shopId,
		movementType,
		direction,
		startDate,
		endDate,
		groupId,
		sort,
	} = filters;

	const query = {};

	if (productId) query.productId = productId;
	if (shopId) query.shopId = shopId;
	if (movementType) query.movementType = movementType;
	if (direction) query.direction = direction;
	if (groupId) query.groupId = groupId;
	if (startDate || endDate) {
		query.createdAt = {};
		if (startDate) query.createdAt.$gte = new Date(startDate);
		if (endDate) query.createdAt.$lte = new Date(endDate);
	}

	const sortOptions = parseSortOption(sort);

	const skip = (page - 1) * limit;

	const [movements, total] = await Promise.all([
		StockMovement.find(query)
			.populate("productId", "title sku images price")
			.populate("shopId", "name")
			.populate("performedBy", "email profile")
			.sort(sortOptions)
			.skip(skip)
			.limit(limit),
		StockMovement.countDocuments(query),
	]);

	return { movements, total, page, limit };
};

// ==========================================
// Mouvements par boutique du vendeur (filtrés par ownership)
// ==========================================

export const listMyShopMovements = async (sellerId, filters = {}) => {
	// Trouver les boutiques du vendeur
	const shops = await Shop.find({ sellerId }, "_id");
	const shopIds = shops.map((s) => s._id);

	if (shopIds.length === 0) {
		return { movements: [], total: 0, page: 1, limit: filters.limit || 10 };
	}

	return listMovements({ ...filters, shopId: { $in: shopIds } });
};

// ==========================================
// Ventes (par shopId ou buyerId)
// ==========================================

export const listSales = async (filters = {}) => {
	const { page = 1, limit = 10, shopId, buyerId, status, startDate, endDate, sort } = filters;

	const query = { movementType: "SALE" };

	if (shopId) query.shopId = shopId;
	if (buyerId) query["sale.buyerId"] = buyerId;
	if (status) query["sale.status"] = status;
	if (startDate || endDate) {
		query.createdAt = {};
		if (startDate) query.createdAt.$gte = new Date(startDate);
		if (endDate) query.createdAt.$lte = new Date(endDate);
	}

	const sortOptions = parseSortOption(sort);

	const skip = (page - 1) * limit;

	const [sales, total] = await Promise.all([
		StockMovement.find(query)
			.populate("productId", "title images price")
			.populate("sale.buyerId", "email profile")
			.populate("shopId", "name")
			.sort(sortOptions)
			.skip(skip)
			.limit(limit),
		StockMovement.countDocuments(query),
	]);

	return { sales, total, page, limit };
};

// ==========================================
// Approvisionnements
// ==========================================

export const listSupplies = async (filters = {}) => {
	const { page = 1, limit = 10, shopId, startDate, endDate, sort } = filters;

	const query = { movementType: "SUPPLY" };

	if (shopId) query.shopId = shopId;
	if (startDate || endDate) {
		query.createdAt = {};
		if (startDate) query.createdAt.$gte = new Date(startDate);
		if (endDate) query.createdAt.$lte = new Date(endDate);
	}

	const sortOptions = parseSortOption(sort);

	const skip = (page - 1) * limit;

	const [supplies, total] = await Promise.all([
		StockMovement.find(query)
			.populate("productId", "title sku")
			.populate("shopId", "name")
			.populate("performedBy", "email profile")
			.sort(sortOptions)
			.skip(skip)
			.limit(limit),
		StockMovement.countDocuments(query),
	]);

	return { supplies, total, page, limit };
};

// ==========================================
// Mise à jour du statut de vente
// ==========================================

/**
 * Met à jour le statut d'une vente.
 * Gère les transitions valides et les effets de bord (annulation → retour stock).
 */
export const updateSaleStatus = async (movementId, statusData, performedBy) => {
	const movement = await StockMovement.findById(movementId);
	if (!movement) {
		throw new ApiError(404, "NOT_FOUND", "Mouvement non trouvé");
	}
	if (movement.movementType !== "SALE") {
		throw new ApiError(400, "NOT_A_SALE", "Ce mouvement n'est pas une vente");
	}

	const currentStatus = movement.sale.status;
	const newStatus = statusData.status;

	const allowed = VALID_SALE_TRANSITIONS[currentStatus] || [];
	if (!allowed.includes(newStatus)) {
		throw new ApiError(
			400,
			"INVALID_TRANSITION",
			`Transition invalide : ${currentStatus} → ${newStatus}. Transitions autorisées : ${allowed.join(", ") || "aucune"}`,
		);
	}

	// Appliquer la mise à jour
	movement.sale.status = newStatus;

	// Dates automatiques
	if (newStatus === "PAID") movement.sale.paidAt = new Date();
	if (newStatus === "SHIPPED") {
		movement.sale.shippedAt = new Date();
		if (statusData.trackingNumber) {
			movement.sale.trackingNumber = statusData.trackingNumber;
		}
	}
	if (newStatus === "DELIVERED") movement.sale.deliveredAt = new Date();

	await movement.save();

	// Effet de bord : annulation ou remboursement → créer un retour client
	if (newStatus === "CANCELLED" || newStatus === "REFUNDED") {
		await createMovement(
			{
				productId: movement.productId.toString(),
				shopId: movement.shopId.toString(),
				movementType: "RETURN_CUSTOMER",
				quantity: movement.quantity,
				unitPrice: movement.unitPrice,
				groupId: movement.groupId || movement._id.toString(),
				notes: `Retour automatique suite à ${newStatus === "CANCELLED" ? "annulation" : "remboursement"} de la vente ${movement.reference}`,
			},
			performedBy,
		);
	}

	return movement;
};

// ==========================================
// Calcul de stock (proxy vers model static)
// ==========================================

export const getProductStock = async (productId) => {
	const product = await Product.findById(productId);
	if (!product) {
		throw new ApiError(404, "NOT_FOUND", "Produit non trouvé");
	}
	return StockMovement.calculateStock(productId);
};

// ==========================================
// Réconciliation du cache stock
// ==========================================

/**
 * Recalcule et corrige le cache stock d'un produit.
 */
export const reconcileProductStock = async (productId) => {
	const product = await Product.findById(productId);
	if (!product) {
		throw new ApiError(404, "NOT_FOUND", "Produit non trouvé");
	}

	const stockData = await StockMovement.calculateStock(productId);

	product.stock.cache.total = stockData.total;
	product.stock.cache.reserved = stockData.reserved;
	product.stock.cache.available = stockData.available;
	product.stock.cache.lastUpdated = new Date();
	await product.save();

	return {
		productId,
		before: {
			total: product.stock.cache.total,
			reserved: product.stock.cache.reserved,
			available: product.stock.cache.available,
		},
		after: stockData,
	};
};
