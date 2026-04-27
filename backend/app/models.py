import json

import bcrypt

from app.extensions import get_db


def _like_pattern(q):
    """Build a case-insensitive LIKE pattern, escaping %/_/\\ in user input."""
    if not q:
        return None
    escaped = q.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")
    return f"%{escaped.lower()}%"


# --- Users ---

def create_user(username, email, password, role="tasker"):
    db = get_db()
    hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
    cursor = db.execute(
        "INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)",
        (username, email, hashed, role),
    )
    db.commit()
    return cursor.lastrowid


def get_user_by_id(user_id):
    db = get_db()
    row = db.execute(
        "SELECT id, username, email, role, created_at FROM users WHERE id = ?",
        (user_id,),
    ).fetchone()
    return dict(row) if row else None


def get_user_by_username(username):
    db = get_db()
    row = db.execute(
        "SELECT id, username, email, password, role, created_at FROM users WHERE username = ?",
        (username,),
    ).fetchone()
    return dict(row) if row else None


def get_user_by_email(email):
    db = get_db()
    row = db.execute(
        "SELECT id, username, email, password, role, created_at FROM users WHERE email = ?",
        (email,),
    ).fetchone()
    return dict(row) if row else None


def authenticate_user(username, password):
    user = get_user_by_username(username)
    if not user:
        return None
    if bcrypt.checkpw(password.encode("utf-8"), user["password"].encode("utf-8")):
        return user
    return None


def update_user(user_id, *, username=None, email=None, role=None, password=None):
    db = get_db()
    sets = []
    params = []
    if username is not None:
        sets.append("username = ?")
        params.append(username)
    if email is not None:
        sets.append("email = ?")
        params.append(email)
    if role is not None:
        sets.append("role = ?")
        params.append(role)
    if password is not None:
        hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
        sets.append("password = ?")
        params.append(hashed)
    if not sets:
        return
    params.append(user_id)
    db.execute(f"UPDATE users SET {', '.join(sets)} WHERE id = ?", params)
    db.commit()


def delete_user(user_id):
    db = get_db()
    db.execute("DELETE FROM users WHERE id = ?", (user_id,))
    db.commit()


def user_has_dependents(user_id):
    """Return True if the user owns prompts, marlin tests, or reviews."""
    db = get_db()
    row = db.execute(
        """
        SELECT
          (SELECT COUNT(*) FROM prompts WHERE user_id = ?)
          + (SELECT COUNT(*) FROM marlin_tests WHERE user_id = ?)
          + (SELECT COUNT(*) FROM marlin_reviews WHERE reviewer_id = ?)
          AS c
        """,
        (user_id, user_id, user_id),
    ).fetchone()
    return (row["c"] or 0) > 0


def list_users(limit=20, offset=0, q=None):
    db = get_db()
    pattern = _like_pattern(q)
    if pattern:
        rows = db.execute(
            """
            SELECT id, username, email, role, created_at FROM users
            WHERE LOWER(username) LIKE ? ESCAPE '\\' OR LOWER(email) LIKE ? ESCAPE '\\'
            ORDER BY created_at DESC LIMIT ? OFFSET ?
            """,
            (pattern, pattern, limit, offset),
        ).fetchall()
    else:
        rows = db.execute(
            "SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC LIMIT ? OFFSET ?",
            (limit, offset),
        ).fetchall()
    return [dict(r) for r in rows]


def count_users(q=None):
    db = get_db()
    pattern = _like_pattern(q)
    if pattern:
        row = db.execute(
            "SELECT COUNT(*) AS c FROM users WHERE LOWER(username) LIKE ? ESCAPE '\\' OR LOWER(email) LIKE ? ESCAPE '\\'",
            (pattern, pattern),
        ).fetchone()
    else:
        row = db.execute("SELECT COUNT(*) AS c FROM users").fetchone()
    return row["c"] if row else 0


def count_users_by_role():
    db = get_db()
    rows = db.execute(
        "SELECT role, COUNT(*) AS c FROM users GROUP BY role"
    ).fetchall()
    return {r["role"]: r["c"] for r in rows}


# --- Prompts ---

def create_prompt(user_id, prompt_text):
    db = get_db()
    cursor = db.execute(
        "INSERT INTO prompts (user_id, prompt_text) VALUES (?, ?)",
        (user_id, prompt_text),
    )
    db.commit()
    return cursor.lastrowid


