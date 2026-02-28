import * as stockMovementService from "../services/stockMovement.service.js";
import { listMovementLines } from "../services/stockMovementLine.service.js";
import Shop from "../models/Shop.js";
import { ApiError } from "../middlewares/error.middleware.js";

const resolveSellerShopFilter = async (user, requestedShopId) => {
	if (user.role !== "SELLER") {
		return requestedShopId ? { shopId: requestedShopId } : {};
	}

	const shops = await Shop.find({ sellerId: user._id }, "_id").lean();
	const ownedShopIds = shops.map((shop) => shop._id.toString());

	if (requestedShopId) {
		const isOwnedShop = ownedShopIds.includes(requestedShopId.toString());
		if (!isOwnedShop) {
			throw new ApiError(403, "FORBIDDEN", "Accès interdit à cette boutique");
		}
		return { shopId: requestedShopId };
	}

	return { shopId: { $in: ownedShopIds } };
};

// ==========================================
// Créer un mouvement de stock
// POST /api/stock-movements
// ==========================================

export const create = async (req, res, next) => {
	try {
		const movement = await stockMovementService.createMovement(
			req.body,
			req.user._id,
		);

		res.status(201).json({
			success: true,
			data: movement,
			message: "Mouvement de stock créé avec succès",
		});
	} catch (error) {
		next(error);
	}
};

// ==========================================
// Récupérer un mouvement par ID
// GET /api/stock-movements/:id
// ==========================================

export const getOne = async (req, res, next) => {
	try {
		const movement = await stockMovementService.getMovementById(
			req.params.id,
		);

		if (req.user.role === "SELLER") {
			const shops = await Shop.find({ sellerId: req.user._id }, "_id").lean();
			const ownedShopIds = new Set(shops.map((shop) => shop._id.toString()));
			const lineShopIds = (movement.lineIds || [])
				.map((line) => {
					const lineShop = line?.shopId;
					if (!lineShop) return null;

					if (typeof lineShop === "string") {
						return lineShop;
					}

					if (typeof lineShop === "object") {
						if (lineShop._id) return lineShop._id.toString();
						const raw = lineShop.toString?.();
						if (raw && raw !== "[object Object]") return raw;
					}

					return null;
				})
				.filter(Boolean);

			const hasForeignShop = lineShopIds.some((shopId) => !ownedShopIds.has(shopId));
			if (hasForeignShop) {
				throw new ApiError(403, "FORBIDDEN", "Accès interdit à ce mouvement");
			}
		}

		res.json({
			success: true,
			data: movement,
		});
	} catch (error) {
		next(error);
	}
};

// ==========================================
// Lister les mouvements (vendeur → ses boutiques)
// GET /api/stock-movements
// ==========================================

export const list = async (req, res, next) => {
	try {
		const { movements, total, page, limit } =
			await stockMovementService.listMyShopMovements(
				req.user._id,
				req.query,
			);

		res.json({
			success: true,
			data: movements,
			pagination: {
				page,
				limit,
				total,
				pages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		next(error);
	}
};

// ==========================================
// Lister les ventes (vendeur → ses boutiques)
// GET /api/stock-movements/sales
// ==========================================

export const listSales = async (req, res, next) => {
	try {
		const shopScope = await resolveSellerShopFilter(req.user, req.query.shopId);
		const filters = { ...req.query, ...shopScope };
		const { sales, total, page, limit } =
			await stockMovementService.listSales(filters);

		res.json({
			success: true,
			data: sales,
			pagination: {
				page,
				limit,
				total,
				pages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		next(error);
	}
};

// ==========================================
// Lister les approvisionnements
// GET /api/stock-movements/supplies
// ==========================================

export const listSupplies = async (req, res, next) => {
	try {
		const shopScope = await resolveSellerShopFilter(req.user, req.query.shopId);
		const filters = { ...req.query, ...shopScope };
		const { supplies, total, page, limit } =
			await stockMovementService.listSupplies(filters);

		res.json({
			success: true,
			data: supplies,
			pagination: {
				page,
				limit,
				total,
				pages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		next(error);
	}
};

// ==========================================
// Mettre à jour le statut d'une vente
// PATCH /api/stock-movements/:id/sale-status
// ==========================================

export const updateSaleStatus = async (req, res, next) => {
	try {
		const movement = await stockMovementService.updateSaleStatus(
			req.params.id,
			req.body,
			req.user._id,
		);

		res.json({
			success: true,
			data: movement,
			message: `Statut de vente mis à jour : ${movement.sale.status}`,
		});
	} catch (error) {
		next(error);
	}
};

// ==========================================
// Consulter le stock calculé d'un produit
// GET /api/stock-movements/product/:productId/stock
// ==========================================

export const getProductStock = async (req, res, next) => {
	try {
		const stockData = await stockMovementService.getProductStock(
			req.params.productId,
		);

		res.json({
			success: true,
			data: stockData,
		});
	} catch (error) {
		next(error);
	}
};

// ==========================================
// Admin : lister tous les mouvements (sans filtre ownership)
// GET /api/admin/stock-movements
// ==========================================

export const adminListAll = async (req, res, next) => {
	try {
		const { movements, total, page, limit } =
			await stockMovementService.listMovements(req.query);

		res.json({
			success: true,
			data: movements,
			pagination: {
				page,
				limit,
				total,
				pages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		next(error);
	}
};

// ==========================================
// Admin : réconcilier le cache stock d'un produit
// POST /api/admin/stock-movements/reconcile/:productId
// ==========================================

export const reconcile = async (req, res, next) => {
	try {
		const result = await stockMovementService.reconcileProductStock(
			req.params.productId,
		);

		res.json({
			success: true,
			data: result,
			message: "Cache stock réconcilié avec succès",
		});
	} catch (error) {
		next(error);
	}
};

// ==========================================
// Lister les lignes de mouvement
// GET /api/stock-movements/lines
// ==========================================

export const listLines = async (req, res, next) => {
	try {
		const shopScope = await resolveSellerShopFilter(req.user, req.query.shopId);
		const filters = { ...req.query, ...shopScope };
		const { lines, total, page, limit } = await listMovementLines(filters);

		res.json({
			success: true,
			data: lines,
			pagination: {
				page,
				limit,
				total,
				pages: Math.ceil(total / limit),
			},
		});
	} catch (error) {
		next(error);
	}
};
