import StockMovement from "../models/StockMovement.js";
import StockMovementLine from "../models/StockMovementLine.js";
import { VALID_SALE_TRANSITIONS } from "../models/StockMovement.js";
import Product from "../models/Product.js";
import Shop from "../models/Shop.js";
import { ApiError } from "../middlewares/error.middleware.js";
import { parseSortOption } from "../utils/request.util.js";
import { createStockMovement } from "./stockMovementLine.service.js";

const INTERNAL_MOVEMENT_TYPES = [
	"SUPPLY",
	"RETURN_SUPPLIER",
	"ADJUSTMENT_PLUS",
	"ADJUSTMENT_MINUS",
	"RESERVATION",
	"RESERVATION_CANCEL",
];

const MOVEMENT_POPULATE = [
	{
		path: "lineIds",
		populate: [
			{ path: "productId", select: "title sku" },
			{ path: "shopId", select: "name" },
		],
	},
	{ path: "shopId", select: "name" },
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

	const headerQuery = {
		shopId: scopedShopFilter,
		movementType: filters.movementType || { $in: INTERNAL_MOVEMENT_TYPES },
	};

	if (filters.direction) headerQuery.direction = filters.direction;
	if (filters.startDate || filters.endDate) {
		headerQuery.createdAt = {};
		if (filters.startDate) headerQuery.createdAt.$gte = new Date(filters.startDate);
		if (filters.endDate) headerQuery.createdAt.$lte = new Date(filters.endDate);
	}

	const page = Number(filters.page) || 1;
	const limit = Number(filters.limit) || 10;
	const skip = (page - 1) * limit;
	const sortOptions = parseSortOption(filters.sort);

	const [movements, total] = await Promise.all([
		StockMovement.find(headerQuery)
			.populate(MOVEMENT_POPULATE)
			.sort(sortOptions)
			.skip(skip)
			.limit(limit),
		StockMovement.countDocuments(headerQuery),
	]);

	return { movements, total, page, limit };
};

// ==========================================
// Ventes (par shopId)
// ==========================================

export const listSales = async (filters = {}) => {
	const query = { movementType: "SALE" };
	if (filters.shopId) query.shopId = filters.shopId;
	if (filters.status) query["sale.status"] = filters.status;
	if (filters.startDate || filters.endDate) {
		query.createdAt = {};
		if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
		if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
	}

	const page = Number(filters.page) || 1;
	const limit = Number(filters.limit) || 10;
	const skip = (page - 1) * limit;
	const sortOptions = parseSortOption(filters.sort);

	const [movements, total] = await Promise.all([
		StockMovement.find(query)
			.populate(MOVEMENT_POPULATE)
			.sort(sortOptions)
			.skip(skip)
			.limit(limit),
		StockMovement.countDocuments(query),
	]);

	return { sales: movements, total, page, limit };
};

// ==========================================
// Approvisionnements
// ==========================================

export const listSupplies = async (filters = {}) => {
	const query = { movementType: "SUPPLY" };
	if (filters.shopId) query.shopId = filters.shopId;
	if (filters.startDate || filters.endDate) {
		query.createdAt = {};
		if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
		if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
	}

	const page = Number(filters.page) || 1;
	const limit = Number(filters.limit) || 10;
	const skip = (page - 1) * limit;
	const sortOptions = parseSortOption(filters.sort);

	const [movements, total] = await Promise.all([
		StockMovement.find(query)
			.populate(MOVEMENT_POPULATE)
			.sort(sortOptions)
			.skip(skip)
			.limit(limit),
		StockMovement.countDocuments(query),
	]);

	return { supplies: movements, total, page, limit };
};

