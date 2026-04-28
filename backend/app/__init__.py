import logging
import time
import uuid

from flask import Flask, g, jsonify, request
from flask_cors import CORS

from app.config import Config
from app.extensions import close_db, init_db
from app.migrations import run_migrations

log = logging.getLogger(__name__)


def _configure_logging():
    """Set up a single root logger with a structured-ish format."""
    if logging.getLogger().handlers:
        return  # Avoid duplicate handlers under gunicorn or test runners.
    logging.basicConfig(
        level=getattr(logging, Config.LOG_LEVEL, logging.INFO),
        format="%(asctime)s %(levelname)s %(name)s %(message)s",
    )


def create_app():
    _configure_logging()
    Config.validate()

    app = Flask(__name__)
    app.config.from_mapping(
        DATABASE_PATH=Config.DATABASE_PATH,
        OPENAI_API_KEY=Config.OPENAI_API_KEY,
        JWT_SECRET=Config.JWT_SECRET,
    )

    CORS(app, origins=Config.CORS_ORIGINS)
    app.teardown_appcontext(close_db)

    init_db(app)
    run_migrations(app)

    _register_request_logging(app)
    _register_error_handlers(app)
    _register_health(app)

    from app.blueprints import auth, prompts, assessments, admin, marlin, reviews
    app.register_blueprint(auth.bp)
    app.register_blueprint(prompts.bp)
    app.register_blueprint(assessments.bp)
    app.register_blueprint(admin.bp)
    app.register_blueprint(marlin.bp)
    app.register_blueprint(reviews.bp)

    return app


def _register_request_logging(app):
    @app.before_request
    def _start():
        g._req_id = uuid.uuid4().hex[:8]
        g._req_start = time.perf_counter()

    @app.after_request
    def _finish(response):
        try:
            duration_ms = int((time.perf_counter() - g._req_start) * 1000)
            log.info(
                "%s %s %s %s %dms",
                getattr(g, "_req_id", "-"),
                request.method,
                request.path,
                response.status_code,
                duration_ms,
            )
        except Exception:
            pass
        return response


def _register_error_handlers(app):
    @app.errorhandler(Exception)
    def _unhandled(err):
        # Flask's default error handler swallows the traceback in production.
        # Log it explicitly so we can find the cause in the logs.
        log.exception("Unhandled exception on %s %s", request.method, request.path)
        # Re-raise HTTPExceptions so Flask returns the right status code.
        from werkzeug.exceptions import HTTPException
        if isinstance(err, HTTPException):
            return err
        return jsonify({"error": "Internal server error"}), 500


def _register_health(app):
    @app.route("/api/health")
    def _health():
        return jsonify({"status": "ok"}), 200
