import { runRecommendations } from "../services/recommendations.service.js";

export async function getRecommendations(req, res, next) {
  try {
    const result = await runRecommendations(req.body || {});
    res.json(result);
  } catch (e) {
    next(e);
  }
};
