import { runRecommendations } from "./recommendations.service.js";

function sseWrite(res, { event, data }) {
  if (event) res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

export async function streamRecommendations(req, res) {
  // SSE headers
  res.status(200);
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  // allow client to close
  let closed = false;
  req.on("close", () => { closed = true; });

  try {
    sseWrite(res, { event: "status", data: { phase: "start" } });

    // We use query parameters (GET) OR allow JSON-ish via a "q" param.
    const body = {
      preferredTypes: req.query.preferredTypes ? String(req.query.preferredTypes).split(",") : undefined,
      nameKeywords: req.query.nameKeywords ? String(req.query.nameKeywords).split(",") : undefined,
      radiusKm: req.query.radiusKm ? Number(req.query.radiusKm) : undefined,
      preferWebsite: req.query.preferWebsite ? String(req.query.preferWebsite) === "true" : undefined,
      userLat: req.query.userLat ? Number(req.query.userLat) : undefined,
      userLon: req.query.userLon ? Number(req.query.userLon) : undefined
    };

    sseWrite(res, { event: "status", data: { phase: "computing" } });

    const full = await runRecommendations(body);

    if (closed) return;

    // send metadata first
    sseWrite(res, {
      event: "meta",
      data: {
        ok: true,
        usedMemory: full.usedMemory,
        nextQuestions: full.nextQuestions,
        suggestedActions: full.suggestedActions
      }
    });

    // incremental items
    for (let i = 0; i < full.results.length; i++) {
      if (closed) return;
      sseWrite(res, { event: "item", data: { index: i, item: full.results[i] } });

      // tiny delay to make streaming visually obvious (remove if you want)
      await sleep(120);
    }

    if (closed) return;
    sseWrite(res, { event: "done", data: { count: full.results.length } });
    res.end();
  } catch (e) {
    if (!closed) {
      sseWrite(res, { event: "error", data: { ok: false, error: e.message || "stream error" } });
      res.end();
    }
  }
};
