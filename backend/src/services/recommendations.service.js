import {
  listAllBerlinBreweries,
  getBreweryTypesByIds,
  listBreweryTypes
} from "../repositories/brewery.repo.js";

import { readMemory } from "./memory.service.js";
import { getActionSets } from "./actions.service.js";
import { ENV } from "../config/env.js";

/* ------------------------ helpers ------------------------ */
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function isValidLatLon(lat, lon) {
  return (
    typeof lat === "number" &&
    typeof lon === "number" &&
    Number.isFinite(lat) &&
    Number.isFinite(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}

// Haversine (km)
function distanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const toRad = (v) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function uniqLower(arr) {
  if (!Array.isArray(arr)) return [];
  return Array.from(
    new Set(arr.map((x) => String(x).toLowerCase().trim()).filter(Boolean))
  );
}

function sanitizeTypes(raw, validSet) {
  const clean = uniqLower(raw);
  if (!validSet || validSet.size === 0) return clean; // if we can't validate, don't drop user input
  return clean.filter((t) => validSet.has(t));
}

function normalizeKeywords(raw) {
  return uniqLower(raw);
}

/* ------------------------ main ------------------------ */
/**
 * Key design decision (stability):
 * - Never hard-filter the DB by preferredTypes or radius.
 * - Always start from full local DB candidate pool.
 * - Use preferences only for scoring.
 * This guarantees we never return 0 items unless the DB is truly empty.
 */
export async function runRecommendations(body = {}) {
  const mem = await readMemory();
  const { savedSet, dismissedSet } = await getActionSets();

  // ----- UI/Request inputs (optional) -----
  const rawLat = body.userLat ?? null;
  const rawLon = body.userLon ?? null;
  const hasCoords = isValidLatLon(rawLat, rawLon);
  const userLat = hasCoords ? rawLat : null;
  const userLon = hasCoords ? rawLon : null;

  // radius still used for distance scoring scale, but NOT for filtering
  const radiusKm = clamp(
    typeof body.radiusKm === "number" ? body.radiusKm : mem.radius_km ?? (ENV.DEFAULT_RADIUS_KM ?? 8),
    ENV.MIN_RADIUS_KM ?? 1,
    ENV.MAX_RADIUS_KM ?? 120
  );

  // valid types set (for sanitising)
  const validTypes = await listBreweryTypes(); // returns string[]
  const validTypeSet = new Set((validTypes || []).map((t) => String(t).toLowerCase()));

  const preferredTypes = sanitizeTypes(
    Array.isArray(body.preferredTypes) ? body.preferredTypes : mem.preferred_types,
    validTypeSet
  );

  const nameKeywords = normalizeKeywords(
    Array.isArray(body.nameKeywords) ? body.nameKeywords : mem.name_keywords
  );

  const preferWebsite =
    typeof body.preferWebsite === "boolean"
      ? body.preferWebsite
      : mem.prefer_website ?? false;

  // limit (front-end max results)
  const defaultTopN = ENV.REC_TOP_N ?? 10;
  const maxTopN = ENV.MAX_TOP_N ?? 50;
  const requestedLimit =
    typeof body.limit === "number" ? body.limit : typeof body.topN === "number" ? body.topN : defaultTopN;

  const topN = clamp(
    Number.isFinite(requestedLimit) ? requestedLimit : defaultTopN,
    1,
    maxTopN
  );

  // ----- Always fetch full pool from DB -----
  const all = await listAllBerlinBreweries(5000);

  // If DB empty, return empty gracefully (this is the only legitimate 0 case)
  if (!Array.isArray(all) || all.length === 0) {
    return {
      usedMemory: { preferredTypes, nameKeywords, radiusKm, preferWebsite, limit: topN },
      results: [],
      nextQuestions: ["No breweries cached yet. Click “Refresh Breweries” first."],
      suggestedActions: [
        { label: "refresh", endpoint: "/api/admin/refresh-breweries" }
      ]
    };
  }

  // ----- saved-type boost (learn from saved items) -----
  let savedTypeSet = new Set();
  if (savedSet.size > 0) {
    const savedTypes = await getBreweryTypesByIds([...savedSet]);
    savedTypeSet = new Set((savedTypes || []).map((t) => String(t).toLowerCase()));
  }

  // ----- score -----
  const scored = [];
  for (const b of all) {
    if (!b || !b.id) continue;
    if (dismissedSet.has(b.id)) continue;

    let score = 0;
    const reasons = [];

    const t = b.brewery_type ? String(b.brewery_type).toLowerCase() : null;

    // distance (soft boost only)
    let dist = null;
    if (
      hasCoords &&
      typeof b.latitude === "number" &&
      typeof b.longitude === "number" &&
      Number.isFinite(b.latitude) &&
      Number.isFinite(b.longitude)
    ) {
      dist = distanceKm(userLat, userLon, b.latitude, b.longitude);
      const ratio = clamp(1 - dist / radiusKm, 0, 1);
      const s = Math.round(40 * ratio); // 0..40
      score += s;

      if (dist <= radiusKm) reasons.push(`Within ${dist.toFixed(1)} km`);
      else reasons.push(`~${dist.toFixed(1)} km away`);
    }

    // type preference (NO filtering; score only)
    if (preferredTypes.length > 0 && t && preferredTypes.includes(t)) {
      score += 25;
      reasons.push(`Matches type: ${t}`);
    }

    // learned from saved
    if (t && savedTypeSet.has(t)) {
      score += 8;
      reasons.push("Similar to places you saved");
    }

    // name keywords
    for (const kw of nameKeywords) {
      if (b.name && String(b.name).toLowerCase().includes(kw)) {
        score += 15;
        reasons.push(`Name contains "${kw}"`);
        break;
      }
    }

    // website preference
    const hasWebsite = Boolean(b.website_url);
    if (preferWebsite) {
      if (hasWebsite) {
        score += 12;
        reasons.push("Has a website");
      } else {
        score -= 8;
      }
    } else if (hasWebsite) {
      score += 2;
    }

    // saved marker
    if (savedSet.has(b.id)) {
      score += 5;
      reasons.push("You saved this earlier");
    }

    if (reasons.length === 0) reasons.push("Recommended based on overall relevance");

    scored.push({
      ...b,
      score,
      has_website: hasWebsite,
      distance_m: dist == null ? null : Math.round(dist * 1000),
      explanation: reasons.slice(0, 3).join(" · ")
    });
  }

  scored.sort((a, b) => b.score - a.score);
  const results = scored.slice(0, topN);

  const nextQuestions = [];
  if (preferredTypes.length === 0) nextQuestions.push("Any brewery types you prefer (bar, micro, beergarden)?");
  if (nameKeywords.length === 0) nextQuestions.push("Any name keywords you like (e.g. craft, garden)?");
  if (!hasCoords) nextQuestions.push("Optional: add your location to prioritize nearby places.");

  const suggestedActions = [
    { label: "save", endpoint: "/api/actions/save" },
    { label: "dismiss", endpoint: "/api/actions/dismiss" },
    { label: "similar", endpoint: "/api/actions/similar" }
  ];

  return {
    usedMemory: { preferredTypes, nameKeywords, radiusKm, preferWebsite, limit: topN },
    results,
    nextQuestions,
    suggestedActions
  };
}
