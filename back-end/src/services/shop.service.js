import Shop from "../models/Shop.js";
import { ApiError } from "../middlewares/error.middleware.js";
import { parseSortOption } from "../utils/request.util.js";

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
 */
export const createShop = async (shopData, sellerId) => {
	const shop = new Shop({
		...shopData,
		sellerId,
		status: "DRAFT",
		isActive: false,
	});

	await shop.save();
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
export const updateShop = async (id, updateData, userId, userRole) => {
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

	Object.assign(shop, updateData);
	await shop.save();
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
 * Met à jour les statistiques d'une boutique (usage interne)
 * Utilisé par d'autres services (commandes, produits, avis)
 */
export const updateShopStats = async (shopId, statUpdates) => {
	const shop = await Shop.findById(shopId);
	if (!shop) {
		throw new ApiError(404, "NOT_FOUND", "Boutique non trouvée");
	}

	// Mise à jour incrémentale des stats
	if (statUpdates.totalSales !== undefined) {
		shop.stats.totalSales += statUpdates.totalSales;
	}
	if (statUpdates.totalProducts !== undefined) {
		shop.stats.totalProducts += statUpdates.totalProducts;
	}
	if (statUpdates.rating !== undefined) {
		shop.stats.rating = statUpdates.rating;
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
