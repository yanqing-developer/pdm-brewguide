import React from "react";

export default function PreferencesForm({
  prefs,
  setPrefs,
  availableTypes = [],
  onRefreshBreweries,
  onRecommend,
  loading
}) {
  const toggleType = (t) => {
    const key = String(t).toLowerCase();
    const next = new Set((prefs.preferredTypes || []).map((x) => String(x).toLowerCase()));
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setPrefs({ ...prefs, preferredTypes: Array.from(next) });
  };

  const toggleWebsite = () => setPrefs({ ...prefs, preferWebsite: !prefs.preferWebsite });

  return (
    <div className="card">
      <h2>Preferences (Breweries)</h2>

      <div className="row">
        <div style={{ flex: 1 }}>
          <label>Latitude (optional)</label>
          <input
            type="number"
            value={prefs.userLat ?? ""}
            onChange={(e) =>
              setPrefs({
                ...prefs,
                userLat: e.target.value === "" ? null : Number(e.target.value)
              })
            }
            placeholder="e.g. 52.5200"
          />
        </div>

        <div style={{ flex: 1 }}>
          <label>Longitude (optional)</label>
          <input
            type="number"
            value={prefs.userLon ?? ""}
            onChange={(e) =>
              setPrefs({
                ...prefs,
                userLon: e.target.value === "" ? null : Number(e.target.value)
              })
            }
            placeholder="e.g. 13.4050"
          />
        </div>
      </div>

      <div style={{ marginTop: 10 }}>
        <label>Brewery types</label>

        {Array.isArray(availableTypes) && availableTypes.length > 0 ? (
          <div style={{ marginTop: 6 }}>
            {availableTypes.map((t) => {
              const key = String(t).toLowerCase();
              return (
                <div className="checkbox" key={key}>
                  <input
                    type="checkbox"
                    checked={(prefs.preferredTypes || []).map((x) => String(x).toLowerCase()).includes(key)}
                    onChange={() => toggleType(key)}
                  />
                  <span>{key}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="small" style={{ marginTop: 6 }}>
            No types loaded yet. Click “Refresh Breweries” first.
          </div>
        )}
      </div>

      <div style={{ marginTop: 10 }}>
        <label>Name keywords (comma separated, optional)</label>
        <input
          type="text"
          value={prefs.nameKeywordsRaw}
          onChange={(e) => setPrefs({ ...prefs, nameKeywordsRaw: e.target.value })}
          placeholder='e.g. "kindl", "spree", "ale"'
        />
      </div>

      <div style={{ marginTop: 10 }}>
        <label>Radius (km)</label>
        <input
          type="number"
          value={prefs.radiusKm}
          onChange={(e) => setPrefs({ ...prefs, radiusKm: Number(e.target.value) })}
          min={0}
          max={20}
          step={0.5}
        />
      </div>

      <div style={{ marginTop: 10 }} className="checkbox">
        <input type="checkbox" checked={prefs.preferWebsite} onChange={toggleWebsite} />
        <span>Prefer listings with website</span>
      </div>

      <div className="actions" style={{ marginTop: 12 }}>
        <button className="secondary" onClick={onRefreshBreweries} disabled={loading}>
          Refresh Breweries (OpenBreweryDB → Postgres)
        </button>
        <button onClick={onRecommend} disabled={loading}>
          Get Recommendations
        </button>
      </div>

      <div className="small" style={{ marginTop: 10 }}>
        If you do not set location, distance will not be used in scoring.
      </div>
    </div>
  );
};
