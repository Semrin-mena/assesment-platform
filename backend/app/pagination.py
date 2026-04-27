from flask import request

DEFAULT_LIMIT = 20
MAX_LIMIT = 100


MAX_QUERY_LEN = 200


def get_page_params():
    """Parse ?limit and ?offset from the current request, clamped to safe bounds."""
    try:
        limit = int(request.args.get("limit", DEFAULT_LIMIT))
    except (TypeError, ValueError):
        limit = DEFAULT_LIMIT
    try:
        offset = int(request.args.get("offset", 0))
    except (TypeError, ValueError):
        offset = 0

    limit = max(1, min(limit, MAX_LIMIT))
    offset = max(0, offset)
    return limit, offset


def get_search_query():
    """Parse ?q from the current request. Returns None if absent/blank."""
    raw = request.args.get("q", "").strip()
    if not raw:
        return None
    return raw[:MAX_QUERY_LEN]


def paginated(items, total, limit, offset):
    return {"items": items, "total": total, "limit": limit, "offset": offset}
