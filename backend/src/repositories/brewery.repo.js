import { query } from "../db/pool.js";

export async function countBreweries() {
  const r = await query('SELECT COUNT(*)::int AS c FROM brewery');
  return r.rows[0].c;
}

export async function upsertBrewery(b) {
  const sql = `
    INSERT INTO brewery
    (id, name, brewery_type, address_1, city, state_province, postal_code, country, longitude, latitude, phone, website_url, updated_at)
    VALUES
    ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,NOW())
    ON CONFLICT (id)
    DO UPDATE SET
      name=EXCLUDED.name,
      brewery_type=EXCLUDED.brewery_type,
      address_1=EXCLUDED.address_1,
      city=EXCLUDED.city,
      state_province=EXCLUDED.state_province,
      postal_code=EXCLUDED.postal_code,
      country=EXCLUDED.country,
      longitude=EXCLUDED.longitude,
      latitude=EXCLUDED.latitude,
      phone=EXCLUDED.phone,
      website_url=EXCLUDED.website_url,
      updated_at=NOW()
  `;

  await query(sql, [
    b.id, b.name, b.brewery_type, b.address_1, b.city, b.state_province,
    b.postal_code, b.country, b.longitude, b.latitude, b.phone, b.website_url
  ]);
}

export async function getBreweryById(id) {
  const r = await query("SELECT * FROM brewery WHERE id=$1", [id]);
  return r.rows[0] ?? null;
}

export async function listBerlinBreweriesByTypes(typesLower = []) {
  let sql = `
    SELECT *
    FROM brewery
    WHERE 1=1
  `;
  const params = [];

  if (Array.isArray(typesLower)) {
    const clean = typesLower
      .map((x) => String(x).trim().toLowerCase())
      .filter(Boolean);

    if (clean.length > 0) {
      params.push(clean);
      sql += ` AND brewery_type = ANY($${params.length}::text[])`;
    }
  }

  sql += " ORDER BY updated_at DESC LIMIT 5000";

  const r = await query(sql, params);
  return r.rows;
}

export async function getBreweryTypesByIds(ids) {
  if (!ids || ids.length === 0) return [];
  const placeholders = ids.map((_, i) => `$${i + 1}`).join(",");
  const r = await query(`SELECT brewery_type FROM brewery WHERE id IN (${placeholders})`, ids);
  return r.rows.map(x => x.brewery_type).filter(Boolean);
};

export async function listBreweryTypes() {
  const r = await query(`
    SELECT DISTINCT brewery_type
    FROM brewery
    WHERE brewery_type IS NOT NULL AND brewery_type <> ''
    ORDER BY brewery_type
  `);
  return r.rows.map(x => x.brewery_type);
}
