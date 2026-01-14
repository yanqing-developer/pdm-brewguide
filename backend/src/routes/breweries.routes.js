import express from "express";
import { getBreweryTypes } from "../controllers/breweries.controller.js";

const router = express.Router();

router.get("/breweries/types", getBreweryTypes);

export default router;
