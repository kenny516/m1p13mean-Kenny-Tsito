import * as cartService from "../services/cart.service.js";

/**
 * Récupérer le panier de l'utilisateur connecté
 * GET /api/cart
 */
export const getCart = async (req, res, next) => {
	try {
		const cart = await cartService.getCart(req.user._id);

		res.json({
			success: true,
			data: cart,
		});
	} catch (error) {
		next(error);
	}
};

/**
 * Ajouter un produit au panier
 * POST /api/cart/items
 */
export const addItem = async (req, res, next) => {
	try {
		const cart = await cartService.addItem(req.user._id, req.body);

		res.status(201).json({
			success: true,
			data: cart,
			message: "Produit ajouté au panier",
		});
	} catch (error) {
		next(error);
	}
};

/**
 * Mettre à jour la quantité d'un produit du panier
 * PUT /api/cart/items/:productId
 */
export const updateItem = async (req, res, next) => {
	try {
		const cart = await cartService.updateItem(
			req.user._id,
			req.params.productId,
			req.body.quantity,
		);

		res.json({
			success: true,
			data: cart,
			message: "Quantité mise à jour",
		});
	} catch (error) {
		next(error);
	}
};

/**
 * Retirer un produit du panier
 * DELETE /api/cart/items/:productId
 */
export const removeItem = async (req, res, next) => {
	try {
		const cart = await cartService.removeItem(req.user._id, req.params.productId);

		res.json({
			success: true,
			data: cart,
			message: "Produit retiré du panier",
		});
	} catch (error) {
		next(error);
	}
};

/**
 * Vider le panier
 * DELETE /api/cart
 */
export const clearCart = async (req, res, next) => {
	try {
		const cart = await cartService.clearCart(req.user._id);

		res.json({
			success: true,
			data: cart,
			message: "Panier vidé",
		});
	} catch (error) {
		next(error);
	}
};

/**
 * Valider le panier (créer les ventes)
 * POST /api/cart/checkout
 */
export const checkout = async (req, res, next) => {
	try {
		const result = await cartService.checkoutCart(req.user._id, req.body);

		res.status(201).json({
			success: true,
			data: result,
			message: "Commande créée avec succès",
		});
	} catch (error) {
		next(error);
	}
};
