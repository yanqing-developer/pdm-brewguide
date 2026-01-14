import React from "react";
import PlaceCard from "./PlaceCard.jsx";

export default function ResultsList({
  stage,
  visibleResults,
  guidance,
  onSave,
  onDismiss,
  onSimilar
}) {
  return (
    <div className="card">
      <h2>Recommendations</h2>

      {stage ? <div className="small">Stage: {stage}</div> : null}
      {guidance?.nextQuestions?.length ? (
        <div className="small" style={{ marginTop: 6 }}>
          <span className="badge">Next</span> {guidance.nextQuestions[0]}
        </div>
      ) : null}

      <hr />

      {visibleResults.length === 0 ? (
        <div className="small">No results yet. Try refreshing breweries first.</div>
      ) : (
        visibleResults.map((p) => (
          <PlaceCard
            key={p.id}
            place={p}
            onSave={onSave}
            onDismiss={onDismiss}
            onSimilar={onSimilar}
          />
        ))
      )}
    </div>
  );
};
