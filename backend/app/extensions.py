"""PostgreSQL connection management.

A single `psycopg_pool.ConnectionPool` is created at app startup and a
connection is checked out per request, returned on teardown. Rows are
returned as dicts so callers can keep using `row["col"]` / `dict(row)`.
"""

import os
import logging

from flask import g, current_app
from psycopg_pool import ConnectionPool
from psycopg.rows import dict_row

log = logging.getLogger(__name__)

_pool: ConnectionPool | None = None


def init_pool(app):
    """Create the connection pool. Called once at app startup."""
    global _pool
    if _pool is not None:
        return
    _pool = ConnectionPool(
        conninfo=app.config["DATABASE_URL"],
        min_size=app.config.get("DB_POOL_MIN", 1),
        max_size=app.config.get("DB_POOL_MAX", 10),
        kwargs={"row_factory": dict_row},
        open=True,
    )


def get_db():
    """Return the request-scoped psycopg connection.

    The connection is checked out from the pool on first call within a
    request and returned on teardown via close_db().
    """
    if "db" not in g:
        if _pool is None:
            raise RuntimeError("DB pool not initialized — call init_pool(app) first")
        g.db = _pool.getconn()
    return g.db


def close_db(e=None):
    """Return the connection to the pool. Rollback on unhandled errors."""
    db = g.pop("db", None)
    if db is None:
        return
    try:
        if e is not None:
            db.rollback()
    except Exception:
        log.exception("rollback failed during teardown")
    try:
        _pool.putconn(db)
    except Exception:
        log.exception("putconn failed during teardown")


def init_db(app):
    """Run schema.sql against the DB. Idempotent — uses CREATE TABLE IF NOT EXISTS."""
    schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")
    with open(schema_path, "r") as f:
        schema_sql = f.read()
    with app.app_context():
        db = get_db()
        with db.cursor() as cur:
            cur.execute(schema_sql)
        db.commit()
        close_db()