def list_prompts(user_id=None, limit=20, offset=0, q=None):
    db = get_db()
    pattern = _like_pattern(q)
    if user_id:
        if pattern:
            rows = db.execute(
                """
                SELECT p.id, p.prompt_text, p.created_at, p.user_id,
                       CASE WHEN a.id IS NOT NULL THEN 1 ELSE 0 END AS has_assessment
                FROM prompts p
                LEFT JOIN assessments a ON a.prompt_id = p.id
                WHERE p.user_id = ? AND LOWER(p.prompt_text) LIKE ? ESCAPE '\\'
                ORDER BY p.created_at DESC
                LIMIT ? OFFSET ?
                """,
                (user_id, pattern, limit, offset),
            ).fetchall()
        else:
            rows = db.execute(
                """
                SELECT p.id, p.prompt_text, p.created_at, p.user_id,
                       CASE WHEN a.id IS NOT NULL THEN 1 ELSE 0 END AS has_assessment
                FROM prompts p
                LEFT JOIN assessments a ON a.prompt_id = p.id
                WHERE p.user_id = ?
                ORDER BY p.created_at DESC
                LIMIT ? OFFSET ?
                """,
                (user_id, limit, offset),
            ).fetchall()
    else:
        if pattern:
            rows = db.execute(
                """
                SELECT p.id, p.prompt_text, p.created_at, p.user_id,
                       u.username,
                       CASE WHEN a.id IS NOT NULL THEN 1 ELSE 0 END AS has_assessment
                FROM prompts p
                LEFT JOIN assessments a ON a.prompt_id = p.id
                JOIN users u ON u.id = p.user_id
                WHERE LOWER(p.prompt_text) LIKE ? ESCAPE '\\' OR LOWER(u.username) LIKE ? ESCAPE '\\'
                ORDER BY p.created_at DESC
                LIMIT ? OFFSET ?
                """,
                (pattern, pattern, limit, offset),
            ).fetchall()
        else:
            rows = db.execute(
                """
                SELECT p.id, p.prompt_text, p.created_at, p.user_id,
                       u.username,
                       CASE WHEN a.id IS NOT NULL THEN 1 ELSE 0 END AS has_assessment
                FROM prompts p
                LEFT JOIN assessments a ON a.prompt_id = p.id
                JOIN users u ON u.id = p.user_id
                ORDER BY p.created_at DESC
                LIMIT ? OFFSET ?
                """,
                (limit, offset),
            ).fetchall()
    return [dict(r) for r in rows]


def count_prompts(user_id=None, q=None):
    db = get_db()
    pattern = _like_pattern(q)
    if user_id:
        if pattern:
            row = db.execute(
                "SELECT COUNT(*) AS c FROM prompts WHERE user_id = ? AND LOWER(prompt_text) LIKE ? ESCAPE '\\'",
                (user_id, pattern),
            ).fetchone()
        else:
            row = db.execute(
                "SELECT COUNT(*) AS c FROM prompts WHERE user_id = ?", (user_id,)
            ).fetchone()
    else:
        if pattern:
            row = db.execute(
                """
                SELECT COUNT(*) AS c FROM prompts p
                JOIN users u ON u.id = p.user_id
                WHERE LOWER(p.prompt_text) LIKE ? ESCAPE '\\' OR LOWER(u.username) LIKE ? ESCAPE '\\'
                """,
                (pattern, pattern),
            ).fetchone()
        else:
            row = db.execute("SELECT COUNT(*) AS c FROM prompts").fetchone()
    return row["c"] if row else 0


def count_completed_prompts():
    db = get_db()
    row = db.execute(
        "SELECT COUNT(*) AS c FROM prompts p JOIN assessments a ON a.prompt_id = p.id"
    ).fetchone()
    return row["c"] if row else 0


def get_prompt(prompt_id):
    db = get_db()
    row = db.execute(
        "SELECT id, user_id, prompt_text, created_at FROM prompts WHERE id = ?",
        (prompt_id,),
    ).fetchone()
    return dict(row) if row else None


# --- Responses ---

def create_response(prompt_id, variant, response_text, model_config):
    db = get_db()
    cursor = db.execute(
        "INSERT INTO responses (prompt_id, variant, response_text, model_config) VALUES (?, ?, ?, ?)",
        (prompt_id, variant, response_text, json.dumps(model_config)),
    )
    db.commit()
    return cursor.lastrowid


