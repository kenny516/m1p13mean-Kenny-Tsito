import * as productService from "../services/product.service.js";
import Shop from "../models/Shop.js";
import { ApiError } from "../middlewares/error.middleware.js";

/**
 * Créer un nouveau produit
 * POST /api/products
 */
export const create = async (req, res, next) => {
	try {
		const productData = req.body;
		const sellerId = req.user._id;

		// Récupérer la boutique du vendeur (seulement _id et isActive)
		const shop = await Shop.findOne({ sellerId }).select("_id isActive").lean();
		if (!shop) {
			throw new ApiError(404, "NOT_FOUND", "Vous devez d'abord créer une boutique");
		}
		if (!shop.isActive) {
			throw new ApiError(403, "FORBIDDEN", "Votre boutique n'est pas encore active");
		}

		const product = await productService.createProduct(productData, sellerId, shop._id);

		res.status(201).json({
			success: true,
			data: product,
			message: "Produit créé avec succès",
		});
	} catch (error) {
		next(error);
	}
};

/**
 * Lister les produits avec filtres et pagination
 * GET /api/products
 */
export const list = async (req, res, next) => {
	try {
		const filters = req.query;
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
 */
export const listMyProducts = async (req, res, next) => {
	try {
		const filters = {
			...req.query,
			sellerId: req.user._id,
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
 * Récupérer un produit par son ID
 * GET /api/products/:id
 */
export const getOne = async (req, res, next) => {
	try {
		const { id } = req.params;
		const product = await productService.getProductById(id);

		res.json({
			success: true,
			data: product,
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

		const product = await productService.updateProduct(id, updateData, userId, userRole);

		res.json({
			success: true,
			data: product,
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
			data: product,
			message: `Produit ${action} avec succès`,
		});
	} catch (error) {
		next(error);
	}
};

/**
 * Mettre à jour le stock d'un produit
 * PUT /api/products/:id/stock
 */
export const updateStock = async (req, res, next) => {
	try {
		const { id } = req.params;
		const { quantity, operation } = req.body;

		const product = await productService.updateStock(id, quantity, operation);

		res.json({
			success: true,
			data: product,
			message: "Stock mis à jour avec succès",
		});
	} catch (error) {
		next(error);
	}
};

/**
 * Gérer la réservation de stock (SYSTEME)
 * PUT /api/products/:id/reserve
 */
export const reserveStock = async (req, res, next) => {
	try {
		const { id } = req.params;
		const { quantity, action } = req.body;

		const product = await productService.manageStockReservation(id, quantity, action);

		const messages = {
			reserve: "Stock réservé avec succès",
			release: "Réservation libérée avec succès",
			commit: "Achat finalisé avec succès",
		};

		res.json({
			success: true,
			data: product,
			message: messages[action],
		});
	} catch (error) {
		next(error);
	}
};
