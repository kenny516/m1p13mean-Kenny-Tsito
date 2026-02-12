import mongoose from "mongoose";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import { ApiError } from "../middlewares/error.middleware.js";
import {
	createStockMovement,
	createCartMovementLine,
} from "./stockMovementLine.service.js";
import { updateSaleStatus } from "./stockMovement.service.js";
import { debitWallet } from "./wallet.service.js";
import { requireActiveProduct } from "./product.service.js";

const CART_TTL_MINUTES = 30;

const getExpiresAt = () => new Date(Date.now() + CART_TTL_MINUTES * 60 * 1000);

const computeTotal = (items = []) => items.reduce((sum, item) => sum + (item.totalAmount || 0), 0);

const buildItemSnapshot = (product) => {
	const unitPrice = product.price || 0;
	return {
		title: product.title,
		description: product.description,
		images: product.images || [],
		unitPrice,
		availableStock: product.stock?.cache?.available || 0,
	};
};

const findActiveCartByUser = async (userId, session = null) => {
	const query = Cart.findOne({ userId, status: "CART" });
	if (session) query.session(session);
	return (await query.exec()) || null;
};

export const getCart = async (userId) => {
	const cart = await findActiveCartByUser(userId);
	if (!cart) {
		const created = await Cart.create({
			userId,
			items: [],
			status: "CART",
			totalAmount: 0,
			expiresAt: getExpiresAt(),
		});

		return created;
	}

	if (cart.expiresAt <= new Date()) {
		cart.status = "EXPIRED";
		await cart.save();
		throw new ApiError(400, "CART_EXPIRED", "Le panier a expiré");
	}

	return cart;
};

export const addItem = async (userId, { productId, quantity }, options = {}) => {
	const ownsSession = !options.session;
	const session = options.session || (await mongoose.startSession());
	if (ownsSession) session.startTransaction();

	try {
		const cart = options.cart || (await getCart(userId, session));
		const itemIndex =
			options.itemIndex !== undefined
				? options.itemIndex
				: cart.items.findIndex((cartItem) => cartItem.productId.toString() === productId);
		const product = options.product || (await requireActiveProduct(productId, null, session));

		await createCartMovementLine(
			{
				productId: product._id.toString(),
				shopId: product.shopId.toString(),
				movementType: "RESERVATION",
				quantity,
				unitPrice: product.price,
				cartId: cart._id,
				date: new Date(),
			},
			userId,
			{ session, product, cache: true },
		);

		const snapshot = buildItemSnapshot(product);
		if (itemIndex !== -1) {
			cart.items[itemIndex].quantity += quantity;
			cart.items[itemIndex].shopId = product.shopId;
			cart.items[itemIndex].productSnapshot = snapshot;
			cart.items[itemIndex].totalAmount = product.price * cart.items[itemIndex].quantity;
		} else {
			cart.items.push({
				productId: product._id,
				shopId: product.shopId,
				quantity,
				productSnapshot: snapshot,
				totalAmount: product.price * quantity,
			});
		}

		cart.totalAmount = computeTotal(cart.items);
		cart.expiresAt = getExpiresAt();

		const updatedCart = await cart.save({ session });
		if (ownsSession) await session.commitTransaction();
		return updatedCart;
	} catch (error) {
		if (ownsSession) await session.abortTransaction();
		throw error;
	} finally {
		if (ownsSession) await session.endSession();
	}
};

export const updateItem = async (userId, productId, quantity) => {
	const session = await mongoose.startSession();
	const ownsSession = true;
	session.startTransaction();

	try {
		let newCart = null;

		const cart = await getCart(userId, session);
		const itemIndex = cart.items.findIndex(
			(cartItem) => cartItem.productId.toString() === productId,
		);
		const product = await requireActiveProduct(productId, null, session);

		// Calculate delta: (Target Quantity) - (Current Quantity)
		// If item doesn't exist, delta is the full target quantity
		const currentQty = itemIndex !== -1 ? cart.items[itemIndex].quantity : 0;
		const delta = quantity - currentQty;

		// Determination logic
		const isAdd = delta > 0;
		const isRemove = delta < 0;

		if (isAdd) {
			// Adding: pass the positive delta
			newCart = await addItem(
				userId,
				{ productId, quantity: delta },
				{ cart, itemIndex, product, session },
			);
		} else if (isRemove) {
			newCart = await removeItem(
				userId,
				{ productId, quantity: Math.abs(delta) },
				{ cart, itemIndex, product, session },
			);
		} else {
			if (itemIndex === -1) {
				throw new ApiError(404, "ITEM_NOT_FOUND", "L'article n'est pas dans le panier");
			}
			newCart = cart;
		}

		if (ownsSession) await session.commitTransaction();
		return newCart;
	} catch (error) {
		if (ownsSession) await session.abortTransaction();
		throw error;
	} finally {
		if (ownsSession) await session.endSession();
	}
};

