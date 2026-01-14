import express from "express";
import { getMemory, updateMemory } from "../controllers/memory.controller.js";

const router = express.Router();
router.get("/memory", getMemory);
router.post("/memory", updateMemory);
export default router;
