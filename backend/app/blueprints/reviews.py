from flask import Blueprint, jsonify, request, g

from app import models
from app.auth import require_auth, require_reviewer
from app.pagination import get_page_params, get_search_query, paginated
from app.services import marlin_grader

bp = Blueprint("reviews", __name__, url_prefix="/api/reviews")


@bp.route("/queue", methods=["GET"])
@require_reviewer
def review_queue():
    """List marlin tests for review. ?status=pending|reviewed (default: pending)."""
    limit, offset = get_page_params()
    q = get_search_query()
    status = request.args.get("status", "pending")
    if status not in ("pending", "reviewed"):
        status = "pending"

    items = models.list_review_queue(
        reviewer_id=g.user["id"], status=status, limit=limit, offset=offset, q=q
    )
    total = models.count_review_queue(reviewer_id=g.user["id"], status=status, q=q)
    return jsonify(paginated(items, total, limit, offset))


@bp.route("/marlin/<int:test_id>", methods=["GET"])
@require_auth
def get_marlin_review(test_id):
    """Fetch the review for a marlin test.

    Reviewers: a draft is auto-created on first open if none exists.
    Admins: read-only — 404 if no review has been started yet. (No auto-create
    so admins can browse without claiming reviews.)
    Other roles: 403.
    """
    role = g.user["role"]
    if role not in ("reviewer", "admin"):
        return jsonify({"error": "Reviewer or admin access required"}), 403

    test = models.get_marlin_test(test_id)
    if not test:
        return jsonify({"error": "Marlin test not found"}), 404

    review = models.get_review_by_test(test_id)
    if review is None:
        if role == "admin":
            return jsonify({"error": "No review has been started for this test"}), 404
        # Reviewer: build the auto-graded draft and persist it.
        draft_rows = marlin_grader.build_draft_scores(test["answers"])
        review_id = models.create_review_with_scores(test_id, g.user["id"], draft_rows)
        review = models.get_review_by_test(test_id)
        scores = models.get_review_scores(review_id)
    else:
        scores = models.get_review_scores(review["id"])

    return jsonify({
        "test": test,
        "review": review,
        "scores": scores,
        "weights": {
            "default": marlin_grader.DEFAULT_WEIGHT,
            "overrides": marlin_grader.WEIGHTS,
        },
    })


@bp.route("/marlin/<int:test_id>", methods=["PUT"])
@require_reviewer
def save_marlin_review(test_id):
    """Save overrides + notes; optionally submit the review.

    Body: {
      scores: [{question_key, override_score?, notes?}, ...],
      submit: bool (optional, default false)
    }
    """
    data = request.get_json() or {}
    submit = bool(data.get("submit", False))
    incoming_scores = data.get("scores") or []

    review = models.get_review_by_test(test_id)
    if not review:
        return jsonify({"error": "Review not found — open the test first to create a draft"}), 404
    if review["reviewer_id"] != g.user["id"]:
        return jsonify({"error": "This review belongs to another reviewer"}), 403
    if review["status"] == "submitted":
        return jsonify({"error": "Review already submitted"}), 409

    existing = {s["question_key"]: s for s in models.get_review_scores(review["id"])}

    for inc in incoming_scores:
        key = inc.get("question_key")
        if key not in existing:
            continue
        override = inc.get("override_score")
        notes = inc.get("notes")
        if override is not None:
            try:
                override = float(override)
            except (TypeError, ValueError):
                return jsonify({"error": f"Invalid score for {key}"}), 400
            if override < 0 or override > 1:
                return jsonify({"error": f"Score for {key} must be between 0 and 1"}), 400
            final = override
        else:
            # No override → fall back to auto (or 0 for text questions).
            final = existing[key]["auto_score"] if existing[key]["auto_score"] is not None else 0.0
        models.update_review_score(review["id"], key, override, final, notes)

    # Recompute total
    fresh = models.get_review_scores(review["id"])
    final_percent = marlin_grader.compute_percent(fresh)
    new_status = "submitted" if submit else "draft"
    models.update_review(review["id"], new_status, final_percent)

    updated = models.get_review_by_test(test_id)
    return jsonify({"review": updated, "scores": fresh})
