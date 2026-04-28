"""Local development entrypoint.

For production, use a real WSGI server with `wsgi:app` — gunicorn on Linux
or waitress on Windows. See README for the deployment runbook.
"""

from app import create_app
from app.config import Config

app = create_app()


if __name__ == "__main__":
    if Config.is_production():
        raise SystemExit(
            "Refusing to start the Flask dev server in production. "
            "Use `gunicorn wsgi:app` (Linux) or `waitress-serve --listen=0.0.0.0:5000 wsgi:app` (Windows)."
        )
    app.run(debug=True, port=5000)
