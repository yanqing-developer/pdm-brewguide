import express from "express";
import { saveAction, dismissAction, similarAction } from "../controllers/actions.controller.js";

const router = express.Router();
router.post("/actions/save", saveAction);
router.post("/actions/dismiss", dismissAction);
router.post("/actions/similar", similarAction);
export default router;
