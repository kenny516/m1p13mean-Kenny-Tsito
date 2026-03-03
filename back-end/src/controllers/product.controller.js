import * as productService from "../services/product.service.js";
import Shop from "../models/Shop.js";
import { ApiError } from "../middlewares/error.middleware.js";

const serializeProductMedia = (product) => {
	if (!product) return product;

	const serialized =
		typeof product.toJSON === "function"
			? product.toJSON()
			: { ...product };

	if (Array.isArray(serialized.images)) {
		serialized.images = serialized.images
			.map((image) => {
				if (typeof image === "string") return image;
				return image?.url || null;
			})
			.filter(Boolean);
	}

	return serialized;
};

const serializeProductsMedia = (products = []) =>
	products.map((product) => serializeProductMedia(product));

/**
 * Créer un nouveau produit
 * POST /api/products
 */
export const create = async (req, res, next) => {
	try {
		const { shopId, ...productData } = req.body;
		const sellerId = req.user._id;

		const shop = await Shop.findOne({
			_id: shopId,
			sellerId,
		})
			.select("_id isActive")
			.lean();
		if (!shop) {
			throw new ApiError(
				404,
				"NOT_FOUND",
				"Boutique introuvable ou non autorisée pour ce vendeur",
			);
		}
		if (!shop.isActive) {
			throw new ApiError(403, "FORBIDDEN", "Votre boutique n'est pas encore active");
		}

		const product = await productService.createProduct(
			productData,
			sellerId,
			shop._id,
			req.files,
		);

		res.status(201).json({
			success: true,
			data: serializeProductMedia(product),
			message: "Produit créé avec succès",
		});
	} catch (error) {
		next(error);
	}
};

/**
 * Convertit les valeurs string "true"/"false" en booléens
 */
const parseBooleanFilter = (value, defaultValue = true) => {
	if (value === undefined || value === null) return defaultValue;
	if (typeof value === "boolean") return value;
	if (value === "true") return true;
	if (value === "false") return false;
	return defaultValue;
};

/**
 * Lister les produits avec filtres et pagination
 * GET /api/products
 * 
 * Pour les acheteurs, filtre automatiquement :
 * - Les produits de boutiques inactives (activeShopOnly=true par défaut)
 * - Les produits sans stock disponible (inStockOnly=true par défaut)
 */
export const list = async (req, res, next) => {
	try {
		const filters = {
			...req.query,
			// Conversion explicite des booléens pour les filtres d'acheteur
			inStockOnly: parseBooleanFilter(req.query.inStockOnly, true),
			activeShopOnly: parseBooleanFilter(req.query.activeShopOnly, true),
		};
		const { products, total, page, limit } = await productService.getProducts(filters);

		res.json({
			success: true,
			data: serializeProductsMedia(products),
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
 * Lister TOUS les produits pour l'admin (tous statuts)
 * GET /api/admin/products
 * 
 * L'admin peut voir tous les produits, y compris :
 * - Les produits de boutiques inactives
 * - Les produits sans stock
 */
export const listAll = async (req, res, next) => {
	try {
		const filters = {
			...req.query,
			status: req.query.status || "ALL", // Par défaut tous les statuts
			// L'admin peut voir tous les produits sans restrictions
			inStockOnly: parseBooleanFilter(req.query.inStockOnly, false),
			activeShopOnly: parseBooleanFilter(req.query.activeShopOnly, false),
		};
		const { products, total, page, limit } = await productService.getProducts(filters);

		res.json({
			success: true,
			data: products,
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
 * Lister les produits du vendeur connecté
 * GET /api/products/my-products
 * 
 * Le vendeur voit tous ses produits sans restriction de stock ou statut shop
 */
export const listMyProducts = async (req, res, next) => {
	try {
		const filters = {
			...req.query,
			sellerId: req.user._id,
			// Le vendeur voit tous ses produits sans filtrage de stock/shop
			inStockOnly: false,
			activeShopOnly: false,
		};
		const { products, total, page, limit } = await productService.getProducts(filters);

		res.json({
			success: true,
			data: serializeProductsMedia(products),
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
 * Récupérer un produit par son ID
 * GET /api/products/:id
 */
export const getOne = async (req, res, next) => {
	try {
		const { id } = req.params;
		const product = await productService.getProductByIdForPublicView(id);

		res.json({
			success: true,
			data: serializeProductMedia(product),
		});
	} catch (error) {
		next(error);
	}
};

/**
 * Mettre à jour un produit
 * PUT /api/products/:id
 */
export const update = async (req, res, next) => {
	try {
		const { id } = req.params;
		const updateData = req.body;
		const userId = req.user._id.toString();
		const userRole = req.user.role;

		const product = await productService.updateProduct(
			id,
			updateData,
			userId,
			userRole,
			req.files,
		);

		res.json({
			success: true,
			data: serializeProductMedia(product),
			message: "Produit mis à jour avec succès",
		});
	} catch (error) {
		next(error);
	}
};

/**
 * Supprimer un produit
 * DELETE /api/products/:id
 */
export const remove = async (req, res, next) => {
	try {
		const { id } = req.params;
		const userId = req.user._id.toString();
		const userRole = req.user.role;

		await productService.deleteProduct(id, userId, userRole);

		res.json({
			success: true,
			message: "Produit supprimé avec succès",
		});
	} catch (error) {
		next(error);
	}
};

/**
 * Valider ou rejeter un produit (ADMIN)
 * PUT /api/products/:id/validate
 */
export const moderate = async (req, res, next) => {
	try {
		const { id } = req.params;
		const { status, rejectionReason } = req.body;

		const product = await productService.moderateProduct(
			id,
			status,
			rejectionReason,
		);

		const action = status === "ACTIVE" ? "approuvé" : "rejeté";

		res.json({
			success: true,
			data: serializeProductMedia(product),
			message: `Produit ${action} avec succès`,
		});
	} catch (error) {
		next(error);
	}
};

/**
 * Ajouter des images à un produit existant
 * POST /api/products/:id/images
 */
export const addImages = async (req, res, next) => {
	try {
		const { id } = req.params;
		const userId = req.user._id.toString();
		const userRole = req.user.role;

		const product = await productService.addProductImages(id, userId, userRole, req.files);

		res.json({
			success: true,
			data: serializeProductMedia(product),
			message: "Images ajoutées avec succès",
		});
	} catch (error) {
		next(error);
	}
};

/**
 * Supprimer une image de produit par index
 * DELETE /api/products/:id/image/:index
 */
export const deleteImageByIndex = async (req, res, next) => {
	try {
		const { id, index } = req.params;
		const userId = req.user._id.toString();
		const userRole = req.user.role;

		const product = await productService.deleteProductImageByIndex(
			id,
			Number.parseInt(index, 10),
			userId,
			userRole,
		);

		res.json({
			success: true,
			data: serializeProductMedia(product),
			message: "Image supprimée avec succès",
		});
	} catch (error) {
		next(error);
	}
};
