import { Router } from "express";
import * as cartController from "../controllers/cart.controller.js";
import { auth, authorize } from "../middlewares/auth.middleware.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  addCartItemSchema,
  updateCartItemSchema,
  checkoutCartSchema,
} from "../validations/cart.validation.js";

const router = Router();

// Toutes les routes panier nécessitent une authentification BUYER
router.use(auth, authorize("BUYER"));

/**
 * @route   GET /api/cart
 * @desc    Récupérer le panier de l'utilisateur connecté
 * @access  Private (BUYER)
 */
router.get("/", cartController.getCart);

/**
 * @route   POST /api/cart/items
 * @desc    Ajouter un produit au panier
 * @access  Private (BUYER)
 */
router.post("/items", validate(addCartItemSchema), cartController.addItem);

/**
 * @route   PUT /api/cart/items/:productId
 * @desc    Mettre à jour la quantité d'un produit du panier
 * @access  Private (BUYER)
 */
router.put(
  "/items/:productId",
  validate(updateCartItemSchema),
  cartController.updateItem,
);

/**
 * @route   DELETE /api/cart/items/:productId
 * @desc    Retirer un produit du panier
 * @access  Private (BUYER)
 */
router.delete("/items/:productId", cartController.removeItem);

/**
 * @route   DELETE /api/cart
 * @desc    Vider le panier
 * @access  Private (BUYER)
 */
router.delete("/", cartController.clearCart);

/**
 * @route   GET /api/cart/orders
 * @desc    Récupérer les commandes de l'utilisateur
 * @access  Private (BUYER)
 */
router.get("/orders", cartController.getOrders);

/**
 * @route   GET /api/cart/orders/:orderId
 * @desc    Récupérer une commande par son ID
 * @access  Private (BUYER)
 */
router.get("/orders/:orderId", cartController.getOrderById);

/**
 * @route   POST /api/cart/checkout
 * @desc    Valider le panier (créer les ventes)
 * @access  Private (BUYER)
 */
router.post("/checkout", validate(checkoutCartSchema), cartController.checkout);

/**
 * @route   POST /api/cart/:cartId/confirm-delivery
 * @desc    Confirmer la livraison d'une commande
 * @access  Private (BUYER)
 */
router.post("/:cartId/confirm-delivery", cartController.confirmDelivery);

export default router;
