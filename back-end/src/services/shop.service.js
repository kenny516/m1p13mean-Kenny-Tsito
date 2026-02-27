import Shop from "../models/Shop.js";
import { ApiError } from "../middlewares/error.middleware.js";
import { parseSortOption } from "../utils/request.util.js";
import * as settingsService from "./settings.service.js";
import {
	uploadShopLogo as uploadShopLogoToImageKit,
	uploadShopBanner as uploadShopBannerToImageKit,
	deleteByFileId,
} from "./imagekit.service.js";

/**
 * Vérifie que la boutique existe et est active.
 * Utilisé par d'autres services (stockMovement, etc.)
 */
export const requireActiveShop = async (shopId, session = null) => {
	const query = Shop.findById(shopId);
	if (session) query.session(session);

	const shop = await query;
	if (!shop) {
		throw new ApiError(404, "NOT_FOUND", "Boutique non trouvée");
	}
	if (!shop.isActive) {
		throw new ApiError(
			400,
			"SHOP_NOT_ACTIVE",
			"La boutique doit être active",
		);
	}
	return shop;
};

/**
 * Crée une nouvelle boutique (status DRAFT, isActive false)
 * Utilise le taux de commission par défaut des paramètres globaux
 */

export const createShop = async (shopData, sellerId, mediaFiles = {}) => {
	const defaultCommissionRate = await settingsService.getDefaultCommissionRate();
	const { logoFile = null, bannerFile = null } = mediaFiles;

	const shop = new Shop({
		...shopData,
		sellerId,
		status: "DRAFT",
		isActive: false,
		commissionRate: shopData.commissionRate ?? defaultCommissionRate,
		logo: null,
		banner: null,
	});

	await shop.save();

	if (logoFile) {
		const uploadedLogo = await uploadShopLogoToImageKit(shop._id.toString(), logoFile);
		shop.logo = uploadedLogo;
	}

	if (bannerFile) {
		const uploadedBanner = await uploadShopBannerToImageKit(shop._id.toString(), bannerFile);
		shop.banner = uploadedBanner;
	}

	if (logoFile || bannerFile) {
		await shop.save();
	}

	return shop;
};

/**
 * Récupère une boutique par son ID
 */
export const getShopById = async (id) => {
	const shop = await Shop.findById(id).populate("sellerId", "email profile");
	if (!shop) {
		throw new ApiError(404, "NOT_FOUND", "Boutique non trouvée");
	}
	return shop;
};

/**
 * Liste les boutiques avec filtres et pagination
 * Par défaut, ne retourne que les boutiques ACTIVE pour le public
 */
export const getShops = async (filters = {}) => {
	const { page = 1, limit = 10, search, category, status = "ACTIVE", sellerId, sort } = filters;

	const query = {};

	// Filtre par statut
	if (status && status !== "ALL") {
		query.status = status;
	}

	// Filtre vendeur
	if (sellerId) {
		query.sellerId = sellerId;
		// Si c'est le vendeur qui regarde ses boutiques, on ne filtre pas par statut par défaut
		if (!filters.status) delete query.status;
	}

	// Recherche full-text
	if (search) {
		query.$text = { $search: search };
	}

	// Filtre catégorie
	if (category) {
		query.categories = category;
	}

	// Tri
	const sortOptions = parseSortOption(sort);

	const skip = (page - 1) * limit;

	const [shops, total] = await Promise.all([
		Shop.find(query)
			.sort(sortOptions)
			.skip(skip)
			.limit(limit)
			.populate("sellerId", "email profile"),
		Shop.countDocuments(query),
	]);

	return {
		shops,
		total,
		page: parseInt(page),
		limit: parseInt(limit),
	};
};

/**
 * Liste les boutiques du vendeur connecté (tous les statuts)
 */
export const getMyShops = async (sellerId, filters = {}) => {
	return getShops({
		...filters,
		sellerId,
	});
};

/**
 * Met à jour une boutique
 * Le vendeur ne peut modifier que les champs de contenu
 */
export const updateShop = async (id, updateData, userId, userRole, mediaFiles = {}) => {
	const { logoFile = null, bannerFile = null } = mediaFiles;
	const shop = await getShopById(id);

	// Vérification des droits (Propriétaire ou Admin)
	if (userRole !== "ADMIN" && shop.sellerId._id.toString() !== userId) {
		throw new ApiError(403, "FORBIDDEN", "Vous n'êtes pas autorisé à modifier cette boutique");
	}

	// Supprimer les champs protégés (sécurité côté service également)
	delete updateData.status;
	delete updateData.isActive;
	delete updateData.commissionRate;
	delete updateData.stats;
	delete updateData.sellerId;

	const previousLogoFileId = shop.logo?.fileId;
	const previousBannerFileId = shop.banner?.fileId;

	if (updateData.logo !== undefined) {
		delete updateData.logo;
	}

	if (updateData.banner !== undefined) {
		delete updateData.banner;
	}

	Object.assign(shop, updateData);

	if (logoFile) {
		const uploadedLogo = await uploadShopLogoToImageKit(shop._id.toString(), logoFile);
		shop.logo = uploadedLogo;
	}

	if (bannerFile) {
		const uploadedBanner = await uploadShopBannerToImageKit(shop._id.toString(), bannerFile);
		shop.banner = uploadedBanner;
	}

	await shop.save();

	if (logoFile && previousLogoFileId) {
		await deleteByFileId(previousLogoFileId);
	}

	if (bannerFile && previousBannerFileId) {
		await deleteByFileId(previousBannerFileId);
	}

	return shop;
};

