import mongoose from "mongoose";
import { User, Wallet } from "../models/index.js";
import { ApiError } from "../middlewares/error.middleware.js";
import {
  generateToken,
  hashPassword,
  comparePassword,
  formatUserResponse,
} from "../utils/auth.utils.js";
import { createOptionalSession } from "../utils/transaction.util.js";
import {
  uploadUserAvatar as uploadUserAvatarImage,
  deleteByFileId,
} from "./imagekit.service.js";

/**
 * Service d'authentification
 * Gère inscription, connexion, profil et mot de passe
 */

/**
 * Enregistre un nouvel utilisateur et crée son wallet
 */
export const registerUser = async ({ email, password, role, profile, avatarFile }) => {
  const txn = await createOptionalSession();

  try {
    // Vérifier si l'email existe déjà
    const userQuery = User.findOne({ email });
    if (txn.session) userQuery.session(txn.session);
    const existingUser = await userQuery;
    if (existingUser) {
      throw new ApiError(409, "CONFLICT", "Cet email est déjà utilisé");
    }

    // Hasher le mot de passe et créer l'utilisateur
    const passwordHash = await hashPassword(password);
    const createUserOptions = txn.session ? { session: txn.session } : {};
    const [user] = await User.create(
      [{ email, passwordHash, role, profile, isValidated: role === "BUYER" }],
      createUserOptions,
    );

    // Créer le wallet associé
    const createWalletOptions = txn.session ? { session: txn.session } : {};
    const [wallet] = await Wallet.create(
      [{ ownerId: user._id, ownerModel: "User" }],
      createWalletOptions,
    );

    // Associer le wallet à l'utilisateur
    user.walletId = wallet._id;

    if (avatarFile) {
      const uploadedAvatar = await uploadUserAvatarImage(user._id.toString(), avatarFile);
      user.profile = user.profile || {};
      user.profile.avatar = uploadedAvatar;
    }

    const saveOptions = txn.session ? { session: txn.session } : {};
    await user.save(saveOptions);

    if (txn.ownsSession) await txn.commit();

    const token = generateToken(user._id);
    return { user: formatUserResponse(user), token };
  } catch (error) {
    if (txn.ownsSession) await txn.abort();
    throw error;
  } finally {
    if (txn.ownsSession) await txn.end();
  }
};

/**
 * Connecte un utilisateur
 */
export const loginUser = async ({ email, password }) => {
  const user = await User.findOne({ email }).select("+passwordHash");

  if (!user) {
    throw new ApiError(
      401,
      "INVALID_CREDENTIALS",
      "Email ou mot de passe incorrect",
    );
  }

  if (!user.isActive) {
    throw new ApiError(401, "USER_INACTIVE", "Compte désactivé");
  }

  const isMatch = await comparePassword(password, user.passwordHash);
  if (!isMatch) {
    throw new ApiError(
      401,
      "INVALID_CREDENTIALS",
      "Email ou mot de passe incorrect",
    );
  }

  const token = generateToken(user._id);
  return { user: formatUserResponse(user), token };
};

/**
 * Récupère le profil complet d'un utilisateur avec son wallet
 */
export const getUserProfile = async (userId) => {
  const user = await User.findById(userId).populate("walletId");

  if (!user) {
    throw new ApiError(404, "NOT_FOUND", "Utilisateur non trouvé");
  }

  const serializedUser = user.toJSON();

  return {
    _id: serializedUser._id,
    email: serializedUser.email,
    role: serializedUser.role,
    profile: serializedUser.profile,
    isValidated: serializedUser.isValidated,
    isActive: serializedUser.isActive,
    wallet: user.walletId
      ? {
          _id: user.walletId._id,
          balance: user.walletId.balance,
          currency: user.walletId.currency,
          pendingBalance: user.walletId.pendingBalance,
          totalEarned: user.walletId.totalEarned,
          totalSpent: user.walletId.totalSpent,
        }
      : null,
    createdAt: serializedUser.createdAt,
    updatedAt: serializedUser.updatedAt,
  };
};

/**
 * Met à jour le profil d'un utilisateur
 */
export const updateUserProfile = async (userId, profile = {}, avatarFile = null) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "NOT_FOUND", "Utilisateur non trouvé");
  }

  user.profile = user.profile || {};

  if (profile.firstName !== undefined) user.profile.firstName = profile.firstName;
  if (profile.lastName !== undefined) user.profile.lastName = profile.lastName;
  if (profile.phone !== undefined) user.profile.phone = profile.phone;

  if (profile.address) {
    user.profile.address = user.profile.address || {};
    if (profile.address.street !== undefined)
      user.profile.address.street = profile.address.street;
    if (profile.address.city !== undefined)
      user.profile.address.city = profile.address.city;
    if (profile.address.postalCode !== undefined)
      user.profile.address.postalCode = profile.address.postalCode;
    if (profile.address.country !== undefined)
      user.profile.address.country = profile.address.country;
  }

  const previousFileId = user.profile.avatar?.fileId;

  if (profile.avatar !== undefined) {
      delete profile.avatar;
  }

  if (avatarFile) {
    const uploadedAvatar = await uploadUserAvatarImage(user._id.toString(), avatarFile);
    user.profile.avatar = uploadedAvatar;
  }

  await user.save();

  if (avatarFile && previousFileId) {
    await deleteByFileId(previousFileId);
  }

  return formatUserResponse(user);
};

export const uploadUserAvatar = async (userId, avatarFile) => {
  if (!avatarFile) {
    throw new ApiError(400, "INVALID_FILE", "Aucun fichier avatar fourni");
  }

  return updateUserProfile(userId, {}, avatarFile);
};

export const deleteUserAvatar = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "NOT_FOUND", "Utilisateur non trouvé");
  }

  const previousFileId = user.profile?.avatar?.fileId;
  user.profile = user.profile || {};
  user.profile.avatar = null;
  await user.save();

  if (previousFileId) {
    await deleteByFileId(previousFileId);
  }

  return formatUserResponse(user);
};

/**
 * Change le mot de passe d'un utilisateur
 */
export const changeUserPassword = async (
  userId,
  currentPassword,
  newPassword,
) => {
  const user = await User.findById(userId).select("+passwordHash");

  if (!user) {
    throw new ApiError(404, "NOT_FOUND", "Utilisateur non trouvé");
  }

  const isMatch = await comparePassword(currentPassword, user.passwordHash);
  if (!isMatch) {
    throw new ApiError(
      400,
      "INVALID_PASSWORD",
      "Mot de passe actuel incorrect",
    );
  }

  user.passwordHash = await hashPassword(newPassword);
  await user.save();

  return true;
};

export const checkEmailExists = async (email) => {
  const existingUser = await User.exists({ email });
  return !!existingUser;
};

export default {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  uploadUserAvatar,
  deleteUserAvatar,
  changeUserPassword,
  checkEmailExists,
};
