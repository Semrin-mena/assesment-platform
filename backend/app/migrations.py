"""Idempotent schema migrations applied after schema.sql on every boot.

The previous SQLite migrations (`001_users_reviewer_role`, `002_review_cascade`,
`003_indexes`) performed table-rebuild dances that PostgreSQL doesn't need —
the final schema is now expressed directly in `schema.sql`. The runner is kept
so future Postgres-side migrations can be appended without re-plumbing.

Each migration is a callable taking the connection. The runner wraps each
migration in its own transaction and rolls back on failure.
"""

import logging

from app.extensions import get_db

log = logging.getLogger(__name__)


def _is_applied(db, name):
    row = db.execute(
        "SELECT 1 FROM schema_migrations WHERE name = %s", (name,)
    ).fetchone()
    return row is not None


def _mark_applied(db, name):
    db.execute("INSERT INTO schema_migrations (name) VALUES (%s)", (name,))


# Append future migrations as ("name", callable) pairs.
MIGRATIONS: list[tuple[str, callable]] = []


def run_migrations(app):
    if not MIGRATIONS:
        return
    with app.app_context():
        db = get_db()
        for name, fn in MIGRATIONS:
            if _is_applied(db, name):
                continue
            log.info("Applying migration %s", name)
            try:
                fn(db)
                _mark_applied(db, name)
                db.commit()
            except Exception:
                db.rollback()
                log.exception("Migration %s failed", name)
                raise
