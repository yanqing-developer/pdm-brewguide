import { saveBrewery, dismissBrewery, learnSimilar } from "../services/actions.service.js";
import { getBreweryById } from "../repositories/brewery.repo.js";
import { runRecommendations } from "../services/recommendations.service.js";

async function mustBrewery(id) {
  const b = await getBreweryById(id);
  if (!b) {
    const err = new Error("Brewery not found");
    err.status = 404;
    throw err;
  }
  return b;
}

export async function saveAction(req, res, next) {
  try {
    const { brewery_id } = req.body || {};
    if (!brewery_id) return res.status(400).json({ ok: false, error: "Missing brewery_id" });

    const id = String(brewery_id);
    await mustBrewery(id);

    await saveBrewery(id);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

export async function dismissAction(req, res, next) {
  try {
    const { brewery_id } = req.body || {};
    if (!brewery_id) return res.status(400).json({ ok: false, error: "Missing brewery_id" });

    const id = String(brewery_id);
    await mustBrewery(id);

    await dismissBrewery(id);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
}

export async function similarAction(req, res, next) {
  try {
    const { brewery_id, userLat, userLon } = req.body || {};
    if (!brewery_id) return res.status(400).json({ ok: false, error: "Missing brewery_id" });

    const id = String(brewery_id);
    await mustBrewery(id);

    const seed = await learnSimilar(id);

 
    const rec = await runRecommendations({
      userLat: typeof userLat === "number" ? userLat : undefined,
      userLon: typeof userLon === "number" ? userLon : undefined
    });

    res.json({ ok: true, seed, ...rec });
  } catch (e) {
    next(e);
  }
};
