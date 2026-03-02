import mongoose from "mongoose";
import { User, Wallet } from "../models/index.js";
import { ApiError } from "../middlewares/error.middleware.js";
import { hashPassword, formatUserResponse } from "../utils/auth.utils.js";
import { createOptionalSession } from "../utils/transaction.util.js";
import * as settingsService from "./settings.service.js";

/**
 * Service de gestion des utilisateurs (Admin)
 * CRUD utilisateurs, statistiques, activation/validation
 */

/**
 * Récupère la liste des utilisateurs avec pagination et filtres
 */
export const getUsers = async (filters = {}, pagination = {}) => {
  const { search, role, isActive, isValidated } = filters;
  const page = pagination.page || 1;
  const limit = pagination.limit || 10;
  const skip = (page - 1) * limit;

  // Construire la query
  const query = {};

  if (search) {
    query.$or = [
      { email: { $regex: search, $options: "i" } },
      { "profile.firstName": { $regex: search, $options: "i" } },
      { "profile.lastName": { $regex: search, $options: "i" } },
    ];
  }

  if (role) query.role = role;
  if (isActive !== undefined) query.isActive = isActive;
  if (isValidated !== undefined) query.isValidated = isValidated;

  const [users, total] = await Promise.all([
    User.find(query)
      .populate("walletId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(query),
  ]);

  return {
    users: users.map(formatUserResponse),
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
      hasNext: page < Math.ceil(total / limit),
      hasPrev: page > 1,
    },
  };
};

/**
 * Récupère un utilisateur par son ID
 */
export const getUserById = async (userId) => {
  const user = await User.findById(userId).populate("walletId");

  if (!user) {
    throw new ApiError(404, "NOT_FOUND", "Utilisateur non trouvé");
  }

  return formatUserResponse(user);
};

/**
 * Crée un nouvel utilisateur (par l'admin)
 */
export const createUser = async (userData) => {
  const txn = await createOptionalSession();

  try {
    // Vérifier si l'email existe déjà
    const userQuery = User.findOne({ email: userData.email });
    if (txn.session) userQuery.session(txn.session);
    const existingUser = await userQuery;
    if (existingUser) {
      throw new ApiError(409, "CONFLICT", "Cet email est déjà utilisé");
    }

    // Hasher le mot de passe et créer l'utilisateur
    const passwordHash = await hashPassword(userData.password);
    const createUserOptions = txn.session ? { session: txn.session } : {};
    const [user] = await User.create(
      [
        {
          email: userData.email,
          passwordHash,
          role: userData.role,
          profile: userData.profile,
          isValidated: userData.isValidated ?? userData.role === "BUYER",
          isActive: userData.isActive ?? true,
        },
      ],
      createUserOptions,
    );

    const createWalletOptions = txn.session ? { session: txn.session } : {};
    const isAdmin = user.role === "ADMIN";

    if (isAdmin) {
      let adminGlobalWalletId = await settingsService.getAdminGlobalWalletId(
        txn.session,
      );

      if (!adminGlobalWalletId) {
        const [wallet] = await Wallet.create(
          [{ ownerId: user._id, ownerModel: "User" }],
          createWalletOptions,
        );
        adminGlobalWalletId = wallet._id;
        await settingsService.setAdminGlobalWalletId(
          adminGlobalWalletId,
          txn.session,
        );
      }

      user.walletId = adminGlobalWalletId;
    } else {
      const [wallet] = await Wallet.create(
        [{ ownerId: user._id, ownerModel: "User" }],
        createWalletOptions,
      );

      user.walletId = wallet._id;
    }

    const saveOptions = txn.session ? { session: txn.session } : {};
    await user.save(saveOptions);

    if (txn.ownsSession) await txn.commit();
    return formatUserResponse(user);
  } catch (error) {
    if (txn.ownsSession) await txn.abort();
    throw error;
  } finally {
    if (txn.ownsSession) await txn.end();
  }
};

/**
 * Met à jour un utilisateur
 */
