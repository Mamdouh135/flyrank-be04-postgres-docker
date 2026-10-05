// index.js — Express API (identical routes to BE-02, only db.js changed)
require("dotenv").config();

const express = require("express");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ── GET /tasks ────────────────────────────────────────────────────────────────
app.get("/tasks", async (req, res) => {
  const { search, done, sort } = req.query;

  // Convert query string "true"/"false" → boolean / null
  const doneFilter =
    done === "true" ? true : done === "false" ? false : undefined;

  const tasks = await db.getAllTasks({ search, done: doneFilter, sort });
  res.json(tasks);
});

// ── GET /tasks/:id ────────────────────────────────────────────────────────────
app.get("/tasks/:id", async (req, res) => {
  const task = await db.getTaskById(req.params.id);
  if (!task) return res.status(404).json({ error: "Task not found" });
  res.json(task);
});

// ── POST /tasks ───────────────────────────────────────────────────────────────
app.post("/tasks", async (req, res) => {
  const { title, done } = req.body;
  if (!title || typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({ error: "title is required" });
  }
  const task = await db.createTask(title.trim(), done ?? false);
  res.status(201).json(task);
});

// ── PUT /tasks/:id ────────────────────────────────────────────────────────────
app.put("/tasks/:id", async (req, res) => {
  const existing = await db.getTaskById(req.params.id);
  if (!existing) return res.status(404).json({ error: "Task not found" });

  const title = req.body.title !== undefined ? req.body.title : existing.title;
  const done  = req.body.done  !== undefined ? req.body.done  : existing.done;

  if (typeof title !== "string" || title.trim() === "") {
    return res.status(400).json({ error: "title must be a non-empty string" });
  }

  const task = await db.updateTask(req.params.id, { title: title.trim(), done });
  res.json(task);
});

// ── DELETE /tasks/:id ─────────────────────────────────────────────────────────
app.delete("/tasks/:id", async (req, res) => {
  const deleted = await db.deleteTask(req.params.id);
  if (!deleted) return res.status(404).json({ error: "Task not found" });
  res.json({ message: `Task ${req.params.id} deleted successfully` });
});

// ── GET /stats ────────────────────────────────────────────────────────────────
app.get("/stats", async (req, res) => {
  const stats = await db.getStats();
  res.json(stats);
});

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    message: "Tasks API is running 🚀  (Postgres backend)",
    endpoints: [
      "GET    /tasks",
      "GET    /tasks?search=<text>&done=true|false&sort=title",
      "GET    /tasks/:id",
      "POST   /tasks",
      "PUT    /tasks/:id",
      "DELETE /tasks/:id",
      "GET    /stats",
    ],
  });
});

app.listen(PORT, () =>
  console.log(`✅  Server running at http://localhost:${PORT}`)
);
