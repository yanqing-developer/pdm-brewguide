import { fetchAllBerlinBreweries } from "./breweryApi.service.js";
import { normalizeBreweries } from "./normalizeBrewery.service.js";
import { upsertBrewery } from "../repositories/brewery.repo.js";
import { setMeta } from "../repositories/meta.repo.js";
import { ENV } from "../config/env.js";

export async function refreshBreweriesCache() {
  const raw = await fetchAllBerlinBreweries({ maxPages: 10, perPage: 200 });
  const breweries = normalizeBreweries(raw, ENV.POI_LIMIT);

  for (const b of breweries) {
    await upsertBrewery(b);
  }

  await setMeta("brewery_last_refresh", new Date().toISOString());

  return { ok: true, insertedOrUpdated: breweries.length };
};
