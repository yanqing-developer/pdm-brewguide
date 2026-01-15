// src/config/env.js
import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ENV_PATH = path.resolve(__dirname, "../../.env");
console.log("[env] loading .env from:", ENV_PATH);

dotenv.config({ path: ENV_PATH, debug: true });

function must(name, fallback = null) {
  const v = process.env[name] ?? fallback;
  if (v === null || v === undefined || v === "") {
    throw new Error(`Missing env: ${name}`);
  }
  return v;
}

function num(name, fallback) {
  const v = process.env[name];
  const n = v === undefined ? Number(fallback) : Number(v);
  return Number.isFinite(n) ? n : Number(fallback);
}

export const ENV = {
  PORT: num("PORT", 5080),

  PGHOST: must("PGHOST", "localhost"),
  PGUSER: must("PGUSER", "postgres"),
  PGPASSWORD: must("PGPASSWORD"),
  PGDATABASE: must("PGDATABASE"),
  PGPORT: num("PGPORT", 5432),

  POI_LIMIT: num("POI_LIMIT", 1000),

  // Recommendation tuning
  REC_TOP_N: num("REC_TOP_N", 10),

  // Radius controls (backend authoritative)
  DEFAULT_RADIUS_KM: num("DEFAULT_RADIUS_KM", 8),
  MIN_RADIUS_KM: num("MIN_RADIUS_KM", 1),
  MAX_RADIUS_KM: num("MAX_RADIUS_KM", 80),

  // If hard-filter yields too few in-radius results, mix-in "unknown distance" items
  MIN_POOL_AFTER_FILTER: num("MIN_POOL_AFTER_FILTER", 5)
};
