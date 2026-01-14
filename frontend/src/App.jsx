import React, { useEffect, useMemo, useRef, useState } from "react";
import PreferencesForm from "./components/PreferencesForm.jsx";
import ResultsList from "./components/ResultsList.jsx";
import GuidancePanel from "./components/GuidancePanel.jsx";
import { apiGet, apiPost, openRecommendationsStream } from "./api.js";
import { loadLocalPrefs, saveLocalPrefs } from "./storage.js";

export default function App() {
  const [loading, setLoading] = useState(false);
  const [health, setHealth] = useState(null);
  const [availableTypes, setAvailableTypes] = useState([]);

  const [prefs, setPrefs] = useState(() => {
    const local = loadLocalPrefs();
    return {
      userLat: local?.userLat ?? null,
      userLon: local?.userLon ?? null,
      preferredTypes: local?.preferredTypes ?? [],
      nameKeywordsRaw: local?.nameKeywordsRaw ?? "",
      radiusKm: local?.radiusKm ?? 2,
      preferWebsite: local?.preferWebsite ?? false
    };
  });

  const [stage, setStage] = useState("");
  const [visibleResults, setVisibleResults] = useState([]);
  const [guidance, setGuidance] = useState(null);

  const streamCloseRef = useRef(null);

  const nameKeywords = useMemo(() => {
    return prefs.nameKeywordsRaw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  }, [prefs.nameKeywordsRaw]);

  useEffect(() => {
    saveLocalPrefs(prefs);
  }, [prefs]);

  async function refreshHealth() {
    const h = await apiGet("/api/health");
    setHealth(h);
  }

  async function refreshTypes() {
    const r = await apiGet("/api/breweries/types");
    setAvailableTypes(Array.isArray(r?.types) ? r.types : []);
  }

  useEffect(() => {
    refreshHealth().catch(() => {});
    refreshTypes().catch(() => setAvailableTypes([]));
  }, []);

  function closeStreamIfAny() {
    if (streamCloseRef.current) {
      try {
        streamCloseRef.current();
      } catch {}
      streamCloseRef.current = null;
    }
  }

  async function onRefreshBreweries() {
    setLoading(true);
    setStage("Fetching breweries from OpenBreweryDB and caching into Postgres...");
    try {
      const r = await apiPost("/api/admin/refresh-breweries", {});
      setStage(`Breweries refreshed. Inserted/Updated: ${r.insertedOrUpdated}`);
      await refreshHealth();
      await refreshTypes();
    } catch (e) {
      setStage(`Refresh failed (can still use previous data): ${e.message}`);
    } finally {
      setLoading(false);
    }
  }

  async function onRecommend() {
    closeStreamIfAny();

    setVisibleResults([]);
    setGuidance(null);

    setLoading(true);
    setStage("Saving memory (preferences)...");

    try {
      // Persist memory (demo-worthy)
      await apiPost("/api/memory", {
        preferredTypes: prefs.preferredTypes,
        nameKeywords,
        radiusKm: prefs.radiusKm,
        preferWebsite: prefs.preferWebsite
      });

      setStage("Streaming recommendations from server...");

      // TRUE streaming from backend via SSE
      streamCloseRef.current = openRecommendationsStream(
        {
          userLat: prefs.userLat,
          userLon: prefs.userLon,
          preferredTypes: prefs.preferredTypes,
          nameKeywords,
          radiusKm: prefs.radiusKm,
          preferWebsite: prefs.preferWebsite
        },
        {
          onStatus: (s) => {
            if (s?.phase) setStage(`Streaming: ${s.phase}...`);
          },
          onMeta: (m) => {
            setGuidance({
              nextQuestions: m.nextQuestions || [],
              suggestedActions: m.suggestedActions || []
            });
          },
          onItem: ({ item }) => {
            if (!item) return;
            setVisibleResults((prev) => [...prev, item]);
          },
          onDone: ({ count }) => {
            setStage(`Done. Received ${count ?? visibleResults.length} items.`);
            setLoading(false);
            refreshHealth().catch(() => {});
          },
          onError: (err) => {
            setStage(`Stream failed: ${err?.error || "unknown error"}`);
            setLoading(false);
          }
        }
      );
    } catch (e) {
      setStage(`Recommend failed: ${e.message}`);
      setLoading(false);
      refreshHealth().catch(() => {});
    }
  }

  async function onSave(breweryId) {
    try {
      await apiPost("/api/actions/save", { brewery_id: String(breweryId) });
      setStage("Saved. (Will influence next ranking via similarity boost)");
    } catch (e) {
      setStage(`Save failed: ${e.message}`);
    }
  }

  async function onDismiss(breweryId) {
    try {
      await apiPost("/api/actions/dismiss", { brewery_id: String(breweryId) });
      setVisibleResults((prev) => prev.filter((x) => x.id !== breweryId));
      setStage("Dismissed. (Will be excluded next time)");
    } catch (e) {
      setStage(`Dismiss failed: ${e.message}`);
    }
  }

  async function onSimilar(breweryId) {
    closeStreamIfAny();

    setLoading(true);
    setStage("Learning from your choice (fast adaptation)...");
    try {
      const r = await apiPost("/api/actions/similar", {
        brewery_id: String(breweryId),
        userLat: prefs.userLat,
        userLon: prefs.userLon
      });

      setGuidance({
        nextQuestions: r.nextQuestions || [],
        suggestedActions: r.suggestedActions || []
      });

      setVisibleResults(r.results || []);
      setStage(
        `Similar: learned type "${r?.seed?.brewery_type ?? "unknown"}" and refreshed recommendations.`
      );
    } catch (e) {
      setStage(`Similar failed: ${e.message}`);
    } finally {
      setLoading(false);
      refreshHealth().catch(() => {});
    }
  }

  useEffect(() => {
    return () => closeStreamIfAny();
  }, []);

  return (
    <>
      <div className="header">
        <div className="header-inner">
          <div className="brand">
            <h1>brewGuide</h1>
            <p>Berlin brewery recommender (OpenBreweryDB + Memory + True Streaming)</p>
          </div>
          <div className="small">
            {health ? (
              <>
                <span className="badge">Breweries: {health.breweryCount}</span>
                <span className="badge">Last refresh: {health.breweryLastRefresh}</span>
              </>
            ) : (
              <span className="badge">Loading health...</span>
            )}
          </div>
        </div>
      </div>

      <div className="container">
        <div className="grid">
          <div>
            <PreferencesForm
              prefs={prefs}
              setPrefs={setPrefs}
              availableTypes={availableTypes}
              onRefreshBreweries={onRefreshBreweries}
              onRecommend={onRecommend}
              loading={loading}
            />
            <GuidancePanel guidance={guidance} />
          </div>

          <ResultsList
            stage={stage}
            visibleResults={visibleResults}
            guidance={guidance}
            onSave={onSave}
            onDismiss={onDismiss}
            onSimilar={onSimilar}
          />
        </div>
      </div>
    </>
  );
}
