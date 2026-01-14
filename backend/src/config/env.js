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

export const ENV = {
  PORT: Number(process.env.PORT ?? 5080),

  PGHOST: must("PGHOST", "localhost"),
  PGUSER: must("PGUSER", "postgres"),
  PGPASSWORD: must("PGPASSWORD"),
  PGDATABASE: must("PGDATABASE"),
  PGPORT: Number(process.env.PGPORT ?? 5432),

  POI_LIMIT: Number(process.env.POI_LIMIT ?? 1000),
};
