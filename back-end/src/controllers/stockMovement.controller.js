import * as stockMovementService from "../services/stockMovement.service.js";

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
		// Trouver les shops du vendeur pour filtrer
		const { sales, total, page, limit } =
			await stockMovementService.listSales(req.query);

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
		const { supplies, total, page, limit } =
			await stockMovementService.listSupplies(req.query);

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
