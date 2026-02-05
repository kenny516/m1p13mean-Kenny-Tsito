import { Router } from "express";
import authRoutes from "./auth.routes.js";
import adminRoutes from "./admin.routes.js";
import walletRoutes from "./wallet.routes.js";

const router = Router();

// Routes d'authentification
router.use("/auth", authRoutes);

// Routes d'administration
router.use("/admin", adminRoutes);

// Routes wallet
router.use("/wallets", walletRoutes);

// Routes futures
// router.use("/shops", shopRoutes);
// router.use("/products", productRoutes);
// router.use("/cart", cartRoutes);
// router.use("/orders", orderRoutes);

export default router;
