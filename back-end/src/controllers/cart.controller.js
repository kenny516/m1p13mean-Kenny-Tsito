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
    const cart = await cartService.removeItem(req.user._id, {
      productId: req.params.productId,
      quantity: -1,
    });

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

/**
 * Confirmer la livraison d'une commande
 * POST /api/cart/:cartId/confirm-delivery
 */
export const confirmDelivery = async (req, res, next) => {
  try {
    const cart = await cartService.confirmDelivery(
      req.user._id,
      req.params.cartId,
    );

    res.json({
      success: true,
      data: cart,
      message: "Livraison confirmée",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Retourner une commande livrée
 * POST /api/cart/orders/:orderId/return
 */
export const returnOrder = async (req, res, next) => {
  try {
    const cart = await cartService.returnOrder(
      req.user._id,
      req.params.orderId,
      req.body,
    );

    res.json({
      success: true,
      data: cart,
      message: "Commande retournée avec succès",
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupérer les commandes de l'utilisateur
 * GET /api/cart/orders
 */
export const getOrders = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const result = await cartService.getOrders(
      req.user._id,
      { status },
      { page: parseInt(page), limit: parseInt(limit) },
    );

    res.json({
      success: true,
      data: result.orders,
      pagination: result.pagination,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Récupérer une commande par son ID
 * GET /api/cart/orders/:orderId
 */
export const getOrderById = async (req, res, next) => {
  try {
    const order = await cartService.getOrderById(
      req.user._id,
      req.params.orderId,
    );

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};
