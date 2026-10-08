import { readFile } from "node:fs/promises";
import { pool } from "./db.js";

async function migrate() {
  const sql = await readFile(new URL("../sql/schema.sql", import.meta.url), "utf8");
  await pool.query(sql);
  console.log("Migration complete: tables are ready");
  await pool.end();
}

migrate().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});