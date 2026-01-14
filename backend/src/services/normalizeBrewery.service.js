function safeStr(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

function toNumberOrNull(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function normalizeOne(b) {
  const id = safeStr(b.id);
  if (!id) return null;

  const lat = toNumberOrNull(b.latitude);
  const lon = toNumberOrNull(b.longitude);

  return {
    id,
    name: safeStr(b.name),
    brewery_type: safeStr(b.brewery_type)?.toLowerCase() || null,
    address_1: safeStr(b.address_1),
    city: safeStr(b.city),
    state_province: safeStr(b.state_province),
    postal_code: safeStr(b.postal_code),
    country: safeStr(b.country),
    latitude: lat,      
    longitude: lon,     
    phone: safeStr(b.phone),
    website_url: safeStr(b.website_url),
  };
}

export function normalizeBreweries(list, limit = 3000) {
  const out = [];

  for (const b of list || []) {
    const n = normalizeOne(b);
    if (!n) continue;

    const city = (n.city || "").trim().toLowerCase();
    const country = (n.country || "").trim().toLowerCase();

    if (city !== "berlin") continue;
    if (country !== "germany") continue;

    out.push(n);
    if (out.length >= limit) break;
  }

  return out;
};
