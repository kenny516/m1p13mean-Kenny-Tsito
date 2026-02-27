import multer from "multer";
import { ApiError } from "./error.middleware.js";

const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/jpg",
];

const baseUpload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 30 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
      return cb(
        new ApiError(400, "INVALID_FILE_TYPE", "Seuls les fichiers image sont autorisés"),
      );
    }
    cb(null, true);
  },
});

const multerErrorToApiError = (error) => {
  if (!error) return null;

  if (error instanceof ApiError) {
    return error;
  }

  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return new ApiError(400, "FILE_TOO_LARGE", "La taille maximale d'une image est de 30MB");
    }

    return new ApiError(400, "UPLOAD_ERROR", error.message);
  }

  return error;
};

const wrapMulter = (uploader) => (req, res, next) => {
  uploader(req, res, (error) => {
    if (error) {
      return next(multerErrorToApiError(error));
    }
    next();
  });
};

export const uploadAvatar = wrapMulter(baseUpload.single("avatar"));
export const uploadShopLogo = wrapMulter(baseUpload.single("logo"));
export const uploadShopBanner = wrapMulter(baseUpload.single("banner"));
export const uploadShopMedia = wrapMulter(
  baseUpload.fields([
    { name: "logo", maxCount: 1 },
    { name: "banner", maxCount: 1 },
  ]),
);
export const uploadProductImages = wrapMulter(baseUpload.array("images", 5));

export const parseJsonFields = (fields = []) => (req, _res, next) => {
  if (!req.body || typeof req.body !== "object") {
    return next();
  }

  for (const field of fields) {
    const value = req.body[field];
    if (typeof value !== "string") continue;

    const trimmed = value.trim();
    if (!trimmed || (trimmed[0] !== "{" && trimmed[0] !== "[")) continue;

    try {
      req.body[field] = JSON.parse(trimmed);
    } catch {
      return next(
        new ApiError(400, "INVALID_JSON_FIELD", `Le champ ${field} doit être un JSON valide`),
      );
    }
  }

  next();
};

export default {
  uploadAvatar,
  uploadShopLogo,
  uploadShopBanner,
  uploadShopMedia,
  uploadProductImages,
  parseJsonFields,
};
