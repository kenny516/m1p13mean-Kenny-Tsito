import mongoose from "mongoose";
import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import { ApiError } from "../middlewares/error.middleware.js";
import { createMovement } from "./stockMovement.service.js";
import { debitWallet } from "./wallet.service.js";

const CART_TTL_MINUTES = 30;

const getExpiresAt = () => new Date(Date.now() + CART_TTL_MINUTES * 60 * 1000);

const computeTotal = (items = []) =>
	items.reduce((sum, item) => sum + item.priceSnapshot * item.quantity, 0);

const populateCart = (query) =>
	query
		.populate("items.productId", "title price images status stock.cache.available")
		.populate("items.shopId", "name");

const findActiveCartByUser = (userId, session = null) => {
	const query = Cart.findOne({ userId, expiresAt: { $gt: new Date() } });
	if (session) query.session(session);
	return query;
};

export const getCart = async (userId) => {
	let cart = null;
	try {
		cart = await populateCart(findActiveCartByUser(userId)).exec();
	} catch {
		cart = await findActiveCartByUser(userId).exec();
	}

	if (!cart) {
		const created = await Cart.create({
			userId,
			items: [],
			total: 0,
			expiresAt: getExpiresAt(),
		});
		try {
			cart = await populateCart(Cart.findById(created._id)).exec();
		} catch {
			cart = await Cart.findById(created._id).exec();
		}
	}

	return cart;
};

export const addItem = async (userId, { productId, quantity }) => {
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		const product = await Product.findById(productId).session(session);
		if (!product) {
			throw new ApiError(404, "NOT_FOUND", "Produit non trouvé");
		}
		if (product.status !== "ACTIVE") {
			throw new ApiError(
				400,
				"PRODUCT_NOT_ACTIVE",
				"Le produit doit être au statut ACTIVE",
			);
		}

		let cart = await findActiveCartByUser(userId, session);
		if (!cart) {
			cart = new Cart({
				userId,
				items: [],
				total: 0,
				expiresAt: getExpiresAt(),
			});
		}

		const existing = cart.items.find(
			(item) => item.productId.toString() === productId,
		);

		cart.expiresAt = getExpiresAt();
		const groupId = `GRP${cart._id}`;
		await createMovement(
			{
				productId: product._id.toString(),
				shopId: product.shopId.toString(),
				movementType: "RESERVATION",
				quantity,
				unitPrice: product.price,
				groupId,
				reservation: {
					cartId: cart._id,
					expiresAt: cart.expiresAt,
				},
			},
			userId,
			{ session, product, useCache: true },
		);

		if (existing) {
			existing.quantity += quantity;
			existing.priceSnapshot = product.price;
			existing.shopId = product.shopId;
		} else {
			cart.items.push({
				productId: product._id,
				shopId: product.shopId,
				priceSnapshot: product.price,
				quantity,
			});
		}
		cart.total = computeTotal(cart.items);

		await cart.save({ session });

		await session.commitTransaction();

		return await populateCart(Cart.findById(cart._id)).exec();
	} catch (error) {
		await session.abortTransaction();
		throw error;
	} finally {
		session.endSession();
	}
};

export const updateItem = async (userId, productId, quantity) => {
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		const cart = await findActiveCartByUser(userId, session);
		if (!cart) {
			throw new ApiError(404, "NOT_FOUND", "Panier non trouvé");
		}

		const item = cart.items.find(
			(cartItem) => cartItem.productId.toString() === productId,
		);
		if (!item) {
			throw new ApiError(404, "NOT_FOUND", "Produit non trouvé dans le panier");
		}

		const product = await Product.findById(productId).session(session);
		if (!product) {
			throw new ApiError(404, "NOT_FOUND", "Produit non trouvé");
		}
		if (product.status !== "ACTIVE") {
			throw new ApiError(
				400,
				"PRODUCT_NOT_ACTIVE",
				"Le produit doit être au statut ACTIVE",
			);
		}

		const delta = quantity - item.quantity;
		cart.expiresAt = getExpiresAt();
		if (delta !== 0) {
			const movementType = delta > 0 ? "RESERVATION" : "RESERVATION_CANCEL";
			const movementQuantity = Math.abs(delta);
			const groupId = `GRP${cart._id}`;
			await createMovement(
				{
					productId: product._id.toString(),
					shopId: product.shopId.toString(),
					movementType,
					quantity: movementQuantity,
					unitPrice: product.price,
					groupId,
					reservation: {
						cartId: cart._id,
						expiresAt: cart.expiresAt,
					},
				},
				userId,
				{ session, product, useCache: true },
			);
		}

		item.quantity = quantity;
		item.priceSnapshot = product.price;
		item.shopId = product.shopId;
		cart.total = computeTotal(cart.items);

		await cart.save({ session });
		await session.commitTransaction();

		return await populateCart(Cart.findById(cart._id)).exec();
	} catch (error) {
		await session.abortTransaction();
		throw error;
	} finally {
		session.endSession();
	}
};

