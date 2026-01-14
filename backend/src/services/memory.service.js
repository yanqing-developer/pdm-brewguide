import { getMemory, updateMemory } from "../repositories/memory.repo.js";

export async function readMemory() {
  return getMemory();
}

export async function writeMemory(input) {
  const cur = await getMemory();

  const types = Array.isArray(input.preferredTypes)
    ? input.preferredTypes.map(x => String(x).toLowerCase())
    : null;

  const keywords = Array.isArray(input.nameKeywords)
    ? input.nameKeywords.map(x => String(x).toLowerCase()).filter(Boolean)
    : null;

  const radius = typeof input.radiusKm === "number" ? input.radiusKm : null;
  const website = typeof input.preferWebsite === "boolean" ? input.preferWebsite : null;

  const next = {
    preferred_types: types ?? cur.preferred_types,
    name_keywords: keywords ?? cur.name_keywords,
    radius_km: radius ?? cur.radius_km,
    prefer_website: website ?? cur.prefer_website
  };

  return updateMemory(next);
};
