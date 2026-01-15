import express from "express";
import { refreshBreweries, resetUserData } from "../controllers/admin.controller.js";

const router = express.Router();

router.post("/admin/refresh-breweries", refreshBreweries);
router.post("/admin/reset-user-data", resetUserData);

export default router;