def get_responses_for_prompt(prompt_id):
    db = get_db()
    rows = db.execute(
        "SELECT id, prompt_id, variant, response_text, model_config, created_at FROM responses WHERE prompt_id = ?",
        (prompt_id,),
    ).fetchall()
    result = {}
    for r in rows:
        d = dict(r)
        d["model_config"] = json.loads(d["model_config"])
        result[d["variant"]] = d
    return result


# --- Assessments ---

def create_assessment(prompt_id, chosen_variant, justification):
    db = get_db()
    cursor = db.execute(
        "INSERT INTO assessments (prompt_id, chosen_variant, justification) VALUES (?, ?, ?)",
        (prompt_id, chosen_variant, justification),
    )
    db.commit()
    return cursor.lastrowid


def get_assessment_by_prompt(prompt_id):
    db = get_db()
    row = db.execute(
        "SELECT id, prompt_id, chosen_variant, justification, created_at FROM assessments WHERE prompt_id = ?",
        (prompt_id,),
    ).fetchone()
    return dict(row) if row else None


def get_assessment(assessment_id):
    db = get_db()
    row = db.execute(
        """
        SELECT a.id, a.prompt_id, a.chosen_variant, a.justification, a.created_at,
               p.prompt_text, p.user_id
        FROM assessments a
        JOIN prompts p ON p.id = a.prompt_id
        WHERE a.id = ?
        """,
        (assessment_id,),
    ).fetchone()
    return dict(row) if row else None


def list_assessments(user_id=None, limit=20, offset=0):
    db = get_db()
    if user_id:
        rows = db.execute(
            """
            SELECT a.id, a.prompt_id, a.chosen_variant, a.justification, a.created_at,
                   p.prompt_text
            FROM assessments a
            JOIN prompts p ON p.id = a.prompt_id
            WHERE p.user_id = ?
            ORDER BY a.created_at DESC
            LIMIT ? OFFSET ?
            """,
            (user_id, limit, offset),
        ).fetchall()
    else:
        rows = db.execute(
            """
            SELECT a.id, a.prompt_id, a.chosen_variant, a.justification, a.created_at,
                   p.prompt_text, p.user_id, u.username
            FROM assessments a
            JOIN prompts p ON p.id = a.prompt_id
            JOIN users u ON u.id = p.user_id
            ORDER BY a.created_at DESC
            LIMIT ? OFFSET ?
            """,
            (limit, offset),
        ).fetchall()
    return [dict(r) for r in rows]


def count_assessments(user_id=None):
    db = get_db()
    if user_id:
        row = db.execute(
            "SELECT COUNT(*) AS c FROM assessments a JOIN prompts p ON p.id = a.prompt_id WHERE p.user_id = ?",
            (user_id,),
        ).fetchone()
    else:
        row = db.execute("SELECT COUNT(*) AS c FROM assessments").fetchone()
    return row["c"] if row else 0


# --- Marlin Tests ---

def create_marlin_test(user_id, prompt_text, answers):
    db = get_db()
    cursor = db.execute(
        "INSERT INTO marlin_tests (user_id, prompt_text, answers) VALUES (?, ?, ?)",
        (user_id, prompt_text, json.dumps(answers)),
    )
    db.commit()
    return cursor.lastrowid


def get_marlin_test(test_id):
    db = get_db()
    row = db.execute(
        """
        SELECT m.id, m.user_id, m.prompt_text, m.answers, m.created_at,
               u.username
        FROM marlin_tests m
        JOIN users u ON u.id = m.user_id
        WHERE m.id = ?
        """,
        (test_id,),
    ).fetchone()
    if not row:
        return None
    d = dict(row)
    d["answers"] = json.loads(d["answers"])
    return d


