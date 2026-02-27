import ImageKit from "@imagekit/nodejs";
import config from "../config/env.js";
import { ApiError } from "../middlewares/error.middleware.js";

const imagekit = new ImageKit({
	publicKey: config.imagekit.publicKey,
	privateKey: config.imagekit.privateKey,
	urlEndpoint: config.imagekit.urlEndpoint,
});

const ensureConfigured = () => {
	if (!config.imagekit.publicKey || !config.imagekit.privateKey || !config.imagekit.urlEndpoint) {
		throw new ApiError(500, "IMAGEKIT_CONFIG_ERROR", "Configuration ImageKit manquante");
	}
};

const uploadBuffer = async ({ buffer, fileName, folder, mimeType = "application/octet-stream" }) => {
	ensureConfigured();

	try {
		const uploadFile = new File([buffer], fileName, { type: mimeType });

		const result = await imagekit.files.upload({
			file: uploadFile,
			fileName,
			folder,
			useUniqueFileName: false,
		});

		return {
			url: result.url,
			fileId: result.fileId,
		};
	} catch (error) {
		throw new ApiError(502, "IMAGEKIT_UPLOAD_FAILED", "Échec de l'upload image", {
			message: error?.message,
		});
	}
};

export const deleteByFileId = async (fileId) => {
	if (!fileId) return;
	ensureConfigured();

	try {
		await imagekit.files.delete(fileId);
	} catch (error) {
		throw new ApiError(502, "IMAGEKIT_DELETE_FAILED", "Échec de suppression image", {
			message: error?.message,
		});
	}
};

export const uploadUserAvatar = async (userId, file) => {
	if (!file?.buffer) {
		throw new ApiError(400, "INVALID_FILE", "Fichier avatar manquant");
	}

	return uploadBuffer({
		buffer: file.buffer,
		mimeType: file.mimetype,
		folder: "user-avatar",
		fileName: `user_${userId}`,
	});
};

export const uploadProductImageAtIndex = async ({ shopId, productId, index, file }) => {
	if (!file?.buffer) {
		throw new ApiError(400, "INVALID_FILE", "Fichier image produit manquant");
	}

	return uploadBuffer({
		buffer: file.buffer,
		mimeType: file.mimetype,
		folder: `products/${shopId}`,
		fileName: `${productId}_${index}`,
	});
};

export const uploadShopLogo = async (shopId, file) => {
	if (!file?.buffer) {
		throw new ApiError(400, "INVALID_FILE", "Fichier logo boutique manquant");
	}

	return uploadBuffer({
		buffer: file.buffer,
		mimeType: file.mimetype,
		folder: "shops",
		fileName: `logo_${shopId}`,
	});
};

export const uploadShopBanner = async (shopId, file) => {
	if (!file?.buffer) {
		throw new ApiError(400, "INVALID_FILE", "Fichier bannière boutique manquant");
	}

	return uploadBuffer({
		buffer: file.buffer,
		mimeType: file.mimetype,
		folder: "shops",
		fileName: `banner_${shopId}`,
	});
};

export default {
	uploadUserAvatar,
	uploadShopLogo,
	uploadShopBanner,
	uploadProductImageAtIndex,
	deleteByFileId,
};
