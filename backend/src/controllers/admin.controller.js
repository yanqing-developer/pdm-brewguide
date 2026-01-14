import { refreshBreweriesCache } from "../services/ingest.service.js";

export async function refreshBreweries(req, res, next) {
  try {
    const result = await refreshBreweriesCache();
    res.json(result);
  } catch (e) {
    next(e);
  }
};
