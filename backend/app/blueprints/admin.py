from flask import Blueprint, jsonify, request, g

from app import models
from app.auth import require_admin
from app.pagination import clamp_offset, get_page_params, get_search_query, paginated

VALID_ROLES = {"tasker", "admin", "reviewer"}

bp = Blueprint("admin", __name__, url_prefix="/api/admin")


@bp.route("/submissions", methods=["GET"])
@require_admin
def list_all_submissions():
    """List all prompts from all users — admin only."""
    limit, offset = get_page_params()
    q = get_search_query()
    total = models.count_prompts(user_id=None, q=q)
    offset = clamp_offset(offset, total, limit)
    items = models.list_prompts(user_id=None, limit=limit, offset=offset, q=q)
    return jsonify(paginated(items, total, limit, offset))


@bp.route("/submissions/<int:prompt_id>", methods=["GET"])
@require_admin
def get_submission(prompt_id):
    """Get a specific prompt with responses and assessment — admin only."""
    prompt = models.get_prompt(prompt_id)
    if not prompt:
        return jsonify({"error": "Prompt not found"}), 404

    prompt["responses"] = models.get_responses_for_prompt(prompt_id)
    prompt["assessment"] = models.get_assessment_by_prompt(prompt_id)

    # Attach the tasker username
    user = models.get_user_by_id(prompt["user_id"])
    prompt["username"] = user["username"] if user else "unknown"

    return jsonify(prompt)


@bp.route("/users", methods=["GET"])
@require_admin
def list_all_users():
    """List all registered users — admin only."""
    limit, offset = get_page_params()
    q = get_search_query()
    total = models.count_users(q=q)
    offset = clamp_offset(offset, total, limit)
    items = models.list_users(limit=limit, offset=offset, q=q)
    return jsonify(paginated(items, total, limit, offset))


@bp.route("/users", methods=["POST"])
@require_admin
def create_user():
    data = request.get_json() or {}
    username = (data.get("username") or "").strip()
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    role = (data.get("role") or "tasker").strip()

    if not username or len(username) < 3:
        return jsonify({"error": "Username must be at least 3 characters"}), 400
    if not email or "@" not in email:
        return jsonify({"error": "Valid email is required"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400
    if role not in VALID_ROLES:
        return jsonify({"error": f"Invalid role: {role}"}), 400
    if models.get_user_by_username(username):
        return jsonify({"error": "Username already taken"}), 409
    if models.get_user_by_email(email):
        return jsonify({"error": "Email already registered"}), 409

    user_id = models.create_user(username, email, password, role=role)
    return jsonify(models.get_user_by_id(user_id)), 201


@bp.route("/users/<int:user_id>", methods=["PATCH"])
@require_admin
def edit_user(user_id):
    target = models.get_user_by_id(user_id)
    if not target:
        return jsonify({"error": "User not found"}), 404

    data = request.get_json() or {}
    username = data.get("username")
    email = data.get("email")
    role = data.get("role")
    password = data.get("password")

    if username is not None:
        username = username.strip()
        if len(username) < 3:
            return jsonify({"error": "Username must be at least 3 characters"}), 400
        existing = models.get_user_by_username(username)
        if existing and existing["id"] != user_id:
            return jsonify({"error": "Username already taken"}), 409

    if email is not None:
        email = email.strip().lower()
        if "@" not in email:
            return jsonify({"error": "Valid email is required"}), 400
        existing = models.get_user_by_email(email)
        if existing and existing["id"] != user_id:
            return jsonify({"error": "Email already registered"}), 409

    if role is not None:
        if role not in VALID_ROLES:
            return jsonify({"error": f"Invalid role: {role}"}), 400
        # Don't let an admin demote themselves — easy way to lock yourself out.
        if user_id == g.user["id"] and role != "admin":
            return jsonify({"error": "You cannot change your own role"}), 400

    if password is not None and len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400

    models.update_user(user_id, username=username, email=email, role=role, password=password)
    return jsonify(models.get_user_by_id(user_id))


@bp.route("/users/<int:user_id>", methods=["DELETE"])
@require_admin
def remove_user(user_id):
    target = models.get_user_by_id(user_id)
    if not target:
        return jsonify({"error": "User not found"}), 404
    if user_id == g.user["id"]:
        return jsonify({"error": "You cannot delete your own account"}), 400
    if models.user_has_dependents(user_id):
        return jsonify({
            "error": "Cannot delete a user with submissions or reviews. Reassign or remove their data first.",
        }), 409
    models.delete_user(user_id)
    return jsonify({"ok": True})


@bp.route("/stats", methods=["GET"])
@require_admin
def get_stats():
    """Get platform-wide stats — admin only."""
    by_role = models.count_users_by_role()
    total_users = models.count_users()
    total_prompts = models.count_prompts(user_id=None)
    total_completed = models.count_completed_prompts()

    return jsonify({
        "total_users": total_users,
        "total_taskers": by_role.get("tasker", 0),
        "total_admins": by_role.get("admin", 0),
        "total_prompts": total_prompts,
        "total_completed": total_completed,
        "total_pending": total_prompts - total_completed,
    })
