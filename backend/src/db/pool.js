import pg from "pg";
import { ENV } from "../config/env.js";

const { Pool } = pg;

export const pool = new Pool({
  host: ENV.PGHOST,
  user: ENV.PGUSER,
  password: ENV.PGPASSWORD,
  database: ENV.PGDATABASE,
  port: ENV.PGPORT
});

export async function query(text, params) {
  return pool.query(text, params);
};