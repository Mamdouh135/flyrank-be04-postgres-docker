# FlyRank BE-04 — Tasks API with PostgreSQL + Docker

A RESTful CRUD API for managing tasks, now backed by **PostgreSQL running in Docker**.  
This is the Week 3 BE-04 assignment. The entire stack (app + database) starts with one command.

---

## What changed from BE-02 (SQLite)?

> **Only `db.js` changed. Every route in `index.js` is identical.**

This is the architecture proving itself:

| File | Changed? | Why |
|------|----------|-----|
| `index.js` | ❌ No | Routes only care about the repository interface |
| `db.js` | ✅ Yes | SQLite → PostgreSQL (the only storage-layer swap) |
| `init.sql` | ✅ New | Creates the table and seeds data (replaces in-code setup) |
| `docker-compose.yml` | ✅ New | Runs Postgres + app together |
| `.env` | ✅ New | Stores the connection string securely |

---

## Project structure

```
flyrank-be04-postgres-docker/
├── index.js            ← Express API (unchanged from BE-02)
├── db.js               ← PostgreSQL repository (the ONLY change)
├── init.sql            ← Table creation + seed data
├── Dockerfile          ← Builds the Node.js app image
├── docker-compose.yml  ← Starts app + Postgres together
├── .env                ← Secrets (gitignored)
├── .env.example        ← Template committed to Git
└── README.md
```

---

## How to start the project

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running

### 1. Copy the env file
```bash
cp .env.example .env
# The default values in .env work out of the box — no editing needed
```

### 2. Start everything with one command
```bash
docker compose up
```

This will:
1. Pull the `postgres:16-alpine` image
2. Start the Postgres container with a named volume (data persists)
3. Run `init.sql` automatically on first start (creates table + seeds 3 tasks)
4. Build and start the Node.js app container
5. Expose the API at **http://localhost:3000**

### Stop without deleting data
```bash
docker compose down        # stops containers, volume is preserved
```

### Destroy everything including data
```bash
docker compose down -v     # removes containers AND the volume
```

---

## Persistence proven

**How I checked:**

```bash
# 1. Start the stack
docker compose up -d

# 2. Create a new task
curl -X POST http://localhost:3000/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "This must survive a restart"}'
# → { "id": 4, "title": "This must survive a restart", ... }

# 3. Restart BOTH the app container AND the database container
docker compose restart

# 4. Fetch all tasks — the created task is still there
curl http://localhost:3000/tasks
# → [..., { "id": 4, "title": "This must survive a restart", ... }]
```

Data survives because Postgres stores its files in a **named Docker volume** (`postgres_data`),
not inside the container. Containers are disposable; volumes are not.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/tasks` | List all tasks |
| `GET` | `/tasks?search=milk` | Search by title (SQL `ILIKE`) |
| `GET` | `/tasks?done=true` | Filter by completion |
| `GET` | `/tasks?sort=title` | Sort alphabetically |
| `GET` | `/tasks/:id` | Get one task |
| `POST` | `/tasks` | Create a task |
| `PUT` | `/tasks/:id` | Update a task |
| `DELETE` | `/tasks/:id` | Delete a task |
| `GET` | `/stats` | Task counts via SQL `COUNT()` |

---

## Database schema

```sql
CREATE TABLE IF NOT EXISTS tasks (
  id         SERIAL PRIMARY KEY,
  title      TEXT        NOT NULL,
  done       BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

---

## Why PostgreSQL over SQLite?

| | SQLite (BE-02) | PostgreSQL (BE-04) |
|--|--|--|
| Setup | Zero — single file | Docker container |
| Concurrency | Limited | Full multi-client |
| Data types | Basic | Rich (JSONB, arrays, etc.) |
| Production use | Rarely | Industry standard |
| Networking | Local only | Any client can connect |

SQLite is perfect for local prototyping. PostgreSQL is what real production systems use.

---

## Why Docker?

- **Reproducible** — same Postgres version on every machine
- **Isolated** — doesn't pollute your system
- **One command** — `docker compose up` replaces a manual install
- **Volume = persistence** — data survives container restarts

---

## Assignment checklist

- [x] Postgres runs in Docker with a named volume
- [x] Whole stack starts with `docker compose up`
- [x] Connection string from `.env` (gitignored)
- [x] `.env.example` committed to Git
- [x] Table created with `init.sql`
- [x] Postgres repository replaced the SQLite one
- [x] Service and routes in `index.js` are **unchanged**
- [x] Persistence proven across app + container restart (documented above)
