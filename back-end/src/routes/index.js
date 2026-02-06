import { Router } from "express";
import authRoutes from "./auth.routes.js";
import productRoutes from "./product.routes.js";
import adminRoutes from "./admin.routes.js";
import walletRoutes from "./wallet.routes.js";
import shopRoutes from "./shop.routes.js";

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

// Routes futures
// router.use("/cart", cartRoutes);
// router.use("/orders", orderRoutes);

export default router;
