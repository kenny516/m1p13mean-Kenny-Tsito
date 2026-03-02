import { Router } from "express";
import authRoutes from "./auth.routes.js";
import productRoutes from "./product.routes.js";
import adminRoutes from "./admin.routes.js";
import walletRoutes from "./wallet.routes.js";
import shopRoutes from "./shop.routes.js";
import stockMovementRoutes from "./stockMovement.routes.js";
import cartRoutes from "./cart.routes.js";
import reviewRoutes from "./review.routes.js";
import settingsRoutes from "./settings.routes.js";

const router = Router();

// Routes d'authentification
router.use("/auth", authRoutes);

// Routes produits
router.use("/products", productRoutes);
// Routes d'administration
router.use("/admin", adminRoutes);

// Routes wallet
router.use("/wallets", walletRoutes);

// Routes boutiques
router.use("/shops", shopRoutes);

// Routes mouvements de stock
router.use("/stock-movements", stockMovementRoutes);

// Routes panier
router.use("/cart", cartRoutes);

// Routes reviews (avis)
router.use("/reviews", reviewRoutes);

// Routes settings (paramètres publics)
router.use("/settings", settingsRoutes);

export default router;
