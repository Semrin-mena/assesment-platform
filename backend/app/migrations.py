"""Idempotent schema migrations applied after schema.sql on every boot."""

from app.extensions import get_db


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

    # Commit any pending state — PRAGMA foreign_keys can't be toggled inside a tx.
    db.commit()
    db.execute("PRAGMA foreign_keys = OFF")
    try:
        # Drop a leftover users_new from a prior partial run, if any.
        db.execute("DROP TABLE IF EXISTS users_new")
        db.executescript(
            """
            CREATE TABLE users_new (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                username    TEXT    NOT NULL UNIQUE,
                email       TEXT    NOT NULL UNIQUE,
                password    TEXT    NOT NULL,
                role        TEXT    NOT NULL DEFAULT 'tasker' CHECK (role IN ('tasker', 'admin', 'reviewer')),
                created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
            );
            INSERT INTO users_new (id, username, email, password, role, created_at)
                SELECT id, username, email, password, role, created_at FROM users;
            DROP TABLE users;
            ALTER TABLE users_new RENAME TO users;
            """
        )
        db.commit()
        # Sanity check: make sure no dangling FK references were introduced.
        bad = db.execute("PRAGMA foreign_key_check").fetchall()
        if bad:
            raise RuntimeError(f"foreign_key_check failed after migration: {list(bad)}")
    finally:
        db.execute("PRAGMA foreign_keys = ON")


MIGRATIONS = [
    ("001_users_reviewer_role", _migration_001_users_reviewer_role),
]


def run_migrations(app):
    with app.app_context():
        db = get_db()
        for name, fn in MIGRATIONS:
            if _is_applied(db, name):
                continue
            fn(db)
            _mark_applied(db, name)
            db.commit()
