from flask import Blueprint, jsonify

from app import models
from app.auth import require_admin

bp = Blueprint("admin", __name__, url_prefix="/api/admin")


@bp.route("/submissions", methods=["GET"])
@require_admin
def list_all_submissions():
    """List all prompts from all users — admin only."""
    prompts = models.list_prompts(user_id=None)
    return jsonify(prompts)


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
    users = models.list_users()
    return jsonify(users)


@bp.route("/stats", methods=["GET"])
@require_admin
def get_stats():
    """Get platform-wide stats — admin only."""
    users = models.list_users()
    all_prompts = models.list_prompts(user_id=None)
    completed = [p for p in all_prompts if p["has_assessment"]]

    return jsonify({
        "total_users": len(users),
        "total_taskers": len([u for u in users if u["role"] == "tasker"]),
        "total_admins": len([u for u in users if u["role"] == "admin"]),
        "total_prompts": len(all_prompts),
        "total_completed": len(completed),
        "total_pending": len(all_prompts) - len(completed),
    })
