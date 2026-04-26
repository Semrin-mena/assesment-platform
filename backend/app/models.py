import json

import bcrypt

from app.extensions import get_db


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


def list_users():
    db = get_db()
    rows = db.execute(
        "SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC"
    ).fetchall()
    return [dict(r) for r in rows]


# --- Prompts ---

def create_prompt(user_id, prompt_text):
    db = get_db()
    cursor = db.execute(
        "INSERT INTO prompts (user_id, prompt_text) VALUES (?, ?)",
        (user_id, prompt_text),
    )
    db.commit()
    return cursor.lastrowid


def list_prompts(user_id=None):
    db = get_db()
    if user_id:
        rows = db.execute(
            """
            SELECT p.id, p.prompt_text, p.created_at, p.user_id,
                   CASE WHEN a.id IS NOT NULL THEN 1 ELSE 0 END AS has_assessment
            FROM prompts p
            LEFT JOIN assessments a ON a.prompt_id = p.id
            WHERE p.user_id = ?
            ORDER BY p.created_at DESC
            """,
            (user_id,),
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
            """
        ).fetchall()
    return [dict(r) for r in rows]


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


def list_assessments(user_id=None):
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
            """,
            (user_id,),
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
            """
        ).fetchall()
    return [dict(r) for r in rows]


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


def list_marlin_tests(user_id=None):
    db = get_db()
    if user_id:
        rows = db.execute(
            "SELECT id, user_id, prompt_text, answers, created_at FROM marlin_tests WHERE user_id = ? ORDER BY created_at DESC",
            (user_id,),
        ).fetchall()
    else:
        rows = db.execute(
            """
            SELECT m.id, m.user_id, m.prompt_text, m.answers, m.created_at,
                   u.username
            FROM marlin_tests m
            JOIN users u ON u.id = m.user_id
            ORDER BY m.created_at DESC
            """
        ).fetchall()
    result = []
    for r in rows:
        d = dict(r)
        d["answers"] = json.loads(d["answers"])
        result.append(d)
    return result
