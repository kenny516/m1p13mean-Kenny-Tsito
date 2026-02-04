import { Router } from "express";
import authRoutes from "./auth.routes.js";
import productRoutes from "./product.routes.js";

const router = Router();

// Routes d'authentification
router.use("/auth", authRoutes);

// Routes produits
router.use("/products", productRoutes);

// Routes futures
// router.use("/users", userRoutes);
// router.use("/shops", shopRoutes);
// router.use("/cart", cartRoutes);
// router.use("/orders", orderRoutes);
// router.use("/wallets", walletRoutes);

export default router;