def list_marlin_tests(user_id=None, limit=20, offset=0, q=None):
    db = get_db()
    pattern = _like_pattern(q)
    if user_id:
        if pattern:
            rows = db.execute(
                """
                SELECT m.id, m.user_id, m.prompt_text, m.answers, m.created_at,
                       r.status AS review_status, r.final_percent,
                       r.reviewer_id, ru.username AS reviewer_username
                FROM marlin_tests m
                LEFT JOIN marlin_reviews r ON r.marlin_test_id = m.id
                LEFT JOIN users ru ON ru.id = r.reviewer_id
                WHERE m.user_id = ? AND LOWER(m.prompt_text) LIKE ? ESCAPE '\\'
                ORDER BY m.created_at DESC LIMIT ? OFFSET ?
                """,
                (user_id, pattern, limit, offset),
            ).fetchall()
        else:
            rows = db.execute(
                """
                SELECT m.id, m.user_id, m.prompt_text, m.answers, m.created_at,
                       r.status AS review_status, r.final_percent,
                       r.reviewer_id, ru.username AS reviewer_username
                FROM marlin_tests m
                LEFT JOIN marlin_reviews r ON r.marlin_test_id = m.id
                LEFT JOIN users ru ON ru.id = r.reviewer_id
                WHERE m.user_id = ?
                ORDER BY m.created_at DESC LIMIT ? OFFSET ?
                """,
                (user_id, limit, offset),
            ).fetchall()
    else:
        if pattern:
            rows = db.execute(
                """
                SELECT m.id, m.user_id, m.prompt_text, m.answers, m.created_at,
                       u.username,
                       r.status AS review_status, r.final_percent,
                       r.reviewer_id, ru.username AS reviewer_username
                FROM marlin_tests m
                JOIN users u ON u.id = m.user_id
                LEFT JOIN marlin_reviews r ON r.marlin_test_id = m.id
                LEFT JOIN users ru ON ru.id = r.reviewer_id
                WHERE LOWER(m.prompt_text) LIKE ? ESCAPE '\\' OR LOWER(u.username) LIKE ? ESCAPE '\\'
                ORDER BY m.created_at DESC
                LIMIT ? OFFSET ?
                """,
                (pattern, pattern, limit, offset),
            ).fetchall()
        else:
            rows = db.execute(
                """
                SELECT m.id, m.user_id, m.prompt_text, m.answers, m.created_at,
                       u.username,
                       r.status AS review_status, r.final_percent,
                       r.reviewer_id, ru.username AS reviewer_username
                FROM marlin_tests m
                JOIN users u ON u.id = m.user_id
                LEFT JOIN marlin_reviews r ON r.marlin_test_id = m.id
                LEFT JOIN users ru ON ru.id = r.reviewer_id
                ORDER BY m.created_at DESC
                LIMIT ? OFFSET ?
                """,
                (limit, offset),
            ).fetchall()
    result = []
    for r in rows:
        d = dict(r)
        d["answers"] = json.loads(d["answers"])
        result.append(d)
    return result


# --- Marlin Reviews ---

def get_review_by_test(marlin_test_id):
    db = get_db()
    row = db.execute(
        """
        SELECT r.id, r.marlin_test_id, r.reviewer_id, r.status, r.final_percent,
               r.submitted_at, r.created_at, r.updated_at,
               u.username AS reviewer_username
        FROM marlin_reviews r
        JOIN users u ON u.id = r.reviewer_id
        WHERE r.marlin_test_id = ?
        """,
        (marlin_test_id,),
    ).fetchone()
    return dict(row) if row else None


def get_review_scores(review_id):
    db = get_db()
    rows = db.execute(
        """
        SELECT id, review_id, question_key, expected_answer, given_answer,
               auto_score, override_score, final_score, weight, notes
        FROM marlin_question_scores
        WHERE review_id = ?
        """,
        (review_id,),
    ).fetchall()
    return [dict(r) for r in rows]


def create_review_with_scores(marlin_test_id, reviewer_id, draft_rows):
    """Create a draft review and its per-question score rows in one transaction."""
    db = get_db()
    cursor = db.execute(
        "INSERT INTO marlin_reviews (marlin_test_id, reviewer_id, status) VALUES (?, ?, 'draft')",
        (marlin_test_id, reviewer_id),
    )
    review_id = cursor.lastrowid
    for r in draft_rows:
        db.execute(
            """
            INSERT INTO marlin_question_scores
                (review_id, question_key, expected_answer, given_answer,
                 auto_score, override_score, final_score, weight)
            VALUES (?, ?, ?, ?, ?, NULL, ?, ?)
            """,
            (review_id, r["question_key"], r["expected_answer"], r["given_answer"],
             r["auto_score"], r["final_score"], r["weight"]),
        )
    db.commit()
    return review_id


def update_review_score(review_id, question_key, override_score, final_score, notes):
    db = get_db()
    db.execute(
        """
        UPDATE marlin_question_scores
        SET override_score = ?, final_score = ?, notes = ?
        WHERE review_id = ? AND question_key = ?
        """,
        (override_score, final_score, notes, review_id, question_key),
    )
    db.commit()


