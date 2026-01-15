import { refreshBreweriesCache } from "../services/ingest.service.js";
import { query } from "../db/pool.js";

export async function refreshBreweries(req, res, next) {
  try {
    const result = await refreshBreweriesCache();
    res.json(result);
  } catch (e) {
    next(e);
  }
};



export async function resetUserData(req, res, next) {
  try {
    await query(
      `UPDATE user_memory
       SET preferred_types = ARRAY[]::TEXT[],
           name_keywords   = ARRAY[]::TEXT[],
           radius_km       = 2.0,
           prefer_website  = FALSE,
           updated_at      = NOW()
       WHERE id = 1`
    );
    await query(`TRUNCATE TABLE user_action RESTART IDENTITY`);
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
};
