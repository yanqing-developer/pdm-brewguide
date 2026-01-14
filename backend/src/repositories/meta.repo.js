import { query } from "../db/pool.js";

export async function getMeta(key) {
  const r = await query("SELECT value FROM meta WHERE key=$1", [key]);
  return r.rows[0]?.value ?? null;
}

export async function setMeta(key, value) {
  await query(
    `
    INSERT INTO meta(key, value)
    VALUES ($1, $2)
    ON CONFLICT (key)
    DO UPDATE SET value=EXCLUDED.value
    `,
    [key, value]
  );
};
