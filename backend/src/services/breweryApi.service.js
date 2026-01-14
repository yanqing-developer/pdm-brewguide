const BASE = "https://api.openbrewerydb.org/v1/breweries";

async function fetchWithTimeout(url, { timeoutMs = 10_000, retries = 2 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, { signal: ctrl.signal, headers: { "user-agent": "pdm-brewguide/1.0" } });
      clearTimeout(t);
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`OpenBrewery error: ${res.status} ${text.slice(0, 200)}`);
      }
      return res.json();
    } catch (e) {
      clearTimeout(t);
      if (attempt === retries) throw e;
    }
  }
}

async function fetchPage({ city = "berlin", perPage = 200, page = 1 }) {
  const url = new URL(BASE);
  url.searchParams.set("by_city", city);
  url.searchParams.set("per_page", String(perPage));
  url.searchParams.set("page", String(page));
  return fetchWithTimeout(url.toString());
}

export async function fetchAllBerlinBreweries({ maxPages = 10, perPage = 200 } = {}) {
  const all = [];
  for (let page = 1; page <= maxPages; page++) {
    const rows = await fetchPage({ city: "berlin", perPage, page });
    if (!Array.isArray(rows) || rows.length === 0) break;
    all.push(...rows);
    if (rows.length < perPage) break;
  }
  return all;
};
