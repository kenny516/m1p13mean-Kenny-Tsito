import Product from "../models/Product.js";
import { ApiError } from "../middlewares/error.middleware.js";

/**
 * Crée un nouveau produit
 */
export const createProduct = async (productData, sellerId, shopId) => {
	const product = new Product({
		...productData,
		sellerId,
		shopId,
	});

	await product.save();
	return product;
};

/**
 * Récupère une liste de produits avec filtres et pagination
 */
export const getProducts = async (filters = {}) => {
	const {
		page = 1,
		limit = 10,
		search,
		category,
		tags,
		minPrice,
		maxPrice,
		shopId,
		sort,
		status = "ACTIVE",
		sellerId,
	} = filters;

	const query = {};

	// Filtre par statut (sauf si un vendeur regarde ses produits ou admin)
	if (status && status !== "ALL") {
		query["moderation.status"] = status;
	}

	// Filtre vendeur
	if (sellerId) {
		query.sellerId = sellerId;
		// Si c'est le vendeur, on peut ignorer le status par défaut si non spécifié explicitement
		if (!filters.status) delete query["moderation.status"];
	}

	// Filtre boutique
	if (shopId) {
		query.shopId = shopId;
	}

	// Recherche full-text
	if (search) {
		query.$text = { $search: search };
	}

	// Filtre catégorie
	if (category) {
		query.category = category;
	}

	// Filtre tags (un ou plusieurs)
	if (tags) {
		const tagsList = Array.isArray(tags) ? tags : [tags];
		// Recherche les produits qui ont TOUS les tags demandés ($all)
		// OU au moins UN des tags ($in) -> on choisit $in pour un filtre plus large généralement
		query.tags = { $in: tagsList };
	}

	// Filtre prix
	if (minPrice !== undefined || maxPrice !== undefined) {
		query.price = {};
		if (minPrice !== undefined) query.price.$gte = minPrice;
		if (maxPrice !== undefined) query.price.$lte = maxPrice;
	}

	// Tri
	let sortOptions = { createdAt: -1 };

	if (sort) {
		try {
			// Format attendu: JSON object directement {"price": "asc", "createdAt": "desc"}
			// Si sort est déjà un objet après parsing de query string par Express
			const sortParsed = typeof sort === "string" ? JSON.parse(sort) : sort;
			const newSortOptions = {};

			for (const [key, value] of Object.entries(sortParsed)) {
				// Conversion 'asc'/1 -> 1, 'desc'/-1 -> -1
				const direction = String(value).toLowerCase() === "asc" || value == 1 ? 1 : -1;
				newSortOptions[key] = direction;
			}

			if (Object.keys(newSortOptions).length > 0) {
				sortOptions = newSortOptions;
			}
		} catch (e) {
			console.warn("Invalid sort format:", sort);
		}
	}

	// Exécution
	const skip = (page - 1) * limit;

	const [products, total] = await Promise.all([
		Product.find(query).sort(sortOptions).skip(skip).limit(limit).populate("shopId", "name"),
		Product.countDocuments(query),
	]);

	return {
		products,
		total,
		page: parseInt(page),
		limit: parseInt(limit),
	};
};

/**
 * Récupère un produit par son ID
 */
export const getProductById = async (id) => {
	const product = await Product.findById(id).populate("shopId", "name ownerId");
	if (!product) {
		throw new ApiError(404, "NOT_FOUND", "Produit non trouvé");
	}
	return product;
};

/**
 * Met à jour un produit
 */
