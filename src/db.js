import pg from "pg";
import {config} from "./config.js";

export const pool = new pg.Pool({
    connectionString: config.databaseURL,
});

export async function testConnection() {
  const result = await pool.query("SELECT NOW()");
  console.log("Database connected at:", result.rows[0].now);
}