export const updateUser = async (userId, updateData) => {
  const existingUser = await User.findById(userId);
  if (!existingUser) {
    throw new ApiError(404, "NOT_FOUND", "Utilisateur non trouvé");
  }

  // Si l'email change, vérifier qu'il n'est pas déjà utilisé
  if (updateData.email && updateData.email !== existingUser.email) {
    const emailExists = await User.findOne({
      email: updateData.email,
      _id: { $ne: userId },
    });
    if (emailExists) {
      throw new ApiError(409, "CONFLICT", "Cet email est déjà utilisé");
    }
  }

  // Construire les données de mise à jour
  const updateFields = {};
  if (updateData.email) updateFields.email = updateData.email;
  if (updateData.role) updateFields.role = updateData.role;
  if (updateData.isValidated !== undefined)
    updateFields.isValidated = updateData.isValidated;
  if (updateData.isActive !== undefined)
    updateFields.isActive = updateData.isActive;

  if (updateData.profile) {
    if (updateData.profile.firstName !== undefined)
      updateFields["profile.firstName"] = updateData.profile.firstName;
    if (updateData.profile.lastName !== undefined)
      updateFields["profile.lastName"] = updateData.profile.lastName;
    if (updateData.profile.phone !== undefined)
      updateFields["profile.phone"] = updateData.profile.phone;
      if (updateData.profile.avatar !== undefined) {
        delete updateData.profile.avatar;
      }
    if (updateData.profile.address) {
      if (updateData.profile.address.street !== undefined)
        updateFields["profile.address.street"] =
          updateData.profile.address.street;
      if (updateData.profile.address.city !== undefined)
        updateFields["profile.address.city"] = updateData.profile.address.city;
      if (updateData.profile.address.postalCode !== undefined)
        updateFields["profile.address.postalCode"] =
          updateData.profile.address.postalCode;
      if (updateData.profile.address.country !== undefined)
        updateFields["profile.address.country"] =
          updateData.profile.address.country;
    }
  }

  const user = await User.findByIdAndUpdate(userId, updateFields, {
    new: true,
  }).populate("walletId");
  return formatUserResponse(user);
};

/**
 * Réinitialise le mot de passe d'un utilisateur (par l'admin)
 */
export const resetUserPassword = async (userId, newPassword) => {
  const user = await User.findById(userId).select("+passwordHash");

  if (!user) {
    throw new ApiError(404, "NOT_FOUND", "Utilisateur non trouvé");
  }

  user.passwordHash = await hashPassword(newPassword);
  await user.save();
};

/**
 * Désactive un utilisateur
 */
export const deactivateUser = async (userId) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { isActive: false },
    { new: true },
  );

  if (!user) {
    throw new ApiError(404, "NOT_FOUND", "Utilisateur non trouvé");
  }

  return formatUserResponse(user);
};

/**
 * Active un utilisateur
 */
export const activateUser = async (userId) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { isActive: true },
    { new: true },
  );

  if (!user) {
    throw new ApiError(404, "NOT_FOUND", "Utilisateur non trouvé");
  }

  return formatUserResponse(user);
};

/**
 * Valide un utilisateur (ex: vendeur en attente de validation)
 */
export const validateUser = async (userId) => {
  const user = await User.findByIdAndUpdate(
    userId,
    { isValidated: true },
    { new: true },
  );

  if (!user) {
    throw new ApiError(404, "NOT_FOUND", "Utilisateur non trouvé");
  }

  return formatUserResponse(user);
};

/**
 * Supprime définitivement un utilisateur et désactive son wallet
 */
export const deleteUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "NOT_FOUND", "Utilisateur non trouvé");
  }

  // Désactiver le wallet si existe
  if (user.walletId) {
    const adminGlobalWalletId = await settingsService.getAdminGlobalWalletId();
    const isGlobalAdminWallet =
      adminGlobalWalletId &&
      user.walletId.toString() === adminGlobalWalletId.toString();

    if (!isGlobalAdminWallet) {
      await Wallet.findByIdAndUpdate(user.walletId, { isActive: false });
    }
  }

  await User.findByIdAndDelete(userId);
};

/**
 * Récupère les statistiques des utilisateurs
 */
export const getUserStats = async () => {
  const [
    totalUsers,
    totalBuyers,
    totalSellers,
    totalAdmins,
    activeUsers,
    pendingValidation,
  ] = await Promise.all([
    User.countDocuments({}),
    User.countDocuments({ role: "BUYER" }),
    User.countDocuments({ role: "SELLER" }),
    User.countDocuments({ role: "ADMIN" }),
    User.countDocuments({ isActive: true }),
    User.countDocuments({ isValidated: false }),
  ]);

  return {
    total: totalUsers,
    byRole: {
      buyers: totalBuyers,
      sellers: totalSellers,
      admins: totalAdmins,
    },
    active: activeUsers,
    inactive: totalUsers - activeUsers,
    pendingValidation,
  };
};

export default {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  resetUserPassword,
  deactivateUser,
  activateUser,
  validateUser,
  deleteUser,
  getUserStats,
};
