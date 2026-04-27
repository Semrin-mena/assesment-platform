from flask import Blueprint, jsonify, request, g

from app import models
from app.auth import require_auth
from app.pagination import get_page_params, get_search_query, paginated
from app.services.llm_service import generate_pair

bp = Blueprint("prompts", __name__, url_prefix="/api/prompts")


@bp.route("", methods=["POST"])
@require_auth
def create_prompt():
    data = request.get_json()
    if not data or not data.get("prompt_text", "").strip():
        return jsonify({"error": "prompt_text is required"}), 400

    prompt_text = data["prompt_text"].strip()

    # Save the prompt scoped to the current user
    prompt_id = models.create_prompt(g.user["id"], prompt_text)

    # Generate two LLM responses
    try:
        pair = generate_pair(prompt_text)
    except Exception as e:
        return jsonify({"error": f"LLM generation failed: {str(e)}"}), 502

    # Save both responses
    responses = {}
    for variant in ("A", "B"):
        resp_id = models.create_response(
            prompt_id=prompt_id,
            variant=variant,
            response_text=pair[variant]["text"],
            model_config=pair[variant]["config"],
        )
        responses[variant] = {
            "id": resp_id,
            "variant": variant,
            "response_text": pair[variant]["text"],
            "model_config": pair[variant]["config"],
        }

    return jsonify({"prompt_id": prompt_id, "responses": responses}), 201


@bp.route("", methods=["GET"])
@require_auth
def list_prompts():
    # Taskers only see their own prompts
    limit, offset = get_page_params()
    q = get_search_query()
    user_id = g.user["id"]
    items = models.list_prompts(user_id=user_id, limit=limit, offset=offset, q=q)
    total = models.count_prompts(user_id=user_id, q=q)
    return jsonify(paginated(items, total, limit, offset))


@bp.route("/<int:prompt_id>", methods=["GET"])
@require_auth
def get_prompt(prompt_id):
    prompt = models.get_prompt(prompt_id)
    if not prompt:
        return jsonify({"error": "Prompt not found"}), 404

    # Taskers can only view their own prompts; admins can view any
    if g.user["role"] != "admin" and prompt["user_id"] != g.user["id"]:
        return jsonify({"error": "Not found"}), 404

    prompt["responses"] = models.get_responses_for_prompt(prompt_id)
    prompt["assessment"] = models.get_assessment_by_prompt(prompt_id)
    return jsonify(prompt)
