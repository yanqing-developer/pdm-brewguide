import React from "react";

function formatDistance(m) {
  if (m == null) return null;
  const km = m / 1000;
  return km < 1 ? `${Math.round(m)} m` : `${km.toFixed(1)} km`;
}

export default function PlaceCard({ place, onSave, onDismiss, onSimilar }) {
  return (
    <div>
      <div className="place-title">
        <h3>{place.name || "(Unnamed brewery)"}</h3>
        <div className="small">
          {place.brewery_type ? <span className="badge">{place.brewery_type}</span> : null}
          {place.has_website ? <span className="badge">website</span> : null}
          {place.distance_m != null ? (
            <span className="badge">{formatDistance(place.distance_m)}</span>
          ) : null}
        </div>
      </div>

      <div className="small" style={{ marginTop: 6 }}>
        {place.explanation || "Recommended based on your preferences."}
      </div>

      {place.website_url ? (
        <div className="small" style={{ marginTop: 6 }}>
          <a href={place.website_url} target="_blank" rel="noreferrer">Visit site</a>
        </div>
      ) : null}

      <div className="actions">
        <button onClick={() => onSave(place.id)}>Save</button>
        <button className="secondary" onClick={() => onDismiss(place.id)}>Dismiss</button>
        <button className="secondary" onClick={() => onSimilar(place.id)}>Show similar</button>
      </div>

      <hr />
    </div>
  );
  
};
