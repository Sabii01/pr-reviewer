import { pool } from "./db.js";

export async function createReview({ repoFullName, prNumber, headSha }) {
  const result = await pool.query(
    `INSERT INTO reviews (repo_full_name, pr_number, head_sha)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [repoFullName, prNumber, headSha]
  );
  return result.rows[0].id;
}

export async function completeReview(reviewId, summary, findings) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    await client.query(
      `UPDATE reviews SET status = 'completed', summary = $1 WHERE id = $2`,
      [summary, reviewId]
    );

    for (const f of findings) {
      await client.query(
        `INSERT INTO findings
           (review_id, file, line, severity, category, message, suggestion)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [reviewId, f.file, f.line, f.severity, f.category, f.message, f.suggestion ?? null]
      );
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function failReview(reviewId) {
  await pool.query(`UPDATE reviews SET status = 'failed' WHERE id = $1`, [reviewId]);
}