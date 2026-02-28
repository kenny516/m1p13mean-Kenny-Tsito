import mongoose from "mongoose";
import Product from "../models/Product.js";
import { ApiError } from "../middlewares/error.middleware.js";
import { parseSortOption } from "../utils/request.util.js";
import {
	uploadProductImageAtIndex,
	deleteByFileId,
} from "./imagekit.service.js";

const uploadAndAppendProductImages = async (product, files = []) => {
	if (!Array.isArray(files) || files.length === 0) return;

	const resolvedShopId =
		typeof product.shopId === "string"
			? product.shopId
			: product.shopId?._id?.toString?.() || product.shopId?.toString?.();

	if (!resolvedShopId || resolvedShopId === "[object Object]") {
		throw new ApiError(400, "INVALID_SHOP", "Identifiant de boutique invalide pour l'upload d'image produit");
	}

	const startIndex = Array.isArray(product.images) ? product.images.length : 0;
	const uploadedImages = [];

	for (let index = 0; index < files.length; index += 1) {
		const uploaded = await uploadProductImageAtIndex({
			shopId: resolvedShopId,
			productId: product._id.toString(),
			index: startIndex + index,
			file: files[index],
		});

		uploadedImages.push(uploaded);
	}

	product.images = [...(product.images || []), ...uploadedImages];
};

/**
 * Vérifie que le produit existe, est ACTIVE, et appartient au shop donné.
 * Utilisé par d'autres services (stockMovement, etc.)
 */
export const requireActiveProduct = async (productId, shopId = null, session = null) => {
	const query = Product.findById(productId);
	if (session) query.session(session);

	const product = await query;
	if (!product) {
		throw new ApiError(404, "NOT_FOUND", "Produit non trouvé");
	}
	if (shopId && product.shopId.toString() !== shopId) {
		throw new ApiError(
			400,
			"INVALID_SHOP",
			"Le produit n'appartient pas à cette boutique",
		);
	}
	if (product.status !== "ACTIVE") {
		throw new ApiError(
			400,
			"PRODUCT_NOT_ACTIVE",
			"Le produit doit être au statut ACTIVE",
		);
	}
	return product;
};

/**
 * Crée un nouveau produit
 * Le statut est forcé à PENDING pour validation admin
 */
export const createProduct = async (productData, sellerId, shopId, imageFiles = []) => {
	const product = new Product({
		...productData,
		sellerId,
		shopId,
		status: "PENDING", // Toujours en attente de validation admin
		images: [],
	});

	await product.save();
	await uploadAndAppendProductImages(product, imageFiles);

	if (Array.isArray(imageFiles) && imageFiles.length > 0) {
		await product.save();
	}

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
		query.status = status;
	}

	// Filtre vendeur
	if (sellerId) {
		query.sellerId = sellerId;
		// Si c'est le vendeur, on peut ignorer le status par défaut si non spécifié explicitement
		if (!filters.status) delete query.status;
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
	const sortOptions = parseSortOption(sort);

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
export const getProductById = async (id, session = null) => {
	const query = Product.findById(id).populate("shopId", "name ownerId");
	if (session) query.session(session);
	const product = await query;
	if (!product) {
		throw new ApiError(404, "NOT_FOUND", "Produit non trouvé");
	}
	return product;
};

/**
 * Met à jour un produit
 * Si le produit était ACTIVE et qu'un vendeur le modifie, il repasse en PENDING
 */
export const updateProduct = async (id, updateData, userId, userRole, imageFiles = []) => {
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

	// Si vendeur modifie un produit ACTIVE, repasser en PENDING pour re-validation
	// Sauf si c'est juste un changement de statut vers ARCHIVED
	const isStatusChangeOnly = Object.keys(updateData).length === 1 && updateData.status;
	const isArchiving = updateData.status === "ARCHIVED";
	
	if (userRole !== "ADMIN" && product.status === "ACTIVE" && !isStatusChangeOnly) {
		product.status = "PENDING";
	} else if (updateData.status) {
		product.status = updateData.status;
		delete updateData.status;
	}

	// Mise à jour des champs directs
	Object.assign(product, updateData);

	await uploadAndAppendProductImages(product, imageFiles);

	await product.save();
	return product;
};

export const addProductImages = async (id, userId, userRole, imageFiles = []) => {
	if (!Array.isArray(imageFiles) || imageFiles.length === 0) {
		throw new ApiError(400, "INVALID_FILE", "Aucune image fournie");
	}

	const product = await getProductById(id);

	if (userRole !== "ADMIN" && product.sellerId.toString() !== userId) {
		throw new ApiError(403, "FORBIDDEN", "Vous n'êtes pas autorisé à modifier ce produit");
	}

	await uploadAndAppendProductImages(product, imageFiles);
	await product.save();

	return product;
};

export const deleteProductImageByIndex = async (id, imageIndex, userId, userRole) => {
	const product = await getProductById(id);

	if (userRole !== "ADMIN" && product.sellerId.toString() !== userId) {
		throw new ApiError(403, "FORBIDDEN", "Vous n'êtes pas autorisé à modifier ce produit");
	}

	if (!Number.isInteger(imageIndex) || imageIndex < 0 || imageIndex >= product.images.length) {
		throw new ApiError(400, "INVALID_INDEX", "Index d'image invalide");
	}

	const [deletedImage] = product.images.splice(imageIndex, 1);
	await product.save();

	if (deletedImage?.fileId) {
		await deleteByFileId(deletedImage.fileId);
	}

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
export const moderateProduct = async (id, status, rejectionReason) => {
	const product = await getProductById(id);

	product.status = status;
	if (status === "REJECTED") {
		product.rejectionReason = rejectionReason;
	} else if (status === "ACTIVE") {
		product.rejectionReason = undefined;
	}

	await product.save();
	return product;
};
