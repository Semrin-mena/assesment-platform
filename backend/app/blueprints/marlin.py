from flask import Blueprint, jsonify, request, g

from app import models
from app.auth import require_auth, require_admin
from app.pagination import get_page_params, get_search_query, paginated

bp = Blueprint("marlin", __name__, url_prefix="/api/marlin")


@bp.route("", methods=["POST"])
@require_auth
def create_marlin_test():
    data = request.get_json()
    if not data:
        return jsonify({"error": "Request body is required"}), 400

    prompt_text = data.get("prompt_text", "").strip()
    answers = data.get("answers", {})

    if not prompt_text:
        return jsonify({"error": "prompt_text is required"}), 400
    if not isinstance(answers, dict):
        return jsonify({"error": "answers must be an object"}), 400

    test_id = models.create_marlin_test(g.user["id"], prompt_text, answers)

    return jsonify({"id": test_id, "prompt_text": prompt_text, "answers": answers}), 201


@bp.route("", methods=["GET"])
@require_auth
def list_marlin_tests():
    limit, offset = get_page_params()
    q = get_search_query()
    user_id = g.user["id"]
    items = models.list_marlin_tests(user_id=user_id, limit=limit, offset=offset, q=q)
    total = models.count_marlin_tests(user_id=user_id, q=q)
    return jsonify(paginated(items, total, limit, offset))


@bp.route("/<int:test_id>", methods=["GET"])
@require_auth
def get_marlin_test(test_id):
    test = models.get_marlin_test(test_id)
    if not test:
        return jsonify({"error": "Marlin test not found"}), 404

    if g.user["role"] != "admin" and test["user_id"] != g.user["id"]:
        return jsonify({"error": "Not found"}), 404

    return jsonify(test)


# --- Admin ---

@bp.route("/admin/all", methods=["GET"])
@require_admin
def admin_list_marlin_tests():
    limit, offset = get_page_params()
    q = get_search_query()
    items = models.list_marlin_tests(user_id=None, limit=limit, offset=offset, q=q)
    total = models.count_marlin_tests(user_id=None, q=q)
    return jsonify(paginated(items, total, limit, offset))
