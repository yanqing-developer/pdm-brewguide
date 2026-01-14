import express from "express";
import healthRoutes from "./health.routes.js";
import adminRoutes from "./admin.routes.js";
import memoryRoutes from "./memory.routes.js";
import actionsRoutes from "./actions.routes.js";
import recommendationsRoutes from "./recommendations.routes.js";
import recommendationsStreamRoutes from "./recommendationsStream.routes.js"; 
import breweriesRoutes from "./breweries.routes.js";

const router = express.Router();

router.use(healthRoutes);
router.use(adminRoutes);
router.use(memoryRoutes);
router.use(actionsRoutes);
router.use(recommendationsRoutes);
router.use(recommendationsStreamRoutes);
router.use(breweriesRoutes);

export default router;