export const updateProduct = async (id, updateData, userId, userRole) => {
	const product = await getProductById(id);

	// Vérification des droits (Propriétaire ou Admin)
	if (userRole !== "ADMIN" && product.sellerId.toString() !== userId) {
		throw new ApiError(403, "FORBIDDEN", "Vous n'êtes pas autorisé à modifier ce produit");
	}

	// Gestion sécurisée des mises à jour imbriquées
	if (updateData.stock?.alert) {
		product.stock.alert = {
			...product.stock.alert,
			...updateData.stock.alert,
		};
		delete updateData.stock;
	}

	if (updateData.moderation?.status) {
		product.moderation.status = updateData.moderation.status;
		delete updateData.moderation;
	}

	// Si modif par vendeur, potentiellement remettre en PENDING si c'était ACTIVE
	// if (userRole !== 'ADMIN' && product.moderation.status === 'ACTIVE') {
	//   product.moderation.status = 'PENDING';
	// }

	// Mise à jour des champs directs
	Object.assign(product, updateData);

	await product.save();
	return product;
};

/**
 * Supprime un produit
 */
export const deleteProduct = async (id, userId, userRole) => {
	const product = await getProductById(id);

	if (userRole !== "ADMIN" && product.sellerId.toString() !== userId) {
		throw new ApiError(403, "FORBIDDEN", "Vous n'êtes pas autorisé à supprimer ce produit");
	}

	await product.deleteOne();
	return product;
};

/**
 * Validation Admin (Approuver/Rejeter)
 */
export const validateProduct = async (id, status, rejectionReason) => {
	const product = await getProductById(id);

	product.moderation.status = status;
	if (status === "REJECTED") {
		product.moderation.rejectionReason = rejectionReason;
	} else if (status === "ACTIVE") {
		product.moderation.rejectionReason = undefined;
	}

	await product.save();
	return product;
};

/**
 * Met à jour le stock
 */
export const updateStock = async (id, quantity, operation = "set") => {
	const product = await getProductById(id);

	if (operation === "add") {
		product.stock.cache.total += quantity;
		product.stock.cache.available += quantity;
	} else if (operation === "subtract") {
		product.stock.cache.total -= quantity;
		product.stock.cache.available -= quantity;
	} else if (operation === "set") {
		// Vérifier que le nouveau total couvre au moins le stock réservé
		if (quantity < product.stock.cache.reserved) {
			throw new ApiError(
				400,
				"BAD_REQUEST",
				`Impossible de réduire le stock à ${quantity}. ${product.stock.cache.reserved} articles sont réservés.`,
			);
		}
		const diff = quantity - product.stock.cache.total;
		product.stock.cache.total = quantity;
		product.stock.cache.available += diff;
	}

	product.stock.cache.lastUpdated = new Date();
	await product.save();
	return product;
};

/**
 * Gère la réservation de stock (Panier/Commande)
 */
export const manageStockReservation = async (id, quantity, action) => {
	const product = await getProductById(id);

	if (action === "reserve") {
		// Vérification disponibilité
		if (product.stock.cache.available < quantity) {
			throw new ApiError(
				400,
				"STOCK_INSUFFICIENT",
				`Stock insuffisant. Disponible: ${product.stock.cache.available}`,
			);
		}
		product.stock.cache.reserved += quantity;
		product.stock.cache.available -= quantity;
	} else if (action === "release") {
		// Libération (Annulation panier/commande)
		// On ne peut pas libérer plus que ce qui est réservé
		const safeQuantity = Math.min(quantity, product.stock.cache.reserved);
		product.stock.cache.reserved -= safeQuantity;
		product.stock.cache.available += safeQuantity;
	} else if (action === "commit") {
		// Validation définitive (Achat finalisé)
		// Le stock quitte les réserves et sort définitivement du total
		if (product.stock.cache.reserved < quantity) {
			throw new ApiError(
				400,
				"STOCK_ERROR",
				"Incohérence: tentative de valider plus de stock que réservé",
			);
		}
		product.stock.cache.reserved -= quantity;
		product.stock.cache.total -= quantity;
		// 'available' ne change pas, car il avait déjà été déduit lors du 'reserve'
	}

	product.stock.cache.lastUpdated = new Date();
	await product.save();
	return product;
};
