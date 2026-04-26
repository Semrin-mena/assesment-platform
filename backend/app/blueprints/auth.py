from flask import Blueprint, jsonify, request, g

from app import models
from app.auth import generate_token, require_auth

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@bp.route("/register", methods=["POST"])
def register():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""

    if not username or len(username) < 3:
        return jsonify({"error": "Username must be at least 3 characters"}), 400
    if not email or "@" not in email:
        return jsonify({"error": "Valid email is required"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    # Check for duplicates
    if models.get_user_by_username(username):
        return jsonify({"error": "Username already taken"}), 409
    if models.get_user_by_email(email):
        return jsonify({"error": "Email already registered"}), 409

    user_id = models.create_user(username, email, password)
    token = generate_token(user_id)

    return jsonify({
        "token": token,
        "user": {
            "id": user_id,
            "username": username,
            "email": email,
            "role": "tasker",
        },
    }), 201


@bp.route("/login", methods=["POST"])
def login():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    user = models.authenticate_user(username, password)
    if not user:
        return jsonify({"error": "Invalid username or password"}), 401

    token = generate_token(user["id"])

    return jsonify({
        "token": token,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "role": user["role"],
        },
    })


@bp.route("/me", methods=["GET"])
@require_auth
def me():
    user = g.user
    return jsonify({
        "id": user["id"],
        "username": user["username"],
        "email": user["email"],
        "role": user["role"],
        "created_at": user["created_at"],
    })