export const removeItem = async (userId, { productId, quantity }, options = {}) => {
	const ownsSession = !options.session;
	const session = options.session || (await mongoose.startSession());
	if (ownsSession) session.startTransaction();

	try {
		const cart = options.cart || (await findActiveCartByUser(userId, session));
		if (!cart) {
			throw new ApiError(404, "CART_NOT_FOUND", "Panier non trouvé");
		}
		const itemIndex =
			options.itemIndex !== undefined
				? options.itemIndex
				: cart.items.findIndex((cartItem) => cartItem.productId.toString() === productId);

		if (itemIndex === -1) {
			throw new ApiError(404, "ITEM_NOT_FOUND", "L'article n'est pas dans le panier");
		}

		const effectiveQuantity = quantity === -1 ? cart.items[itemIndex].quantity : quantity;
		const product = options.product || (await requireActiveProduct(productId, null, session));

		await createCartMovementLine(
			{
				productId: product._id.toString(),
				shopId: product.shopId.toString(),
				movementType: "RESERVATION_CANCEL",
				quantity: effectiveQuantity,
				unitPrice: product.price,
				cartId: cart._id,
				date: new Date(),
			},
			userId,
			{ session, product, cache: true },
		);

		const snapshot = buildItemSnapshot(product);
		if (cart.items[itemIndex].quantity > effectiveQuantity) {
			cart.items[itemIndex].quantity -= effectiveQuantity;
			cart.items[itemIndex].shopId = product.shopId;
			cart.items[itemIndex].productSnapshot = snapshot;
			cart.items[itemIndex].totalAmount = product.price * cart.items[itemIndex].quantity;
		} else {
			cart.items.splice(itemIndex, 1);
		}

		cart.totalAmount = computeTotal(cart.items);
		cart.expiresAt = getExpiresAt();

		const updatedCart = await cart.save({ session });
		if (ownsSession) await session.commitTransaction();

		return updatedCart;
	} catch (error) {
		if (ownsSession) await session.abortTransaction();
		throw error;
	} finally {
		if (ownsSession) await session.endSession();
	}
};

export const clearCart = async (userId) => {
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		const cart = await findActiveCartByUser(userId, session);
		if (!cart) {
			const [emptyCart] = await Cart.create(
				[
					{
						userId,
						items: [],
						status: "CART",
						totalAmount: 0,
						expiresAt: getExpiresAt(),
					},
				],
				{ session },
			);
			await session.commitTransaction();
			return emptyCart;
		}

		for (const item of cart.items) {
			const product = await Product.findById(item.productId).session(session);
			if (!product) {
				throw new ApiError(404, "NOT_FOUND", "Produit non trouvé");
			}
			await createCartMovementLine(
				{
					productId: product._id.toString(),
					shopId: product.shopId.toString(),
					movementType: "RESERVATION_CANCEL",
					quantity: item.quantity,
					unitPrice: product.price,
					cartId: cart._id,
					date: new Date(),
				},
				userId,
				{ session, product, cache: true },
			);
		}

		cart.items = [];
		cart.totalAmount = 0;
		cart.expiresAt = getExpiresAt();

		const updatedCart = await cart.save({ session });
		await session.commitTransaction();

		return updatedCart;
	} catch (error) {
		await session.abortTransaction();
		throw error;
	} finally {
		await session.endSession();
	}
};

export const checkoutCart = async (userId, payload) => {
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		const cart = await findActiveCartByUser(userId, session);
		if (!cart || cart.items.length === 0) {
			throw new ApiError(400, "CART_EMPTY", "Le panier est vide");
		}

		const computedTotal = computeTotal(cart.items);
		if (cart.totalAmount !== computedTotal) {
			cart.totalAmount = computedTotal;
		}

		let paymentTransaction = null;
		if (payload.paymentMethod === "WALLET") {
			const result = await debitWallet(
				userId,
				cart.totalAmount,
				"WALLET",
				`Achat via panier ${cart._id}`,
			);
			paymentTransaction = result.transaction;
		}

		const saleItems = [];
		for (const item of cart.items) {
			const product = await requireActiveProduct(item.productId, null, session);
			saleItems.push({
				productId: item.productId.toString(),
				shopId: item.shopId.toString(),
				quantity: item.quantity,
				cartId: cart._id,
				unitPrice: item.productSnapshot?.unitPrice || product.price,
				product,
			});
		}

		const { header, lines } = await createStockMovement(
			{
				movementType: "SALE",
				sale: {
					cartId: cart._id,
					paymentTransaction: paymentTransaction?._id,
					deliveryAddress: payload.deliveryAddress,
					paymentMethod: payload.paymentMethod,
				},
				items: saleItems,
			},
			userId,
			{ session, cache: true },
		);

		cart.status = "ORDER";

		cart.order.reference = header.reference;
		cart.order.saleId = header._id.toString();

		cart.order.paymentMethod = payload.paymentMethod;
		cart.order.paymentTransaction = paymentTransaction?._id.toString();

		cart.expiresAt = new Date();
		await cart.save({ session });

		const [nextCart] = await Cart.create(
			[
				{
					userId,
					items: [],
					status: "CART",
					totalAmount: 0,
					expiresAt: getExpiresAt(),
				},
			],
			{ session },
		);

		await session.commitTransaction();

		return {
			cart: nextCart,
			order: cart,
			paymentTransaction,
		};
	} catch (error) {
		await session.abortTransaction();
		throw error;
	} finally {
		await session.endSession();
	}
};

export const confirmDelivery = async (userId, cartId) => {
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		const cart = await Cart.findOne({ _id: cartId, userId }).session(session);
		if (!cart) {
			throw new ApiError(404, "NOT_FOUND", "Panier non trouvé");
		}
		if (cart.status !== "ORDER") {
			throw new ApiError(400, "INVALID_STATUS", "Le panier n'est pas en cours de commande");
		}

		await updateSaleStatus(cart.order.saleId, { status: "DELIVERED" }, userId);

		cart.status = "DELIVERED";
		await cart.save({ session });

		await session.commitTransaction();
		return cart;
	} catch (error) {
		await session.abortTransaction();
		throw error;
	} finally {
		await session.endSession();
	}
};
