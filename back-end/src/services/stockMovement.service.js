import StockMovement from "../models/StockMovement.js";
import StockMovementLine from "../models/StockMovementLine.js";
import { VALID_SALE_TRANSITIONS } from "../models/StockMovement.js";
import Product from "../models/Product.js";
import Shop from "../models/Shop.js";
import { ApiError } from "../middlewares/error.middleware.js";
import { parseSortOption } from "../utils/request.util.js";
import { createStockMovement } from "./stockMovementLine.service.js";

const MOVEMENT_POPULATE = [
	{
		path: "lineIds",
		populate: [
			{ path: "productId", select: "title sku" },
			{ path: "shopId", select: "name" },
		],
	},
	{ path: "performedBy", select: "email profile" },
];

const _resolveMoveIdsFromLineFilters = async (filters = {}) => {
	const { productId, shopId, movementType, direction, startDate, endDate } = filters;

	const query = {};
	if (productId) query.productId = productId;
	if (shopId) query.shopId = shopId;
	if (movementType) query.movementType = movementType;
	if (direction) query.direction = direction;
	if (startDate || endDate) {
		query.createdAt = {};
		if (startDate) query.createdAt.$gte = new Date(startDate);
		if (endDate) query.createdAt.$lte = new Date(endDate);
	}

	if (!Object.keys(query).length) {
		return null;
	}

	return StockMovementLine.find(query).distinct("moveId");
};

const _listMovementsByIds = async (moveIds, filters = {}) => {
	const { page = 1, limit = 10, movementType, direction, startDate, endDate, sort } = filters;

	const query = {};
	if (moveIds) {
		if (!moveIds.length) {
			return { movements: [], total: 0, page, limit };
		}
		query._id = { $in: moveIds };
	}

	if (movementType) query.movementType = movementType;
	if (direction) query.direction = direction;
	if (startDate || endDate) {
		query.createdAt = {};
		if (startDate) query.createdAt.$gte = new Date(startDate);
		if (endDate) query.createdAt.$lte = new Date(endDate);
	}

	const sortOptions = parseSortOption(sort);
	const skip = (page - 1) * limit;

	const [movements, total] = await Promise.all([
		StockMovement.find(query)
			.populate(MOVEMENT_POPULATE)
			.sort(sortOptions)
			.skip(skip)
			.limit(limit),
		StockMovement.countDocuments(query),
	]);

	return { movements, total, page, limit };
};

// ==========================================
// Création d'un mouvement de stock (header + lignes)
// ==========================================

export const createMovement = async (payload, performedBy, options = {}) => {

	const { header } = await createStockMovement(payload, performedBy, options);
	return await StockMovement.findById(header._id)
		.populate(MOVEMENT_POPULATE);
};

// ==========================================
// Lecture d'un mouvement
// ==========================================

export const getMovementById = async (id) => {
	const movement = await StockMovement.findById(id)
		.populate(MOVEMENT_POPULATE)

	if (!movement) {
		throw new ApiError(404, "NOT_FOUND", "Mouvement de stock non trouvé");
	}
	return movement;
};

// ==========================================
// Liste des mouvements avec filtres + pagination
// ==========================================

export const listMovements = async (filters = {}) => {
	const moveIds = await _resolveMoveIdsFromLineFilters(filters);
	return _listMovementsByIds(moveIds, filters);
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

	let scopedShopFilter = { $in: shopIds };
	if (filters.shopId) {
		const requestedShopId = filters.shopId.toString();
		const ownsRequestedShop = shopIds.some(
			(shopId) => shopId.toString() === requestedShopId,
		);

		if (!ownsRequestedShop) {
			return {
				movements: [],
				total: 0,
				page: Number(filters.page) || 1,
				limit: Number(filters.limit) || 10,
			};
		}

		scopedShopFilter = requestedShopId;
	}

	const moveIds = await _resolveMoveIdsFromLineFilters({
		...filters,
		shopId: scopedShopFilter,
	});

	return _listMovementsByIds(moveIds, filters);
};

// ==========================================
// Ventes (par shopId)
// ==========================================

export const listSales = async (filters = {}) => {
	const moveIds = await _resolveMoveIdsFromLineFilters({
		shopId: filters.shopId,
		movementType: "SALE",
	});

	const { movements, total, page, limit } = await _listMovementsByIds(moveIds, {
		...filters,
		movementType: "SALE",
	});

	return { sales: movements, total, page, limit };
};

// ==========================================
// Approvisionnements
// ==========================================

export const listSupplies = async (filters = {}) => {
	const moveIds = await _resolveMoveIdsFromLineFilters({
		shopId: filters.shopId,
		movementType: "SUPPLY",
	});

	const { movements, total, page, limit } = await _listMovementsByIds(moveIds, {
		...filters,
		movementType: "SUPPLY",
	});

	return { supplies: movements, total, page, limit };
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
	if (newStatus === "CONFIRMED") movement.sale.confirmedAt = new Date();
	if (newStatus === "DELIVERED") movement.sale.deliveredAt = new Date();
	if (newStatus === "CANCELLED") movement.sale.cancelledAt = new Date();

	await movement.save();

	// Effet de bord : annulation → créer un retour client
	if (newStatus === "CANCELLED") {
		const lines = await StockMovementLine.find({ moveId: movement._id });
		if (lines.length) {
			const items = lines.map((line) => ({
				productId: line.productId.toString(),
				shopId: line.shopId.toString(),
				quantity: line.quantity,
				unitPrice: line.unitPrice,
			}));

			await createStockMovement(
				{
					movementType: "RETURN_CUSTOMER",
					items,
					note: `Retour automatique suite a annulation de la vente ${movement.reference}`,
					date : new Date(),
				},
				performedBy,
			);
		}
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
	return StockMovementLine.calculateStock(productId);
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

	const before = {
		total: product.stock.cache.total,
		reserved: product.stock.cache.reserved,
		available: product.stock.cache.available,
	};

	const stockData = await StockMovementLine.calculateStock(productId);

	product.stock.cache.total = stockData.total;
	product.stock.cache.reserved = stockData.reserved;
	product.stock.cache.available = stockData.available;
	product.stock.cache.lastUpdated = new Date();
	await product.save();

	return {
		productId,
		before,
		after: stockData,
	};
};
