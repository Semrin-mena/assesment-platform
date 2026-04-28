"""Production WSGI entrypoint. Used by gunicorn / waitress."""

from app import create_app

app = create_app()
