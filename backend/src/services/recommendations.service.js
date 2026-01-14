import { readMemory } from "./memory.service.js";
import { getActionSets } from "./actions.service.js";
import { listBerlinBreweriesByTypes, getBreweryTypesByIds } from "../repositories/brewery.repo.js";
import { recommend } from "./recommender.service.js";
import { buildGuidance } from "./guidance.service.js";

export async function runRecommendations(body = {}) {
  const mem = await readMemory();

  const types = Array.isArray(body.preferredTypes)
    ? body.preferredTypes.map((x) => String(x).toLowerCase()).filter(Boolean)
    : mem.preferred_types;

  const keywords = Array.isArray(body.nameKeywords)
    ? body.nameKeywords.map((x) => String(x).toLowerCase()).filter(Boolean)
    : mem.name_keywords;

  const radius = typeof body.radiusKm === "number" ? body.radiusKm : mem.radius_km;
  const websitePref = typeof body.preferWebsite === "boolean" ? body.preferWebsite : mem.prefer_website;

  const userLat = typeof body.userLat === "number" ? body.userLat : null;
  const userLon = typeof body.userLon === "number" ? body.userLon : null;

  const { savedSet, dismissedSet, savedIds } = await getActionSets();

  // Learn from saved breweries to boost similar types
  const savedTypes = await getBreweryTypesByIds(savedIds);
  const savedTypeBoost = new Set(savedTypes.map((t) => String(t).toLowerCase()));

  // Candidate pool (still Berlin in your current repo function)
  const rows = await listBerlinBreweriesByTypes(types);

  const breweries = rows.map((r) => ({
    id: r.id,
    name: r.name,
    brewery_type: r.brewery_type ? String(r.brewery_type).toLowerCase() : null,
    address_1: r.address_1,
    city: r.city,
    state_province: r.state_province,
    postal_code: r.postal_code,
    country: r.country,
    longitude: r.longitude === null ? null : Number(r.longitude),
    latitude: r.latitude === null ? null : Number(r.latitude),
    phone: r.phone,
    website_url: r.website_url
  }));

  const ctx = {
    preferredTypes: Array.isArray(types) ? types : [],
    nameKeywords: Array.isArray(keywords) ? keywords : [],
    radiusKm: Number(radius ?? 2),
    preferWebsite: Boolean(websitePref),
    savedSet,
    dismissedSet,
    userLat,
    userLon,
    savedTypeBoost
  };

  const top = recommend(breweries, ctx, 10);

  // Guidance for follow-up questions + actions (for UI + SSE meta)
  const usedMemory = {
    preferredTypes: ctx.preferredTypes,
    nameKeywords: ctx.nameKeywords,
    radiusKm: ctx.radiusKm,
    preferWebsite: ctx.preferWebsite
  };

  const guidance = buildGuidance({
    usedMemory,
    hasUserCoords: typeof userLat === "number" && typeof userLon === "number"
  });

  return {
    ok: true,
    usedMemory,
    results: top,
    ...guidance
  };
}
