import express from "express";
import { streamRecommendations  } from "../controllers/recommendationsStream.controller.js";

const router = express.Router();

router.get("/recommendations/stream", streamRecommendations );

export default router;
