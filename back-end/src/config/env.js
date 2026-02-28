import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Chemin vers le fichier .env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, "../../.env");

// Charger les variables d'environnement
dotenv.config({ path: envPath });

/**
 * Configuration des variables d'environnement
 * Valeurs par défaut pour le développement
 */
const config = {
  // Serveur
  port: parseInt(process.env.PORT, 10) || 3000,
  nodeEnv: process.env.NODE_ENV || "development",

  // MongoDB
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/mean-mall",

  // JWT
  jwtSecret: process.env.JWT_SECRET || "your_jwt_secret_key_change_in_production",
  jwtExpire: process.env.JWT_EXPIRE || "7d",
  jwtRefreshExpire: process.env.JWT_REFRESH_EXPIRE || "30d",

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:4200",

  // Pagination par défaut
  defaultPageSize: parseInt(process.env.DEFAULT_PAGE_SIZE, 10) || 10,
  maxPageSize: parseInt(process.env.MAX_PAGE_SIZE, 10) || 100,

  // Panier
  cartExpirationMinutes: parseInt(process.env.CART_EXPIRATION_MINUTES, 10) || 30,

  // ImageKit
  imagekit: {
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY || "",
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY || "",
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT || "",
  },
};

// Validation des variables critiques en production
if (config.nodeEnv === "production") {
  const requiredVars = [
    "MONGO_URI",
    "JWT_SECRET",
    "IMAGEKIT_PUBLIC_KEY",
    "IMAGEKIT_PRIVATE_KEY",
    "IMAGEKIT_URL_ENDPOINT",
  ];
  const missingVars = requiredVars.filter((varName) => !process.env[varName]);

  if (missingVars.length > 0) {
    throw new Error(
      `❌ Variables d'environnement manquantes en production: ${missingVars.join(", ")}`
    );
  }
}

export default config;
