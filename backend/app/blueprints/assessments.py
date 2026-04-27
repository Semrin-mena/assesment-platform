from flask import Blueprint, jsonify, request, g

from app import models
from app.auth import require_auth
from app.pagination import get_page_params, paginated

bp = Blueprint("assessments", __name__, url_prefix="/api/assessments")


@bp.route("", methods=["POST"])
@require_auth
def create_assessment():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    prompt_id = data.get("prompt_id")
    chosen_variant = data.get("chosen_variant")
    justification = data.get("justification", "").strip()

    if not prompt_id:
        return jsonify({"error": "prompt_id is required"}), 400
    if chosen_variant not in ("A", "B"):
        return jsonify({"error": "chosen_variant must be 'A' or 'B'"}), 400
    if not justification:
        return jsonify({"error": "justification is required"}), 400

    # Verify prompt exists and belongs to this user
    prompt = models.get_prompt(prompt_id)
    if not prompt:
        return jsonify({"error": "Prompt not found"}), 404
    if prompt["user_id"] != g.user["id"]:
        return jsonify({"error": "Not found"}), 404

    # Check for existing assessment
    existing = models.get_assessment_by_prompt(prompt_id)
    if existing:
        return jsonify({"error": "Assessment already exists for this prompt"}), 409

    assessment_id = models.create_assessment(prompt_id, chosen_variant, justification)

    return jsonify({
        "id": assessment_id,
        "prompt_id": prompt_id,
        "chosen_variant": chosen_variant,
        "justification": justification,
    }), 201


@bp.route("", methods=["GET"])
@require_auth
def list_assessments():
    # Taskers only see their own assessments
    limit, offset = get_page_params()
    user_id = g.user["id"]
    items = models.list_assessments(user_id=user_id, limit=limit, offset=offset)
    total = models.count_assessments(user_id=user_id)
    return jsonify(paginated(items, total, limit, offset))


@bp.route("/<int:assessment_id>", methods=["GET"])
@require_auth
def get_assessment(assessment_id):
    assessment = models.get_assessment(assessment_id)
    if not assessment:
        return jsonify({"error": "Assessment not found"}), 404

    # Taskers can only view their own; admins can view any
    if g.user["role"] != "admin" and assessment["user_id"] != g.user["id"]:
        return jsonify({"error": "Not found"}), 404

    assessment["responses"] = models.get_responses_for_prompt(assessment["prompt_id"])
    return jsonify(assessment)
