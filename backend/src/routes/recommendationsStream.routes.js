import express from "express";
import { getRecommendationsStream } from "../controllers/recommendationsStream.controller.js";

const router = express.Router();

router.get("/recommendations/stream", getRecommendationsStream);

export default router;
