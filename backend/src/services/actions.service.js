import { saveAction, listActionIds } from "../repositories/action.repo.js";
import { getBreweryById } from "../repositories/brewery.repo.js";
import { getMemory, updateMemory } from "../repositories/memory.repo.js";

export async function saveBrewery(breweryId) {
  await saveAction("SAVE", breweryId);
}

export async function dismissBrewery(breweryId) {
  await saveAction("DISMISS", breweryId);
}

export async function learnSimilar(breweryId) {
  const b = await getBreweryById(breweryId);
  if (!b) {
    const err = new Error("Brewery not found");
    err.status = 404;
    throw err;
  }

  const t = b.brewery_type ? String(b.brewery_type).toLowerCase() : null;

  const cur = await getMemory();
  const merged = t
    ? Array.from(new Set([...(cur.preferred_types || []), t]))
    : cur.preferred_types;

  await updateMemory({
    preferred_types: merged,
    name_keywords: cur.name_keywords,
    radius_km: cur.radius_km,
    prefer_website: cur.prefer_website
  });

  return { brewery_type: t };
}

export async function getActionSets() {
  const savedIds = await listActionIds("SAVE");
  const dismissedIds = await listActionIds("DISMISS");

  return {
    savedSet: new Set(savedIds),
    dismissedSet: new Set(dismissedIds),
    savedIds
  };
};