export const listSellerOrders = async (sellerId, filters = {}) => {
	const shops = await Shop.find({ sellerId }, "_id");
	const ownedShopIds = shops.map((shop) => shop._id.toString());

	if (!ownedShopIds.length) {
		return {
			orders: [],
			total: 0,
			page: Number(filters.page) || 1,
			limit: Number(filters.limit) || 10,
		};
	}

	let scopedShopFilter = { $in: ownedShopIds };
	if (filters.shopId) {
		const requestedShopId = filters.shopId.toString();
		if (!ownedShopIds.includes(requestedShopId)) {
			return {
				orders: [],
				total: 0,
				page: Number(filters.page) || 1,
				limit: Number(filters.limit) || 10,
			};
		}
		scopedShopFilter = requestedShopId;
	}

	const query = {
		shopId: scopedShopFilter,
		movementType: { $in: ["SALE", "RETURN_CUSTOMER"] },
	};

	if (filters.status) {
		query["sale.status"] = filters.status;
	}
	if (filters.startDate || filters.endDate) {
		query.createdAt = {};
		if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
		if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
	}

	const page = Number(filters.page) || 1;
	const limit = Number(filters.limit) || 10;
	const skip = (page - 1) * limit;
	const sortOptions = parseSortOption(filters.sort);

	const [movements, total] = await Promise.all([
		StockMovement.find(query)
			.populate(MOVEMENT_POPULATE)
			.sort(sortOptions)
			.skip(skip)
			.limit(limit),
		StockMovement.countDocuments(query),
	]);

	return { orders: movements, total, page, limit };
};

// ==========================================
// Mise à jour du statut de vente
// ==========================================

/**
 * Met à jour le statut d'une vente.
 * Gère les transitions valides et les effets de bord (annulation → retour stock).
 */
