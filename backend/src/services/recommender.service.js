function toRad(x) { return (x * Math.PI) / 180; }

function haversineMeters(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function hasWebsite(url) {
  if (!url) return false;
  const s = String(url).trim().toLowerCase();
  return s.startsWith("http://") || s.startsWith("https://");
}

function keywordHitScore(name, keywords) {
  if (!name || !keywords || keywords.length === 0) return { score: 0, hit: null };
  const lower = String(name).toLowerCase();
  for (const k of keywords) {
    if (k && lower.includes(String(k).toLowerCase())) return { score: 15, hit: k };
  }
  return { score: 0, hit: null };
}

function scoreOne(b, ctx) {
  const {
    preferredTypes, nameKeywords, radiusKm, preferWebsite,
    savedSet, dismissedSet, userLat, userLon, savedTypeBoost
  } = ctx;

  if (dismissedSet.has(b.id)) return null;

  const reasons = [];
  let score = 0;

  // distance
  let distanceM = null;
  const hasCoords =
    typeof userLat === "number" && typeof userLon === "number" &&
    typeof b.latitude === "number" && typeof b.longitude === "number";

  if (hasCoords) {
    distanceM = haversineMeters(userLat, userLon, b.latitude, b.longitude);
    const dKm = distanceM / 1000;

    if (dKm <= radiusKm) {
      score += Math.max(0, 40 * (1 - dKm / radiusKm));
      reasons.push(`Within your radius (${dKm.toFixed(1)} km)`);
    } else {
      score -= 15;
      reasons.push(`Outside radius (${dKm.toFixed(1)} km)`);
    }
  } else {
    reasons.push("No distance used (missing coordinates)");
  }

  // type
  const t = b.brewery_type ? String(b.brewery_type).toLowerCase() : null;
  if (preferredTypes.length && t) {
    if (preferredTypes.includes(t)) {
      score += 25;
      reasons.push(`Matches preferred type: ${t}`);
    } else {
      score -= 3;
    }
  }

  // keywords
  const kw = keywordHitScore(b.name, nameKeywords);
  if (kw.score > 0) {
    score += kw.score;
    reasons.push(`Name matches keyword: "${kw.hit}"`);
  }

  // website
  const websiteOk = hasWebsite(b.website_url);
  if (preferWebsite) {
    if (websiteOk) { score += 12; reasons.push("Has website (actionable)"); }
    else { score -= 8; reasons.push("No website listed"); }
  } else {
    if (websiteOk) score += 2;
  }

  // saved similarity
  if (savedTypeBoost.has(t)) {
    score += 8;
    reasons.push(`Similar to your saved places (type: ${t})`);
  }

  // saved exact
  if (savedSet.has(b.id)) {
    score += 5;
    reasons.push("You saved this before");
  }

  return {
    ...b,
    distance_m: distanceM,
    has_website: websiteOk,
    score,
    explanation: reasons.slice(0, 3).join(" · ")
  };
}

export function recommend(breweries, ctx, topN = 10) {
  const scored = [];
  for (const b of breweries) {
    const s = scoreOne(b, ctx);
    if (s) scored.push(s);
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topN);
};
