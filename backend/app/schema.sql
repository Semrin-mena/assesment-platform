CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    username    TEXT    NOT NULL UNIQUE,
    email       TEXT    NOT NULL UNIQUE,
    password    TEXT    NOT NULL,
    role        TEXT    NOT NULL DEFAULT 'tasker' CHECK (role IN ('tasker', 'admin', 'reviewer')),
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS prompts (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id),
    prompt_text TEXT    NOT NULL,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS responses (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    prompt_id      INTEGER NOT NULL REFERENCES prompts(id),
    variant        TEXT    NOT NULL CHECK (variant IN ('A', 'B')),
    response_text  TEXT    NOT NULL,
    model_config   TEXT    NOT NULL,
    created_at     TEXT    NOT NULL DEFAULT (datetime('now')),
    UNIQUE(prompt_id, variant)
);

CREATE TABLE IF NOT EXISTS assessments (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    prompt_id       INTEGER NOT NULL REFERENCES prompts(id) UNIQUE,
    chosen_variant  TEXT    NOT NULL CHECK (chosen_variant IN ('A', 'B')),
    justification   TEXT    NOT NULL,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS marlin_tests (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id      INTEGER NOT NULL REFERENCES users(id),
    prompt_text  TEXT    NOT NULL,
    answers      TEXT    NOT NULL DEFAULT '{}',
    created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS marlin_reviews (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    marlin_test_id  INTEGER NOT NULL UNIQUE REFERENCES marlin_tests(id) ON DELETE CASCADE,
    reviewer_id     INTEGER NOT NULL REFERENCES users(id),
    status          TEXT    NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted')),
    final_percent   REAL,
    submitted_at    TEXT,
    created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS marlin_question_scores (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    review_id        INTEGER NOT NULL REFERENCES marlin_reviews(id) ON DELETE CASCADE,
    question_key     TEXT    NOT NULL,
    expected_answer  TEXT,
    given_answer     TEXT,
    auto_score       REAL,
    override_score   REAL,
    final_score      REAL    NOT NULL,
    weight           REAL    NOT NULL DEFAULT 1.0,
    notes            TEXT,
    UNIQUE(review_id, question_key)
);

CREATE TABLE IF NOT EXISTS schema_migrations (
    name        TEXT PRIMARY KEY,
    applied_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_users_username             ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email                ON users(email);
CREATE INDEX IF NOT EXISTS idx_prompts_user_id            ON prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_prompts_created_at         ON prompts(created_at);
CREATE INDEX IF NOT EXISTS idx_responses_prompt_id        ON responses(prompt_id);
CREATE INDEX IF NOT EXISTS idx_assessments_prompt_id      ON assessments(prompt_id);
CREATE INDEX IF NOT EXISTS idx_marlin_tests_user_id       ON marlin_tests(user_id);
CREATE INDEX IF NOT EXISTS idx_marlin_tests_created_at    ON marlin_tests(created_at);
CREATE INDEX IF NOT EXISTS idx_marlin_reviews_test_id     ON marlin_reviews(marlin_test_id);
CREATE INDEX IF NOT EXISTS idx_marlin_reviews_reviewer_id ON marlin_reviews(reviewer_id);
CREATE INDEX IF NOT EXISTS idx_marlin_q_scores_review_id  ON marlin_question_scores(review_id);