export const updateSaleStatus = async (movementId, statusData, performedBy, options = {}) => {
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
	if (newStatus === "RETURNED") movement.sale.returnedAt = new Date();

	const saveOptions = options.session ? { session: options.session } : {};
	await movement.save(saveOptions);

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

// ==========================================
// Statistiques des commissions (Admin)
// ==========================================

/**
 * Récupère les statistiques de commission globales et par boutique
 * Uniquement pour les ventes livrées (DELIVERED)
 */
export const getCommissionStats = async (filters = {}) => {
	const { startDate, endDate } = filters;

	// Construire le filtre pour les ventes DELIVERED
	const saleMatch = {
		movementType: "SALE",
		"sale.status": "DELIVERED",
	};

	if (startDate || endDate) {
		saleMatch.createdAt = {};
		if (startDate) saleMatch.createdAt.$gte = new Date(startDate);
		if (endDate) saleMatch.createdAt.$lte = new Date(endDate);
	}

	// Récupérer les IDs des mouvements de vente DELIVERED
	const deliveredSales = await StockMovement.find(saleMatch).select("_id");
	const deliveredMoveIds = deliveredSales.map((s) => s._id);

	if (deliveredMoveIds.length === 0) {
		return {
			totalCommission: 0,
			totalSalesAmount: 0,
			salesCount: 0,
			byShop: [],
		};
	}

	// Agréger les commissions par boutique depuis les lignes
	const byShopResult = await StockMovementLine.aggregate([
		{
			$match: {
				moveId: { $in: deliveredMoveIds },
				movementType: "SALE",
			},
		},
		{
			$group: {
				_id: "$shopId",
				totalCommission: { $sum: "$commissionAmount" },
				totalSalesAmount: { $sum: "$totalAmount" },
				salesCount: { $sum: 1 },
				avgCommissionRate: { $avg: "$commissionRate" },
			},
		},
		{
			$lookup: {
				from: "shops",
				localField: "_id",
				foreignField: "_id",
				as: "shop",
			},
		},
		{ $unwind: "$shop" },
		{
			$project: {
				_id: 0,
				shopId: "$_id",
				shopName: "$shop.name",
				totalCommission: { $round: ["$totalCommission", 0] },
				totalSalesAmount: { $round: ["$totalSalesAmount", 0] },
				salesCount: 1,
				avgCommissionRate: { $round: ["$avgCommissionRate", 2] },
			},
		},
		{ $sort: { totalCommission: -1 } },
	]);

	// Calculer les totaux globaux
	const totals = byShopResult.reduce(
		(acc, shop) => ({
			totalCommission: acc.totalCommission + shop.totalCommission,
			totalSalesAmount: acc.totalSalesAmount + shop.totalSalesAmount,
			salesCount: acc.salesCount + shop.salesCount,
		}),
		{ totalCommission: 0, totalSalesAmount: 0, salesCount: 0 },
	);

	return {
		totalCommission: totals.totalCommission,
		totalSalesAmount: totals.totalSalesAmount,
		salesCount: totals.salesCount,
		byShop: byShopResult,
	};
};

/**
 * Récupère les statistiques de commission groupées par période
 * Pour les charts d'évolution temporelle
 * @param {Object} filters - Filtres (startDate, endDate, groupBy)
 * @param {string} filters.groupBy - 'day', 'week', 'month' (default: 'day')
 */
export const getCommissionStatsByPeriod = async (filters = {}) => {
	const { startDate, endDate, groupBy = "day" } = filters;

	// Définir la période par défaut (30 derniers jours)
	const defaultEndDate = new Date();
	const defaultStartDate = new Date();
	defaultStartDate.setDate(defaultStartDate.getDate() - 30);

	const dateFilter = {
		$gte: startDate ? new Date(startDate) : defaultStartDate,
		$lte: endDate ? new Date(endDate) : defaultEndDate,
	};

	// Récupérer les mouvements de vente DELIVERED dans la période
	const deliveredSales = await StockMovement.find({
		movementType: "SALE",
		"sale.status": "DELIVERED",
		createdAt: dateFilter,
	}).select("_id createdAt");

	if (deliveredSales.length === 0) {
		return { data: [], groupBy };
	}

	const deliveredMoveIds = deliveredSales.map((s) => s._id);

	// Créer un map des dates pour chaque mouvement
	const moveDateMap = {};
	deliveredSales.forEach((sale) => {
		moveDateMap[sale._id.toString()] = sale.createdAt;
	});

	// Récupérer les lignes avec leurs montants
	const lines = await StockMovementLine.find({
		moveId: { $in: deliveredMoveIds },
		movementType: "SALE",
	}).select("moveId commissionAmount totalAmount");

	// Grouper manuellement par période
	const groupedData = {};
	lines.forEach((line) => {
		const moveDate = moveDateMap[line.moveId.toString()];
		let periodKey;

		if (groupBy === "week") {
			const weekNum = getISOWeek(moveDate);
			const year = moveDate.getFullYear();
			periodKey = `${year}-W${String(weekNum).padStart(2, "0")}`;
		} else if (groupBy === "month") {
			const year = moveDate.getFullYear();
			const month = String(moveDate.getMonth() + 1).padStart(2, "0");
			periodKey = `${year}-${month}`;
		} else {
			periodKey = moveDate.toISOString().split("T")[0];
		}

		if (!groupedData[periodKey]) {
			groupedData[periodKey] = {
				period: periodKey,
				totalCommission: 0,
				totalSalesAmount: 0,
				salesCount: 0,
			};
		}

		groupedData[periodKey].totalCommission += line.commissionAmount || 0;
		groupedData[periodKey].totalSalesAmount += line.totalAmount || 0;
		groupedData[periodKey].salesCount += 1;
	});

	// Convertir en tableau et trier par date
	const data = Object.values(groupedData)
		.map((item) => ({
			...item,
			totalCommission: Math.round(item.totalCommission),
			totalSalesAmount: Math.round(item.totalSalesAmount),
		}))
		.sort((a, b) => a.period.localeCompare(b.period));

	return { data, groupBy };
};

// Helper pour calculer le numéro de semaine ISO
function getISOWeek(date) {
	const d = new Date(date);
	d.setHours(0, 0, 0, 0);
	d.setDate(d.getDate() + 4 - (d.getDay() || 7));
	const yearStart = new Date(d.getFullYear(), 0, 1);
	return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}
