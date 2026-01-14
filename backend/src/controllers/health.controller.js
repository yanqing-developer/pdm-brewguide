import { countBreweries } from "../repositories/brewery.repo.js";
import { getMeta } from "../repositories/meta.repo.js";

export async function getHealth(req, res, next) {
  try {
    const breweryCount = await countBreweries();
    const breweryLastRefresh = (await getMeta("brewery_last_refresh")) || "unknown";
    res.json({ ok: true, breweryCount, breweryLastRefresh });
  } catch (e) {
    next(e);
  }
};