import mongoose from "mongoose";
import Product from "../models/Product.js";
import { ApiError } from "../middlewares/error.middleware.js";
import { parseSortOption } from "../utils/request.util.js";
import {
  uploadProductImageAtIndex,
  deleteByFileId,
} from "./imagekit.service.js";
import {
  incrementProductViews,
  recomputeShopProductStatusCounters,
} from "./stats.service.js";

const uploadAndAppendProductImages = async (product, files = []) => {
  if (!Array.isArray(files) || files.length === 0) return;

  const resolvedShopId =
    typeof product.shopId === "string"
      ? product.shopId
      : product.shopId?._id?.toString?.() || product.shopId?.toString?.();

  if (!resolvedShopId || resolvedShopId === "[object Object]") {
    throw new ApiError(
      400,
      "INVALID_SHOP",
      "Identifiant de boutique invalide pour l'upload d'image produit",
    );
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

const resolveShopIdFromRef = (shopRef) => {
  if (!shopRef) return null;

  if (typeof shopRef === "string") {
    return shopRef;
  }

  if (shopRef?._id) {
    return shopRef._id.toString();
  }

  if (typeof shopRef.toString === "function") {
    const value = shopRef.toString();
    if (value && value !== "[object Object]") return value;
  }

  return null;
};

/**
 * Vérifie que le produit existe, est ACTIVE, et appartient au shop donné.
 * Utilisé par d'autres services (stockMovement, etc.)
 */
export const requireActiveProduct = async (
  productId,
  shopId = null,
  session = null,
) => {
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
export const createProduct = async (
  productData,
  sellerId,
  shopId,
  imageFiles = [],
) => {
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

  const resolvedShopId = resolveShopIdFromRef(shopId);
  if (!resolvedShopId) {
    throw new ApiError(
      400,
      "INVALID_SHOP",
      "Identifiant de boutique invalide pour les statistiques produit",
    );
  }

  await recomputeShopProductStatusCounters(resolvedShopId);

  return product;
};

/**
 * Récupère une liste de produits avec filtres et pagination
 * Filtre automatiquement les produits dont le shop n'est pas actif
 * et les produits sans stock disponible (sauf si inStockOnly = false)
 *
 * @param {Object} filters - Filtres de recherche
 * @param {number} [filters.page=1] - Numéro de page
 * @param {number} [filters.limit=10] - Nombre de résultats par page
 * @param {string} [filters.search] - Recherche full-text
 * @param {string} [filters.category] - Filtre par catégorie
 * @param {string|string[]} [filters.tags] - Filtre par tags
 * @param {number} [filters.minPrice] - Prix minimum
 * @param {number} [filters.maxPrice] - Prix maximum
 * @param {string} [filters.shopId] - ID de la boutique
 * @param {string} [filters.sort] - Tri (ex: "price_asc", "price_desc", "newest")
 * @param {string} [filters.status="ACTIVE"] - Statut du produit
 * @param {string} [filters.sellerId] - ID du vendeur
 * @param {boolean} [filters.inStockOnly=true] - Filtrer les produits sans stock
 * @param {boolean} [filters.activeShopOnly=true] - Filtrer les produits de shops inactifs
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
    inStockOnly = true,
    activeShopOnly = true,
  } = filters;

  // Construire le match initial
  const matchStage = {};

  // Filtre par statut (sauf si un vendeur regarde ses produits ou admin)
  if (status && status !== "ALL") {
    matchStage.status = status;
  }

  // Filtre vendeur - désactive les filtres par défaut pour voir ses propres produits
  if (sellerId) {
    matchStage.sellerId = new mongoose.Types.ObjectId(sellerId);
    // Si c'est le vendeur, on peut ignorer le status par défaut si non spécifié explicitement
    if (!filters.status) delete matchStage.status;
  }

  // Filtre boutique
  if (shopId) {
    matchStage.shopId = new mongoose.Types.ObjectId(shopId);
  }

  // Recherche full-text (utilise l'index text)
  if (search) {
    matchStage.$text = { $search: search };
  }

  // Filtre catégorie
  if (category) {
    matchStage.category = category;
  }

  // Filtre tags (un ou plusieurs)
  if (tags) {
    const tagsList = Array.isArray(tags) ? tags : [tags];
    matchStage.tags = { $in: tagsList };
  }

  // Filtre prix
  if (minPrice !== undefined || maxPrice !== undefined) {
    matchStage.price = {};
    if (minPrice !== undefined) matchStage.price.$gte = Number(minPrice);
    if (maxPrice !== undefined) matchStage.price.$lte = Number(maxPrice);
  }

  // Filtre stock disponible (uniquement pour les acheteurs, pas pour les vendeurs)
  // Désactivé si sellerId est fourni (vendeur qui regarde ses produits)
  if (inStockOnly && !sellerId) {
    matchStage["stock.cache.total"] = { $gt: 0 };
  }

  // Tri
  const sortOptions = parseSortOption(sort);

  // Pagination
  const skip = (Number(page) - 1) * Number(limit);
  const limitNum = Number(limit);

  // Si on doit filtrer par shop actif et qu'aucun sellerId n'est fourni
  // On utilise une agrégation avec $lookup
  const needsShopFilter = activeShopOnly && !sellerId;

  if (needsShopFilter) {
    // Pipeline d'agrégation avec lookup du shop
    const pipeline = [
      // 1. Match initial sur les produits
      { $match: matchStage },

      // 2. Lookup du shop pour vérifier isActive
      {
        $lookup: {
          from: "shops",
          localField: "shopId",
          foreignField: "_id",
          as: "shopData",
        },
      },

      // 3. Unwind le shop (un produit = un shop)
      { $unwind: "$shopData" },

      // 4. Filtrer par shop actif
      { $match: { "shopData.isActive": true } },

      // 5. Ajouter le nom du shop comme champ pour la compatibilité
      {
        $addFields: {
          shopId: {
            _id: "$shopData._id",
            name: "$shopData.name",
          },
        },
      },

      // 6. Supprimer le champ temporaire shopData
      { $project: { shopData: 0 } },
    ];

    // Pipeline pour le comptage total
    const countPipeline = [...pipeline, { $count: "total" }];

    // Pipeline pour les résultats paginés
    const resultPipeline = [
      ...pipeline,
      { $sort: sortOptions },
      { $skip: skip },
      { $limit: limitNum },
    ];

    // Exécution parallèle
    const [productsResult, countResult] = await Promise.all([
      Product.aggregate(resultPipeline),
      Product.aggregate(countPipeline),
    ]);

    const total = countResult[0]?.total || 0;

    return {
      products: productsResult,
      total,
      page: Number(page),
      limit: limitNum,
    };
  }

  // Cas simple : pas besoin de filtrer par shop actif (vendeur ou admin)
  const [products, total] = await Promise.all([
    Product.find(matchStage)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum)
      .populate("shopId", "name"),
    Product.countDocuments(matchStage),
  ]);

  return {
    products,
    total,
    page: Number(page),
    limit: limitNum,
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

export const getProductByIdForPublicView = async (id) => {
  const product = await getProductById(id);
  await incrementProductViews(product._id);
  return product;
};

/**
 * Met à jour un produit
 * Si le produit était ACTIVE et qu'un vendeur le modifie, il repasse en PENDING
 */
export const updateProduct = async (
  id,
  updateData,
  userId,
  userRole,
  imageFiles = [],
) => {
  const product = await getProductById(id);
  const previousStatus = product.status;
  const previousShopId = resolveShopIdFromRef(product.shopId);

  // Vérification des droits (Propriétaire ou Admin)
  if (userRole !== "ADMIN" && product.sellerId.toString() !== userId) {
    throw new ApiError(
      403,
      "FORBIDDEN",
      "Vous n'êtes pas autorisé à modifier ce produit",
    );
  }

  // Gestion sécurisée des mises à jour imbriquées
  if (updateData.stock?.alert) {
    product.stock.alert = {
      ...product.stock.alert,
      ...updateData.stock.alert,
    };
    delete updateData.stock;
  }

  const hasStatusUpdate = typeof updateData.status === "string";
  const isStatusChangeOnly = Object.keys(updateData).length === 1 && hasStatusUpdate;

  if (userRole !== "ADMIN" && hasStatusUpdate) {
    const isSellerStatusToggleAllowed =
      (product.status === "ACTIVE" && updateData.status === "ARCHIVED") ||
      (product.status === "ARCHIVED" && updateData.status === "ACTIVE");

    if (!isSellerStatusToggleAllowed) {
      throw new ApiError(
        400,
        "INVALID_STATUS_TRANSITION",
        "Un vendeur peut uniquement basculer le statut entre ACTIVE et ARCHIVED",
      );
    }
  }

  if (hasStatusUpdate) {
    product.status = updateData.status;
    delete updateData.status;
  }

  // Mise à jour des champs directs
  Object.assign(product, updateData);

  await uploadAndAppendProductImages(product, imageFiles);

  await product.save();

  const currentShopId = resolveShopIdFromRef(product.shopId);
  if (previousStatus !== product.status || previousShopId !== currentShopId) {
    if (previousShopId) {
      await recomputeShopProductStatusCounters(previousShopId);
    }
    if (currentShopId && previousShopId !== currentShopId) {
      await recomputeShopProductStatusCounters(currentShopId);
    }
  }

  return product;
};

export const addProductImages = async (
  id,
  userId,
  userRole,
  imageFiles = [],
) => {
  if (!Array.isArray(imageFiles) || imageFiles.length === 0) {
    throw new ApiError(400, "INVALID_FILE", "Aucune image fournie");
  }

  const product = await getProductById(id);

  if (userRole !== "ADMIN" && product.sellerId.toString() !== userId) {
    throw new ApiError(
      403,
      "FORBIDDEN",
      "Vous n'êtes pas autorisé à modifier ce produit",
    );
  }

  await uploadAndAppendProductImages(product, imageFiles);
  await product.save();

  return product;
};

export const deleteProductImageByIndex = async (
  id,
  imageIndex,
  userId,
  userRole,
) => {
  const product = await getProductById(id);

  if (userRole !== "ADMIN" && product.sellerId.toString() !== userId) {
    throw new ApiError(
      403,
      "FORBIDDEN",
      "Vous n'êtes pas autorisé à modifier ce produit",
    );
  }

  if (
    !Number.isInteger(imageIndex) ||
    imageIndex < 0 ||
    imageIndex >= product.images.length
  ) {
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
  const shopId = resolveShopIdFromRef(product.shopId);

  if (userRole !== "ADMIN" && product.sellerId.toString() !== userId) {
    throw new ApiError(
      403,
      "FORBIDDEN",
      "Vous n'êtes pas autorisé à supprimer ce produit",
    );
  }

  await product.deleteOne();
  if (shopId) {
    await recomputeShopProductStatusCounters(shopId);
  }
  return product;
};

/**
 * Modération Admin: Modifier le statut d'un produit
 * L'admin peut changer le statut de n'importe quel produit (sauf DRAFT)
 */
export const moderateProduct = async (id, status, rejectionReason) => {
  const product = await getProductById(id);
  const previousStatus = product.status;
  const shopId = resolveShopIdFromRef(product.shopId);

  // Empêcher la modification des produits en brouillon
  if (product.status === "DRAFT") {
    throw new ApiError(
      400,
      "INVALID_STATUS_TRANSITION",
      "Impossible de modérer un produit en brouillon. Le vendeur doit d'abord le soumettre.",
    );
  }

  product.status = status;
  if (status === "REJECTED") {
    product.rejectionReason = rejectionReason;
  } else {
    product.rejectionReason = undefined;
  }

  await product.save();

  if (previousStatus !== product.status && shopId) {
    await recomputeShopProductStatusCounters(shopId);
  }

  return product;
};
