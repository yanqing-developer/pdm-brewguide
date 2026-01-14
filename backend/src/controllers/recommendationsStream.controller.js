import { streamRecommendations } from "../services/recommendationsStream.service.js";

export async function getRecommendationsStream(req, res, next) {
  try {
    await streamRecommendations(req, res);
  } catch (e) {
    next(e);
  }
};
