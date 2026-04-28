"""Idempotent schema migrations applied after schema.sql on every boot.

Each migration is a callable that takes the connection and runs whatever
DDL/DML it needs. The runner wraps each migration in its own transaction
and rolls back if the migration raises, so a partial failure never leaves
the DB in a half-applied state.

Migrations that need to disable foreign keys (e.g. table rebuilds) must
manage that themselves — see _migration_001.
"""

import logging

from app.extensions import get_db

log = logging.getLogger(__name__)


def _is_applied(db, name):
    row = db.execute(
        "SELECT 1 FROM schema_migrations WHERE name = ?", (name,)
    ).fetchone()
    return row is not None


def _mark_applied(db, name):
    db.execute("INSERT INTO schema_migrations (name) VALUES (?)", (name,))


def _migration_001_users_reviewer_role(db):
    """Rebuild users table so role CHECK includes 'reviewer'.

    SQLite can't ALTER a CHECK constraint, so we follow the standard
    "12-step rebuild" pattern: copy rows to a new table, drop the old,
    rename the new. Foreign keys must be disabled during the rebuild
    because dependent tables reference users(id).
    """
    row = db.execute(
        "SELECT sql FROM sqlite_master WHERE type='table' AND name='users'"
    ).fetchone()
    if row and "'reviewer'" in row["sql"]:
        return  # already correct

    # PRAGMA foreign_keys can't be toggled inside a transaction, so we have to
    # commit any pending state, drop the runner's transaction, do the rebuild
    # in our own transaction, then restore FK enforcement.
    db.commit()
    db.execute("PRAGMA foreign_keys = OFF")
    try:
        db.execute("DROP TABLE IF EXISTS users_new")
        db.execute("BEGIN")
        db.execute(
            """
            CREATE TABLE users_new (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                username    TEXT    NOT NULL UNIQUE,
                email       TEXT    NOT NULL UNIQUE,
                password    TEXT    NOT NULL,
                role        TEXT    NOT NULL DEFAULT 'tasker' CHECK (role IN ('tasker', 'admin', 'reviewer')),
                created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
            )
            """
        )
        db.execute(
            """
            INSERT INTO users_new (id, username, email, password, role, created_at)
            SELECT id, username, email, password, role, created_at FROM users
            """
        )
        db.execute("DROP TABLE users")
        db.execute("ALTER TABLE users_new RENAME TO users")
        db.commit()
        bad = db.execute("PRAGMA foreign_key_check").fetchall()
        if bad:
            raise RuntimeError(f"foreign_key_check failed after migration: {list(bad)}")
    except Exception:
        db.rollback()
        raise
    finally:
        db.execute("PRAGMA foreign_keys = ON")


def _migration_002_review_cascade(db):
    """Make marlin_reviews CASCADE when its marlin_test is deleted.

    Existing schema only cascaded marlin_question_scores → marlin_reviews;
    deleting a marlin_test orphaned the review. Same rebuild pattern as 001.
    """
    row = db.execute(
        "SELECT sql FROM sqlite_master WHERE type='table' AND name='marlin_reviews'"
    ).fetchone()
    if row and "ON DELETE CASCADE" in row["sql"]:
        return

    db.commit()
    db.execute("PRAGMA foreign_keys = OFF")
    try:
        db.execute("DROP TABLE IF EXISTS marlin_reviews_new")
        db.execute("BEGIN")
        db.execute(
            """
            CREATE TABLE marlin_reviews_new (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                marlin_test_id  INTEGER NOT NULL UNIQUE REFERENCES marlin_tests(id) ON DELETE CASCADE,
                reviewer_id     INTEGER NOT NULL REFERENCES users(id),
                status          TEXT    NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted')),
                final_percent   REAL,
                submitted_at    TEXT,
                created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
                updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
            )
            """
        )
        db.execute(
            """
            INSERT INTO marlin_reviews_new (id, marlin_test_id, reviewer_id, status,
                                            final_percent, submitted_at, created_at, updated_at)
            SELECT id, marlin_test_id, reviewer_id, status,
                   final_percent, submitted_at, created_at, updated_at
            FROM marlin_reviews
            """
        )
        db.execute("DROP TABLE marlin_reviews")
        db.execute("ALTER TABLE marlin_reviews_new RENAME TO marlin_reviews")
        db.commit()
        bad = db.execute("PRAGMA foreign_key_check").fetchall()
        if bad:
            raise RuntimeError(f"foreign_key_check failed after migration: {list(bad)}")
    except Exception:
        db.rollback()
        raise
    finally:
        db.execute("PRAGMA foreign_keys = ON")


def _migration_003_indexes(db):
    """Add indexes on foreign keys, sort columns, and search columns."""
    statements = [
        "CREATE INDEX IF NOT EXISTS idx_users_username             ON users(username)",
        "CREATE INDEX IF NOT EXISTS idx_users_email                ON users(email)",
        "CREATE INDEX IF NOT EXISTS idx_prompts_user_id            ON prompts(user_id)",
        "CREATE INDEX IF NOT EXISTS idx_prompts_created_at         ON prompts(created_at)",
        "CREATE INDEX IF NOT EXISTS idx_responses_prompt_id        ON responses(prompt_id)",
        "CREATE INDEX IF NOT EXISTS idx_assessments_prompt_id      ON assessments(prompt_id)",
        "CREATE INDEX IF NOT EXISTS idx_marlin_tests_user_id       ON marlin_tests(user_id)",
        "CREATE INDEX IF NOT EXISTS idx_marlin_tests_created_at    ON marlin_tests(created_at)",
        "CREATE INDEX IF NOT EXISTS idx_marlin_reviews_test_id     ON marlin_reviews(marlin_test_id)",
        "CREATE INDEX IF NOT EXISTS idx_marlin_reviews_reviewer_id ON marlin_reviews(reviewer_id)",
        "CREATE INDEX IF NOT EXISTS idx_marlin_q_scores_review_id  ON marlin_question_scores(review_id)",
    ]
    for stmt in statements:
        db.execute(stmt)


MIGRATIONS = [
    ("001_users_reviewer_role", _migration_001_users_reviewer_role),
    ("002_review_cascade", _migration_002_review_cascade),
    ("003_indexes", _migration_003_indexes),
]


def run_migrations(app):
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
