import * as shopService from "../services/shop.service.js";

const serializeShopMedia = (shop) => {
	if (!shop) return shop;

	const serialized =
		typeof shop.toJSON === "function"
			? shop.toJSON()
			: { ...shop };

	if (serialized.logo && typeof serialized.logo === "object") {
		serialized.logo = serialized.logo.url || null;
	}

	if (serialized.banner && typeof serialized.banner === "object") {
		serialized.banner = serialized.banner.url || null;
	}

	return serialized;
};

const serializeShopsMedia = (shops = []) => shops.map((shop) => serializeShopMedia(shop));

/**
 * Créer une nouvelle boutique
 * POST /api/shops
 */
export const create = async (req, res, next) => {
	try {
		const shopData = req.body;
		const sellerId = req.user._id;
		const mediaFiles = {
			logoFile: req.files?.logo?.[0] || null,
			bannerFile: req.files?.banner?.[0] || null,
		};

		const shop = await shopService.createShop(shopData, sellerId, mediaFiles);

		res.status(201).json({
			success: true,
			data: serializeShopMedia(shop),
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
			data: serializeShopsMedia(shops),
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
			data: serializeShopsMedia(shops),
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
			data: serializeShopMedia(shop),
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
		const mediaFiles = {
			logoFile: req.files?.logo?.[0] || null,
			bannerFile: req.files?.banner?.[0] || null,
		};

		const shop = await shopService.updateShop(id, updateData, userId, userRole, mediaFiles);

		res.json({
			success: true,
			data: serializeShopMedia(shop),
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
			data: serializeShopMedia(shop),
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
			data: serializeShopMedia(shop),
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
			data: serializeShopMedia(shop),
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
			data: serializeShopMedia(shop),
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
			data: serializeShopsMedia(shops),
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
			data: serializeShopsMedia(shops),
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
			data: serializeShopMedia(shop),
			message: "Boutique mise à jour par l'admin",
		});
	} catch (error) {
		next(error);
	}
};

/**
 * Upload ou remplace le logo d'une boutique
 * PUT /api/shops/:id/logo
 */
export const uploadLogo = async (req, res, next) => {
	try {
		const { id } = req.params;
		const userId = req.user._id.toString();
		const userRole = req.user.role;

		const shop = await shopService.uploadShopLogo(id, userId, userRole, req.file);

		res.json({
			success: true,
			data: serializeShopMedia(shop),
			message: "Logo boutique mis à jour avec succès",
		});
	} catch (error) {
		next(error);
	}
};

/**
 * Supprime le logo d'une boutique
 * DELETE /api/shops/:id/logo
 */
export const deleteLogo = async (req, res, next) => {
	try {
		const { id } = req.params;
		const userId = req.user._id.toString();
		const userRole = req.user.role;

		const shop = await shopService.deleteShopLogo(id, userId, userRole);

		res.json({
			success: true,
			data: serializeShopMedia(shop),
			message: "Logo boutique supprimé avec succès",
		});
	} catch (error) {
		next(error);
	}
};

/**
 * Upload ou remplace la bannière d'une boutique
 * PUT /api/shops/:id/banner
 */
export const uploadBanner = async (req, res, next) => {
	try {
		const { id } = req.params;
		const userId = req.user._id.toString();
		const userRole = req.user.role;

		const shop = await shopService.uploadShopBanner(id, userId, userRole, req.file);

		res.json({
			success: true,
			data: serializeShopMedia(shop),
			message: "Bannière boutique mise à jour avec succès",
		});
	} catch (error) {
		next(error);
	}
};

/**
 * Supprime la bannière d'une boutique
 * DELETE /api/shops/:id/banner
 */
export const deleteBanner = async (req, res, next) => {
	try {
		const { id } = req.params;
		const userId = req.user._id.toString();
		const userRole = req.user.role;

		const shop = await shopService.deleteShopBanner(id, userId, userRole);

		res.json({
			success: true,
			data: serializeShopMedia(shop),
			message: "Bannière boutique supprimée avec succès",
		});
	} catch (error) {
		next(error);
	}
};
