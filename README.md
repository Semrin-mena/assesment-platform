# Assessment Platform

Internal evaluation platform with three roles:

- **Tasker** — submits Marlin Tests (long-form Q&A on AI model behaviour) and Code Comparisons.
- **Reviewer** — scores Marlin Test submissions; multiple-choice questions are auto-graded with reviewer override.
- **Admin** — manages users (CRUD + role assignment) and reads submitted reviews for QA.

Stack: **Flask + SQLite** (backend) · **Next.js 16 + React 19 + Tailwind v4** (frontend).

---

## Local development

### Backend

```bash
cd backend
python -m venv venv
. venv/Scripts/activate         # Windows
# . venv/bin/activate            # macOS/Linux
pip install -r requirements.txt
cp .env.example .env             # then fill in OPENAI_API_KEY
python run.py                    # http://localhost:5000
```

The dev server runs Flask in debug mode. It will refuse to start when `FLASK_ENV=production` — use a real WSGI server instead (see below).

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local       # set NEXT_PUBLIC_API_URL=http://localhost:5000
npm run dev                      # http://localhost:3000
```

### First admin

The DB starts empty. Register one user via `/register` (creates a tasker), then promote them to `admin` directly in SQLite:

```bash
sqlite3 backend/instance/database.db "UPDATE users SET role='admin' WHERE id=1;"
```

From then on, use the admin Users tab to create reviewers and additional accounts.

---

## Production deployment

### Required environment variables

**Backend** — set on the host (never commit):

| Variable          | Purpose                                                                   |
| ----------------- | ------------------------------------------------------------------------- |
| `FLASK_ENV`       | Must be `production`. Triggers strict config validation on startup.       |
| `JWT_SECRET`      | Random ≥32-char string. Generate: `python -c "import secrets; print(secrets.token_urlsafe(48))"`. |
| `OPENAI_API_KEY`  | API key for `gpt-4o`.                                                     |
| `CORS_ORIGINS`    | Comma-separated frontend origins, e.g. `https://app.example.com`.         |
| `DATABASE_PATH`   | Absolute path on a persistent volume, e.g. `/var/data/database.db`.       |
| `LOG_LEVEL`       | Optional. `INFO` (default), `WARNING`, `DEBUG`.                           |

`Config.validate()` runs on app boot and refuses to start production if any of `JWT_SECRET`, `OPENAI_API_KEY`, or `CORS_ORIGINS` are missing/insecure.

**Frontend** — set at *build* time (Next.js bakes them into the bundle):

| Variable               | Purpose                                                |
| ---------------------- | ------------------------------------------------------ |
| `NEXT_PUBLIC_API_URL`  | Backend base URL, e.g. `https://api.example.com`.      |

### Run the backend with a real WSGI server

The Flask dev server (`python run.py`) is for local development only.

**Linux / macOS:**

```bash
gunicorn -w 4 -b 0.0.0.0:5000 wsgi:app
```

**Windows:**

```bash
waitress-serve --listen=0.0.0.0:5000 wsgi:app
```

Behind a reverse proxy (nginx, Caddy, or your platform's load balancer) terminate TLS and forward to port 5000.

### Run the frontend

```bash
cd frontend
NEXT_PUBLIC_API_URL=https://api.example.com npm run build
npm start
```

Or deploy to Vercel/Netlify with `NEXT_PUBLIC_API_URL` set as an environment variable in their dashboard.

### Healthcheck

The backend exposes `GET /api/health` returning `{"status":"ok"}` for load balancer probes.

### Database

SQLite is fine for a small private deployment (≤ ~20 concurrent writers). The DB file lives at `DATABASE_PATH` and must be on a **persistent volume** — losing the file means losing every user, prompt, and review. Schema migrations run automatically on every boot via [backend/app/migrations.py](backend/app/migrations.py).

For higher concurrency, plan a Postgres migration. As a stopgap, enable WAL mode:

```bash
sqlite3 path/to/database.db "PRAGMA journal_mode=WAL;"
```

### Logs

Backend logs go to stdout in the format `<timestamp> <level> <logger> <message>`. Each request logs as `<req_id> <METHOD> <PATH> <STATUS> <LATENCY_MS>`. Capture stdout to your log aggregator.

---

## Repo layout

```
backend/
  app/
    blueprints/     # Flask routes (auth, prompts, assessments, marlin, reviews, admin)
    services/       # marlin_grader (auto-grading rules + answer key)
    config.py       # env-driven config + validate()
    migrations.py   # idempotent schema migrations
    models.py       # all DB queries
    pagination.py   # ?limit/?offset/?q + clamp helpers
    schema.sql      # baseline schema for fresh installs
  run.py            # local dev entrypoint (debug Flask server)
  wsgi.py           # production WSGI entrypoint (gunicorn/waitress)

frontend/
  src/
    app/            # Next.js App Router pages
      admin/        # admin dashboard (gated by role layout)
      reviewer/     # review queue + review page (gated by role layout)
      marlin-test/  # tasker test creation + read-only view
      assessments/  # legacy code-comparison flow (currently disabled)
    components/     # AuthGuard, Pagination, UserFormModal, etc.
    lib/            # api.ts (fetch wrapper + 401 auto-logout) + auth-context
    types/          # shared TS types
```

## Auto-grading rules

`backend/app/services/marlin_grader.py` is the single source of truth:

- 12 multiple-choice questions auto-graded on a 0..7 scale + N/A.
- **Exact match** → 1.0
- **Off-by-one across the A/B midline** (`a_barely_better` ↔ `b_barely_better`) → 0.75
- **Off-by-one elsewhere** → 0.5
- **Anything further** → 0.0
- 8 free-text questions are not auto-graded; reviewer enters score manually.
- Question weights: `cq13` (overall preference) ×2, `cq14` (detailed justification) ×3, all others ×1. Total weight = 23.
- Reviewers can override any per-question score. The final percent is `Σ(score × weight) / Σ(weight) × 100`.

## Notable design decisions

- **One review per Marlin Test.** Enforced by `UNIQUE(marlin_test_id)` on `marlin_reviews`. The first reviewer to open a test claims it; only that reviewer can edit. Submitted reviews are immutable.
- **Admins can read but not write reviews.** They use the same review page in read-only mode.
- **User deletion is blocked** when the user owns prompts, marlin tests, or reviews. There's no soft-delete yet — admins must reassign or remove dependent rows first.
- **Public `/api/auth/register` is currently open** — anyone can self-register as a tasker. Lock this down before public deploy if that's not the intended model.
