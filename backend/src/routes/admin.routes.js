import express from "express";
import { refreshBreweries } from "../controllers/admin.controller.js";

const router = express.Router();
router.post("/admin/refresh-breweries", refreshBreweries);
export default router;