export const uploadShopLogo = async (id, userId, userRole, logoFile) => {
	if (!logoFile) {
		throw new ApiError(400, "INVALID_FILE", "Aucun fichier logo boutique fourni");
	}

	return updateShop(id, {}, userId, userRole, { logoFile });
};

export const deleteShopLogo = async (id, userId, userRole) => {
	const shop = await getShopById(id);

	if (userRole !== "ADMIN" && shop.sellerId._id.toString() !== userId) {
		throw new ApiError(403, "FORBIDDEN", "Vous n'êtes pas autorisé à modifier cette boutique");
	}

	const previousFileId = shop.logo?.fileId;
	shop.logo = null;
	await shop.save();

	if (previousFileId) {
		await deleteByFileId(previousFileId);
	}

	return shop;
};

export const uploadShopBanner = async (id, userId, userRole, bannerFile) => {
	if (!bannerFile) {
		throw new ApiError(400, "INVALID_FILE", "Aucun fichier bannière boutique fourni");
	}

	return updateShop(id, {}, userId, userRole, { bannerFile });
};

export const deleteShopBanner = async (id, userId, userRole) => {
	const shop = await getShopById(id);

	if (userRole !== "ADMIN" && shop.sellerId._id.toString() !== userId) {
		throw new ApiError(403, "FORBIDDEN", "Vous n'êtes pas autorisé à modifier cette boutique");
	}

	const previousFileId = shop.banner?.fileId;
	shop.banner = null;
	await shop.save();

	if (previousFileId) {
		await deleteByFileId(previousFileId);
	}

	return shop;
};

/**
 * Soumet une boutique pour validation admin (DRAFT → PENDING)
 */
export const submitForReview = async (id, userId) => {
	const shop = await getShopById(id);

	// Vérification propriétaire
	if (shop.sellerId._id.toString() !== userId) {
		throw new ApiError(403, "FORBIDDEN", "Vous n'êtes pas autorisé à soumettre cette boutique");
	}

	// Seules les boutiques en DRAFT ou REJECTED peuvent être soumises
	if (!["DRAFT", "REJECTED"].includes(shop.status)) {
		throw new ApiError(
			400,
			"INVALID_STATUS_TRANSITION",
			`Impossible de soumettre une boutique en statut ${shop.status}. Seules les boutiques en DRAFT ou REJECTED peuvent être soumises`,
		);
	}

	shop.status = "PENDING";
	shop.rejectionReason = undefined;
	await shop.save();
	return shop;
};

/**
 * Archive une boutique (propriétaire ou admin)
 * Uniquement depuis ACTIVE → ARCHIVED
 * Met isActive à false automatiquement via le pre-save hook
 */
export const archiveShop = async (id, userId, userRole) => {
	const shop = await getShopById(id);

	if (userRole !== "ADMIN" && shop.sellerId._id.toString() !== userId) {
		throw new ApiError(403, "FORBIDDEN", "Vous n'êtes pas autorisé à archiver cette boutique");
	}

	if (shop.status !== "ACTIVE") {
		throw new ApiError(
			400,
			"INVALID_STATUS_TRANSITION",
			`Impossible d'archiver une boutique en statut ${shop.status}. Seules les boutiques ACTIVE peuvent être archivées`,
		);
	}

	shop.status = "ARCHIVED";
	await shop.save();
	return shop;
};

/**
 * Réactive une boutique archivée (propriétaire ou admin)
 * Uniquement depuis ARCHIVED → ACTIVE
 * Met isActive à true automatiquement via le pre-save hook
 */
export const activateShop = async (id, userId, userRole) => {
	const shop = await getShopById(id);

	if (userRole !== "ADMIN" && shop.sellerId._id.toString() !== userId) {
		throw new ApiError(403, "FORBIDDEN", "Vous n'êtes pas autorisé à activer cette boutique");
	}

	if (shop.status !== "ARCHIVED") {
		throw new ApiError(
			400,
			"INVALID_STATUS_TRANSITION",
			`Impossible d'activer une boutique en statut ${shop.status}. Seules les boutiques ARCHIVED peuvent être activées`,
		);
	}

	shop.status = "ACTIVE";
	shop.rejectionReason = undefined;
	await shop.save();
	return shop;
};

/**
 * Supprime une boutique
 */
export const deleteShop = async (id, userId, userRole) => {
	const shop = await getShopById(id);

	if (userRole !== "ADMIN" && shop.sellerId._id.toString() !== userId) {
		throw new ApiError(403, "FORBIDDEN", "Vous n'êtes pas autorisé à supprimer cette boutique");
	}

	await shop.deleteOne();
	return shop;
};

/**
 * Modération admin: Approuver ou Rejeter une boutique
 * Seules les boutiques PENDING peuvent être modérées
 */
export const moderateShop = async (id, status, rejectionReason) => {
	const shop = await getShopById(id);

	if (shop.status !== "PENDING") {
		throw new ApiError(
			400,
			"INVALID_STATUS_TRANSITION",
			`Impossible de modérer une boutique en statut ${shop.status}. Seules les boutiques PENDING peuvent être modérées`,
		);
	}

	shop.status = status;
	if (status === "REJECTED") {
		shop.rejectionReason = rejectionReason;
	} else if (status === "ACTIVE") {
		shop.rejectionReason = undefined;
	}

	await shop.save();
	return shop;
};

/**
 * Mise à jour admin d'une boutique (commissionRate, etc.)
 */
export const adminUpdateShop = async (id, updateData) => {
	const shop = await getShopById(id);

	Object.assign(shop, updateData);
	await shop.save();
	return shop;
};
