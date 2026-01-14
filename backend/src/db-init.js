import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { query } from "./db/pool.js";

const __filename= fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function init() {
  const schemaPath = path.join(__dirname, "sql", "schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf-8");
  await query(sql);
  console.log("[db:init] OK");
}

async function reset() {
  await query("DROP TABLE IF EXISTS user_action");
  await query("DROP TABLE IF EXISTS user_memory");
  await query("DROP TABLE IF EXISTS brewery");
  await query("DROP TABLE IF EXISTS meta");
  await init();
  console.log("[db:reset] OK");
}

const cmd = process.argv[2];
if (cmd === "init") {
  init().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
} else if (cmd === "reset") {
  reset().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
} else {
  console.log("Usage: node src/db-init.js init|reset");
  process.exit(1);
};
