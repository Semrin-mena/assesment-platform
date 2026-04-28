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


def clamp_offset(offset, total, limit):
    """Clamp offset so it never points past the last valid page.

    If the caller asks for ?offset=999 on a 12-item list with limit=20, return 0
    instead of an empty page that confuses the UI ("Page 50 of 1").
    """
    if total <= 0:
        return 0
    last_page_offset = ((total - 1) // limit) * limit
    return max(0, min(offset, last_page_offset))


def paginated(items, total, limit, offset):
    return {"items": items, "total": total, "limit": limit, "offset": offset}
