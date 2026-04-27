import functools
from datetime import datetime, timedelta, timezone

import jwt
from flask import request, jsonify, g, current_app

from app import models


def generate_token(user_id):
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, current_app.config["JWT_SECRET"], algorithm="HS256")


def decode_token(token):
    try:
        payload = jwt.decode(token, current_app.config["JWT_SECRET"], algorithms=["HS256"])
        return payload["user_id"]
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return None


def get_current_user():
    """Extract and validate the user from the Authorization header."""
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    token = auth_header[7:]
    user_id = decode_token(token)
    if not user_id:
        return None
    return models.get_user_by_id(user_id)


def require_auth(f):
    """Decorator that requires a valid JWT token."""
    @functools.wraps(f)
    def wrapper(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({"error": "Authentication required"}), 401
        g.user = user
        return f(*args, **kwargs)
    return wrapper


def require_admin(f):
    """Decorator that requires the user to be an admin."""
    @functools.wraps(f)
    def wrapper(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({"error": "Authentication required"}), 401
        if user["role"] != "admin":
            return jsonify({"error": "Admin access required"}), 403
        g.user = user
        return f(*args, **kwargs)
    return wrapper


def require_reviewer(f):
    """Decorator that requires the user to be a reviewer.

    Admins do NOT pass this gate — review work is reviewer-only by spec.
    """
    @functools.wraps(f)
    def wrapper(*args, **kwargs):
        user = get_current_user()
        if not user:
            return jsonify({"error": "Authentication required"}), 401
        if user["role"] != "reviewer":
            return jsonify({"error": "Reviewer access required"}), 403
        g.user = user
        return f(*args, **kwargs)
    return wrapper