export const removeItem = async (userId, productId) => {
	const session = await mongoose.startSession();
	session.startTransaction();

	try {
		const cart = await findActiveCartByUser(userId, session);
		if (!cart) {
			throw new ApiError(404, "NOT_FOUND", "Panier non trouvé");
		}

		const itemIndex = cart.items.findIndex(
			(cartItem) => cartItem.productId.toString() === productId,
		);
		if (itemIndex === -1) {
			throw new ApiError(404, "NOT_FOUND", "Produit non trouvé dans le panier");
		}

		const product = await Product.findById(productId).session(session);
		if (!product) {
			throw new ApiError(404, "NOT_FOUND", "Produit non trouvé");
		}

		cart.expiresAt = getExpiresAt();
		const [removed] = cart.items.splice(itemIndex, 1);
		const groupId = `GRP${cart._id}`;
		await createMovement(
			{
				productId: product._id.toString(),
				shopId: product.shopId.toString(),
				movementType: "RESERVATION_CANCEL",
				quantity: removed.quantity,
				unitPrice: product.price,
				groupId,
				reservation: {
					cartId: cart._id,
					expiresAt: cart.expiresAt,
				},
			},
			userId,
			{ session, product, useCache: true },
		);
		cart.total = computeTotal(cart.items);

		await cart.save({ session });
		await session.commitTransaction();

		return await populateCart(Cart.findById(cart._id)).exec();
	} catch (error) {
		await session.abortTransaction();
		throw error;
	} finally {
		session.endSession();
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
						total: 0,
						expiresAt: getExpiresAt(),
					},
				],
				{ session },
			);
			await session.commitTransaction();
			return await populateCart(Cart.findById(emptyCart._id)).exec();
		}

		cart.expiresAt = getExpiresAt();
		for (const item of cart.items) {
			const product = await Product.findById(item.productId).session(session);
			if (!product) {
				throw new ApiError(404, "NOT_FOUND", "Produit non trouvé");
			}
			await createMovement(
				{
					productId: product._id.toString(),
					shopId: product.shopId.toString(),
					movementType: "RESERVATION_CANCEL",
					quantity: item.quantity,
					unitPrice: product.price,
					groupId: `GRP${cart._id}`,
					reservation: {
						cartId: cart._id,
						expiresAt: cart.expiresAt,
					},
				},
				userId,
				{ session, product, useCache: true },
			);
		}

		cart.items = [];
		cart.total = 0;
		await cart.save({ session });
		await session.commitTransaction();

		return await populateCart(Cart.findById(cart._id)).exec();
	} catch (error) {
		await session.abortTransaction();
		throw error;
	} finally {
		session.endSession();
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

		const groupId = `GRP${cart._id}`;
		const computedTotal = computeTotal(cart.items);
		if (cart.total !== computedTotal) {
			cart.total = computedTotal;
		}

		let walletTransaction = null;
		if (payload.paymentMethod === "WALLET") {
			const result = await debitWallet(
				userId,
				cart.total,
				"WALLET",
				`Achat via panier ${cart._id}`,
			);
			walletTransaction = result.transaction;
		}

		const movements = [];
		for (const item of cart.items) {
			const product = await Product.findById(item.productId).session(session);
			if (!product) {
				throw new ApiError(404, "NOT_FOUND", "Produit non trouvé");
			}
			if (product.status !== "ACTIVE") {
				throw new ApiError(
					400,
					"PRODUCT_NOT_ACTIVE",
					"Le produit doit être au statut ACTIVE",
				);
			}

			const movement = await createMovement(
				{
					productId: product._id.toString(),
					shopId: product.shopId.toString(),
					movementType: "SALE",
					quantity: item.quantity,
					unitPrice: item.priceSnapshot,
					groupId,
					sale: {
						buyerId: userId,
						productSnapshot: {
							title: product.title,
							sku: product.sku,
							price: item.priceSnapshot,
							originalPrice: product.originalPrice || null,
							images: product.images || [],
						},
						deliveryAddress: payload.deliveryAddress,
						paymentMethod: payload.paymentMethod,
					},
				},
				userId,
				{ session, product, useCache: true },
			);

			movements.push(movement);
		}

		cart.expiresAt = new Date();
		await cart.save({ session });

		const [nextCart] = await Cart.create(
			[
				{
					userId,
					items: [],
					total: 0,
					expiresAt: getExpiresAt(),
				},
			],
			{ session },
		);

		await session.commitTransaction();

		return {
			cart: await populateCart(Cart.findById(nextCart._id)).exec(),
			movements,
			walletTransaction,
		};
	} catch (error) {
		await session.abortTransaction();
		throw error;
	} finally {
		session.endSession();
	}
};
