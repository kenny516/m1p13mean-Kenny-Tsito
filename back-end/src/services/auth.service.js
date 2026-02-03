import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { ApiError } from "../middlewares/error.middleware.js";
import {
  generateToken,
  hashPassword,
  comparePassword,
  formatUserResponse,
} from "../utils/auth.utils.js";
import { createWallet } from "../utils/wallet.utils.js";

/**
 * Enregistre un nouvel utilisateur et crée son wallet dans une transaction
 */
export const registerUser = async ({ email, password, role, profile }) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const existingUser = await User.findOne({ email }).session(session);
    if (existingUser) {
      throw new ApiError(409, "CONFLICT", "Cet email est déjà utilisé");
    }

    const passwordHash = await hashPassword(password);

    const users = await User.create(
      [
        {
          email,
          passwordHash,
          role,
          profile,
          isValidated: role === "BUYER",
        },
      ],
      { session },
    );

    const user = users[0];

    const wallet = await createWallet(user._id, "User", session);

    user.walletId = wallet._id;
    await user.save({ session });

    await session.commitTransaction();

    const token = generateToken(user._id);

    return { user: formatUserResponse(user), token };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

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

export const getUserProfile = async (userId) => {
  const user = await User.findById(userId).populate("walletId");
  if (!user) {
    throw new ApiError(404, "NOT_FOUND", "Utilisateur non trouvé");
  }

  // Format the response similar to controller
  return {
    _id: user._id,
    email: user.email,
    role: user.role,
    profile: user.profile,
    isValidated: user.isValidated,
    wallet: user.walletId
      ? {
          _id: user.walletId._id,
          balance: user.walletId.balance,
          currency: user.walletId.currency,
        }
      : null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
};

export const updateUserProfile = async (userId, profile) => {
  const updateData = {};
  if (profile.firstName !== undefined)
    updateData["profile.firstName"] = profile.firstName;
  if (profile.lastName !== undefined)
    updateData["profile.lastName"] = profile.lastName;
  if (profile.phone !== undefined) updateData["profile.phone"] = profile.phone;
  if (profile.avatar !== undefined)
    updateData["profile.avatar"] = profile.avatar;
  if (profile.address !== undefined) {
    if (profile.address.street !== undefined)
      updateData["profile.address.street"] = profile.address.street;
    if (profile.address.city !== undefined)
      updateData["profile.address.city"] = profile.address.city;
    if (profile.address.postalCode !== undefined)
      updateData["profile.address.postalCode"] = profile.address.postalCode;
    if (profile.address.country !== undefined)
      updateData["profile.address.country"] = profile.address.country;
  }

  const user = await User.findByIdAndUpdate(
    userId,
    { $set: updateData },
    { new: true, runValidators: true },
  );
  if (!user) {
    throw new ApiError(404, "NOT_FOUND", "Utilisateur non trouvé");
  }

  return {
    _id: user._id,
    email: user.email,
    role: user.role,
    profile: user.profile,
    isValidated: user.isValidated,
    updatedAt: user.updatedAt,
  };
};

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
  const existingUser = await User.findOne({ email });
  return !!existingUser;
};
