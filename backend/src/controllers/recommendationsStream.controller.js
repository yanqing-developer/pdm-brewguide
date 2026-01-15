import { runRecommendations } from "../services/recommendations.service.js";

function sseWrite(res, { event, data }) {
  if (event) res.write(`event: ${event}\n`);
  res.write(`data: ${JSON.stringify(data)}\n\n`);
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function streamRecommendations(req, res) {
  // SSE headers
  res.status(200);
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  let closed = false;
  req.on("close", () => {
    closed = true;
  });

  try {
    sseWrite(res, { event: "status", data: { phase: "start" } });

    // build recommendation input from query params
    const body = {
      preferredTypes: req.query.preferredTypes
        ? String(req.query.preferredTypes).split(",").filter(Boolean)
        : undefined,

      nameKeywords: req.query.nameKeywords
        ? String(req.query.nameKeywords).split(",").filter(Boolean)
        : undefined,

      radiusKm:
        req.query.radiusKm !== undefined
          ? Number(req.query.radiusKm)
          : undefined,

      preferWebsite:
        req.query.preferWebsite !== undefined
          ? String(req.query.preferWebsite) === "true"
          : undefined,

      userLat:
        req.query.userLat !== undefined
          ? Number(req.query.userLat)
          : undefined,

      userLon:
        req.query.userLon !== undefined
          ? Number(req.query.userLon)
          : undefined,

      // add：limit（control the number of feedback）
      limit:
        req.query.limit !== undefined
          ? Number(req.query.limit)
          : undefined,
    };

    sseWrite(res, { event: "status", data: { phase: "computing" } });

    const full = await runRecommendations(body);
    if (closed) return;

    // meta：tell you why this number”
    sseWrite(res, {
      event: "meta",
      data: {
        ok: true,
        usedMemory: full.usedMemory,
        nextQuestions: full.nextQuestions,
        suggestedActions: full.suggestedActions,

        // add a allnumbe（to slove always 10）
        topN: full.topN,
        totalScored: full.totalScored,
        totalReturned: full.totalReturned,
      },
    });

    // stream items one by one
    for (let i = 0; i < full.results.length; i++) {
      if (closed) return;

      sseWrite(res, {
        event: "item",
        data: {
          index: i,
          item: full.results[i],
        },
      });

      // purely for visual streaming effect
      await sleep(120);
    }

    if (closed) return;
    sseWrite(res, {
      event: "done",
      data: { count: full.results.length },
    });
    res.end();
  } catch (e) {
    if (!closed) {
      sseWrite(res, {
        event: "error",
        data: { ok: false, error: e?.message || "stream error" },
      });
      res.end();
    }
  }
}
