import { query } from "../db/pool.js";

export async function getMemory() {
  const r = await query("SELECT * FROM user_memory WHERE id=1");
  return r.rows[0];
}

export async function updateMemory(next) {
  await query(
    `UPDATE user_memory
     SET preferred_types=$1, name_keywords=$2, radius_km=$3, prefer_website=$4, updated_at=NOW()
     WHERE id=1`,
    [next.preferred_types, next.name_keywords, next.radius_km, next.prefer_website]
  );
  return getMemory();
};
