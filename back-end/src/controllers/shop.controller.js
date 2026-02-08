import * as shopService from "../services/shop.service.js";

/**
 * Créer une nouvelle boutique
 * POST /api/shops
 */
export const create = async (req, res, next) => {
	try {
		const shopData = req.body;
		const sellerId = req.user._id;

		const shop = await shopService.createShop(shopData, sellerId);

		res.status(201).json({
			success: true,
			data: shop,
			message: "Boutique créée avec succès (statut: DRAFT)",
		});
	} catch (error) {
		next(error);
	}
};

/**
 * Lister les boutiques actives (public)
 * GET /api/shops
 */
export const list = async (req, res, next) => {
	try {
		const filters = req.query;
		const { shops, total, page, limit } = await shopService.getShops(filters);

		res.json({
			success: true,
			data: shops,
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

/**
 * Lister les boutiques du vendeur connecté
 * GET /api/shops/my-shops
 */
export const listMyShops = async (req, res, next) => {
	try {
		const filters = req.query;
		const { shops, total, page, limit } = await shopService.getMyShops(req.user._id, filters);

		res.json({
			success: true,
			data: shops,
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

/**
 * Récupérer une boutique par son ID
 * GET /api/shops/:id
 */
export const getOne = async (req, res, next) => {
	try {
		const { id } = req.params;
		const shop = await shopService.getShopById(id);

		res.json({
			success: true,
			data: shop,
		});
	} catch (error) {
		next(error);
	}
};

/**
 * Mettre à jour une boutique (contenu uniquement)
 * PUT /api/shops/:id
 */
export const update = async (req, res, next) => {
	try {
		const { id } = req.params;
		const updateData = req.body;
		const userId = req.user._id.toString();
		const userRole = req.user.role;

		const shop = await shopService.updateShop(id, updateData, userId, userRole);

		res.json({
			success: true,
			data: shop,
			message: "Boutique mise à jour avec succès",
		});
	} catch (error) {
		next(error);
	}
};

/**
 * Soumettre une boutique pour validation (DRAFT/REJECTED → PENDING)
 * PATCH /api/shops/:id/submit
 */
export const submitForReview = async (req, res, next) => {
	try {
		const { id } = req.params;
		const userId = req.user._id.toString();

		const shop = await shopService.submitForReview(id, userId);

		res.json({
			success: true,
			data: shop,
			message: "Boutique soumise pour validation",
		});
	} catch (error) {
		next(error);
	}
};

/**
 * Archiver une boutique
 * PATCH /api/shops/:id/archive
 */
export const archive = async (req, res, next) => {
	try {
		const { id } = req.params;
		const userId = req.user._id.toString();
		const userRole = req.user.role;

		const shop = await shopService.archiveShop(id, userId, userRole);

		res.json({
			success: true,
			data: shop,
			message: "Boutique archivée avec succès",
		});
	} catch (error) {
		next(error);
	}
};

/**
 * Réactiver une boutique
 * PATCH /api/shops/:id/activate
 */
export const activate = async (req, res, next) => {
	try {
		const { id } = req.params;
		const userId = req.user._id.toString();
		const userRole = req.user.role;

		const shop = await shopService.activateShop(id, userId, userRole);

		res.json({
			success: true,
			data: shop,
			message: "Boutique activée avec succès",
		});
	} catch (error) {
		next(error);
	}
};

/**
 * Supprimer une boutique
 * DELETE /api/shops/:id
 */
export const remove = async (req, res, next) => {
	try {
		const { id } = req.params;
		const userId = req.user._id.toString();
		const userRole = req.user.role;

		await shopService.deleteShop(id, userId, userRole);

		res.json({
			success: true,
			message: "Boutique supprimée avec succès",
		});
	} catch (error) {
		next(error);
	}
};

/**
 * Modérer une boutique - Admin (PENDING → ACTIVE/REJECTED)
 * PATCH /api/admin/shops/:id/moderate
 */
export const moderate = async (req, res, next) => {
	try {
		const { id } = req.params;
		const { status, rejectionReason } = req.body;

		const shop = await shopService.moderateShop(id, status, rejectionReason);

		const action = status === "ACTIVE" ? "approuvée" : "rejetée";

		res.json({
			success: true,
			data: shop,
			message: `Boutique ${action} avec succès`,
		});
	} catch (error) {
		next(error);
	}
};

/**
 * Lister les boutiques en attente de modération - Admin
 * GET /api/admin/shops/pending
 */
export const getPendingShops = async (req, res, next) => {
	try {
		const filters = { ...req.query, status: "PENDING" };
		const { shops, total, page, limit } = await shopService.getShops(filters);

		res.json({
			success: true,
			data: shops,
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

/**
 * Lister toutes les boutiques avec filtres - Admin
 * GET /api/admin/shops
 */
export const listAllShops = async (req, res, next) => {
	try {
		const filters = { ...req.query };
		// Admin voit tous les statuts par défaut
		if (!filters.status) {
			filters.status = "ALL";
		}
		const { shops, total, page, limit } = await shopService.getShops(filters);

		res.json({
			success: true,
			data: shops,
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

/**
 * Mise à jour admin d'une boutique (commissionRate, etc.)
 * PUT /api/admin/shops/:id
 */
export const adminUpdate = async (req, res, next) => {
	try {
		const { id } = req.params;
		const updateData = req.body;

		const shop = await shopService.adminUpdateShop(id, updateData);

		res.json({
			success: true,
			data: shop,
			message: "Boutique mise à jour par l'admin",
		});
	} catch (error) {
		next(error);
	}
};
