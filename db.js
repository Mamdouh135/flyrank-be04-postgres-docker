// db.js — Postgres repository (the ONLY file that changed from BE-02)
// Uses the `pg` library (node-postgres) to talk to a PostgreSQL database.
// The rest of the app (routes, service logic) is identical to BE-02.

const { Pool } = require("pg");
require("dotenv").config();

// Pool manages multiple reusable connections automatically.
// It reads DATABASE_URL from .env
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // When running inside Docker, give Postgres time to start up
  connectionTimeoutMillis: 5000,
});

// ── Repository — every method is the same "interface" as BE-02's SQLite one ──

/**
 * Return every task, with optional filters.
 * @param {{ search?: string, done?: boolean|null, sort?: string }} opts
 */
async function getAllTasks({ search, done, sort } = {}) {
  const conditions = [];
  const params = [];
  let idx = 1;

  if (search) {
    conditions.push(`title ILIKE $${idx++}`);   // ILIKE = case-insensitive LIKE in Postgres
    params.push(`%${search}%`);
  }

  if (done === true) {
    conditions.push(`done = TRUE`);
  } else if (done === false) {
    conditions.push(`done = FALSE`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  const order = sort === "title" ? "ORDER BY title ASC" : "ORDER BY id ASC";

  const { rows } = await pool.query(
    `SELECT * FROM tasks ${where} ${order}`,
    params
  );
  return rows;
}

/**
 * Return one task by id, or null if not found.
 */
async function getTaskById(id) {
  const { rows } = await pool.query("SELECT * FROM tasks WHERE id = $1", [id]);
  return rows[0] ?? null;
}

/**
 * Insert a new task. Returns the created row.
 */
async function createTask(title, done = false) {
  const { rows } = await pool.query(
    "INSERT INTO tasks (title, done) VALUES ($1, $2) RETURNING *",
    [title, done]
  );
  return rows[0];
}

/**
 * Update an existing task. Returns the updated row, or null if not found.
 */
async function updateTask(id, { title, done }) {
  const { rows } = await pool.query(
    `UPDATE tasks
        SET title = $1, done = $2, updated_at = NOW()
      WHERE id = $3
  RETURNING *`,
    [title, done, id]
  );
  return rows[0] ?? null;
}

/**
 * Delete a task by id. Returns true if deleted, false if not found.
 */
async function deleteTask(id) {
  const { rowCount } = await pool.query("DELETE FROM tasks WHERE id = $1", [id]);
  return rowCount > 0;
}

/**
 * Return task statistics using SQL COUNT().
 */
async function getStats() {
  const { rows } = await pool.query(`
    SELECT
      COUNT(*)                        AS total,
      COUNT(*) FILTER (WHERE done)    AS done,
      COUNT(*) FILTER (WHERE NOT done) AS pending
    FROM tasks
  `);
  // Postgres returns COUNT as strings — convert to numbers
  return {
    total:   Number(rows[0].total),
    done:    Number(rows[0].done),
    pending: Number(rows[0].pending),
  };
}

module.exports = { getAllTasks, getTaskById, createTask, updateTask, deleteTask, getStats };