def update_review(review_id, status, final_percent):
    db = get_db()
    if status == "submitted":
        db.execute(
            """
            UPDATE marlin_reviews
            SET status = ?, final_percent = ?, submitted_at = datetime('now'),
                updated_at = datetime('now')
            WHERE id = ?
            """,
            (status, final_percent, review_id),
        )
    else:
        db.execute(
            """
            UPDATE marlin_reviews
            SET status = ?, final_percent = ?, updated_at = datetime('now')
            WHERE id = ?
            """,
            (status, final_percent, review_id),
        )
    db.commit()


def list_review_queue(reviewer_id, status=None, limit=20, offset=0, q=None):
    """List marlin tests joined with their review status. status filter:
    'pending' (no review or status=draft) or 'reviewed' (status=submitted)."""
    db = get_db()
    pattern = _like_pattern(q)
    base = """
        SELECT m.id AS marlin_test_id, m.user_id, m.prompt_text, m.created_at AS test_created_at,
               u.username AS tasker_username,
               r.id AS review_id, r.status AS review_status, r.final_percent,
               r.submitted_at, r.reviewer_id
        FROM marlin_tests m
        JOIN users u ON u.id = m.user_id
        LEFT JOIN marlin_reviews r ON r.marlin_test_id = m.id
    """
    where = []
    params = []

    if status == "pending":
        where.append("(r.id IS NULL OR r.status = 'draft')")
    elif status == "reviewed":
        where.append("r.status = 'submitted'")

    if reviewer_id is not None and status != "pending":
        # When listing reviewed items, restrict to this reviewer's own reviews.
        # Pending items have no reviewer attached yet, so don't filter there.
        where.append("(r.reviewer_id = ? OR r.id IS NULL)")
        params.append(reviewer_id)

    if pattern:
        where.append("(LOWER(m.prompt_text) LIKE ? ESCAPE '\\' OR LOWER(u.username) LIKE ? ESCAPE '\\')")
        params.extend([pattern, pattern])

    sql = base
    if where:
        sql += " WHERE " + " AND ".join(where)
    sql += " ORDER BY m.created_at DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])

    rows = db.execute(sql, params).fetchall()
    return [dict(r) for r in rows]


def count_review_queue(reviewer_id, status=None, q=None):
    db = get_db()
    pattern = _like_pattern(q)
    sql = """
        SELECT COUNT(*) AS c
        FROM marlin_tests m
        JOIN users u ON u.id = m.user_id
        LEFT JOIN marlin_reviews r ON r.marlin_test_id = m.id
    """
    where = []
    params = []
    if status == "pending":
        where.append("(r.id IS NULL OR r.status = 'draft')")
    elif status == "reviewed":
        where.append("r.status = 'submitted'")
    if reviewer_id is not None and status != "pending":
        where.append("(r.reviewer_id = ? OR r.id IS NULL)")
        params.append(reviewer_id)
    if pattern:
        where.append("(LOWER(m.prompt_text) LIKE ? ESCAPE '\\' OR LOWER(u.username) LIKE ? ESCAPE '\\')")
        params.extend([pattern, pattern])
    if where:
        sql += " WHERE " + " AND ".join(where)
    row = db.execute(sql, params).fetchone()
    return row["c"] if row else 0


def count_marlin_tests(user_id=None, q=None):
    db = get_db()
    pattern = _like_pattern(q)
    if user_id:
        if pattern:
            row = db.execute(
                "SELECT COUNT(*) AS c FROM marlin_tests WHERE user_id = ? AND LOWER(prompt_text) LIKE ? ESCAPE '\\'",
                (user_id, pattern),
            ).fetchone()
        else:
            row = db.execute(
                "SELECT COUNT(*) AS c FROM marlin_tests WHERE user_id = ?", (user_id,)
            ).fetchone()
    else:
        if pattern:
            row = db.execute(
                """
                SELECT COUNT(*) AS c FROM marlin_tests m
                JOIN users u ON u.id = m.user_id
                WHERE LOWER(m.prompt_text) LIKE ? ESCAPE '\\' OR LOWER(u.username) LIKE ? ESCAPE '\\'
                """,
                (pattern, pattern),
            ).fetchone()
        else:
            row = db.execute("SELECT COUNT(*) AS c FROM marlin_tests").fetchone()
    return row["c"] if row else 0
