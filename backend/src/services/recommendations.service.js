import { readMemory } from "./memory.service.js";
import { getActionSets } from "./actions.service.js";
import { listBerlinBreweriesByTypes, getBreweryTypesByIds } from "../repositories/brewery.repo.js";
import { recommend } from "./recommender.service.js";
import { buildGuidance } from "./guidance.service.js";
import { ENV } from "../config/env.js";

/**
 * Haversine distance in KM
 */
function toRad(x) {
  return (x * Math.PI) / 180;
}
function haversineKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function clampNumber(v, min, max, fallback) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

export async function runRecommendations(body = {}) {
  const mem = await readMemory();

  const types = Array.isArray(body.preferredTypes)
    ? body.preferredTypes.map((x) => String(x).toLowerCase()).filter(Boolean)
    : mem.preferred_types;

  const keywords = Array.isArray(body.nameKeywords)
    ? body.nameKeywords.map((x) => String(x).toLowerCase()).filter(Boolean)
    : mem.name_keywords;

  // Radius: accept big numbers, but clamp to a sane max from ENV
  const rawRadius = typeof body.radiusKm === "number" ? body.radiusKm : mem.radius_km;
  const radiusKm = clampNumber(
    rawRadius,
    ENV.MIN_RADIUS_KM,
    ENV.MAX_RADIUS_KM,
    ENV.DEFAULT_RADIUS_KM
  );

  const websitePref =
    typeof body.preferWebsite === "boolean" ? body.preferWebsite : mem.prefer_website;

  const userLat = typeof body.userLat === "number" ? body.userLat : null;
  const userLon = typeof body.userLon === "number" ? body.userLon : null;

  const { savedSet, dismissedSet, savedIds } = await getActionSets();

  // Learn from saved breweries to boost similar types
  const savedTypes = await getBreweryTypesByIds(savedIds);
  const savedTypeBoost = new Set(savedTypes.map((t) => String(t).toLowerCase()).filter(Boolean));

  // Candidate pool (still Berlin in your repo function)
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
    radiusKm,
    preferWebsite: Boolean(websitePref),
    savedSet,
    dismissedSet,
    userLat,
    userLon,
    savedTypeBoost
  };

  /**
   * Hard-filter by radius (ONLY for items with coords).
   * - If user coords missing: skip radius filtering entirely.
   * - If brewery coords missing: do NOT drop immediately (kept as "unknown distance").
   * - If after hard-filter there are too few results, degrade by mixing back some "unknown distance" items.
   */
  const hasUserCoords = typeof userLat === "number" && typeof userLon === "number";

  let pool = breweries;
  let withinRadius = [];
  let unknownDistance = [];
  let outsideRadius = [];

  if (hasUserCoords) {
    for (const b of breweries) {
      const hasBreweryCoords =
        typeof b.latitude === "number" && typeof b.longitude === "number";

      if (!hasBreweryCoords) {
        unknownDistance.push(b);
        continue;
      }

      const dKm = haversineKm(userLat, userLon, b.latitude, b.longitude);
      if (dKm <= radiusKm) withinRadius.push(b);
      else outsideRadius.push(b);
    }

    // Prefer the strict pool: within radius + unknown coords (graceful)
    pool = withinRadius;

    // If within-radius is too small, mix in unknown-distance items to avoid empty UI
    if (pool.length < ENV.MIN_POOL_AFTER_FILTER) {
      pool = pool.concat(unknownDistance);
    }
  }

  const top = recommend(pool, ctx, ENV.REC_TOP_N);

  // Data quality + filter transparency for UI/meta
  const dataQuality = {
    totalCandidates: breweries.length,
    hasUserCoords,
    radiusKmUsed: radiusKm,
    coord: {
      withinRadius: hasUserCoords ? withinRadius.length : null,
      unknownDistance: hasUserCoords ? unknownDistance.length : null,
      outsideRadius: hasUserCoords ? outsideRadius.length : null
    },
    note: hasUserCoords
      ? (withinRadius.length < ENV.MIN_POOL_AFTER_FILTER
          ? "Radius filter applied to items with coordinates; too few within radius, so included items missing coordinates."
          : "Radius filter applied to items with coordinates; items missing coordinates were not used for distance filtering.")
      : "No user coordinates provided; radius filtering skipped."
  };

  // Guidance for follow-up questions + actions (for UI + SSE meta)
  const usedMemory = {
    preferredTypes: ctx.preferredTypes,
    nameKeywords: ctx.nameKeywords,
    radiusKm: ctx.radiusKm,
    preferWebsite: ctx.preferWebsite
  };

  const guidance = buildGuidance({
    usedMemory,
    hasUserCoords
  });

  return {
    ok: true,
    usedMemory,
    dataQuality,
    results: top,
    ...guidance
  };
};
