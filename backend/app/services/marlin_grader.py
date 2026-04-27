"""Auto-grading rules and answer key for Marlin Test multiple-choice questions.

The reviewer can override any per-question score; this module only produces
the initial suggestion and computes the weighted total.
"""

# Position on the comparison scale (a_much_better is the strongest A pick,
# b_much_better is the strongest B pick). Adjacent positions differ by 1.
SCALE = [
    "a_much_better",
    "a_better",
    "a_slightly_better",
    "a_barely_better",
    "b_barely_better",
    "b_slightly_better",
    "b_better",
    "b_much_better",
]
NA = "na"

# Expected answers for the multiple-choice comparison questions.
ANSWER_KEY = {
    "cq1":  "b_slightly_better",
    "cq2":  "b_barely_better",
    "cq3":  "b_barely_better",
    "cq4":  "b_barely_better",
    "cq5":  "b_barely_better",
    "cq6":  "b_barely_better",
    "cq7":  "b_slightly_better",
    "cq8":  "b_barely_better",
    "cq9":  NA,
    "cq10": "b_barely_better",
    "cq11": "b_barely_better",
    "cq13": "b_barely_better",  # overall preference
}

# All question keys we expect a reviewer to score, in display order.
# Text-only ids have no auto-grade; reviewer enters the score manually.
TEXT_QUESTIONS = [
    "a_quality", "a_agent", "a_communication",
    "b_quality", "b_agent", "b_communication",
    "cq12", "cq14",
]

MC_QUESTIONS = ["cq1", "cq2", "cq3", "cq4", "cq5", "cq6", "cq7",
                "cq8", "cq9", "cq10", "cq11", "cq13"]

ALL_QUESTIONS = (
    ["a_quality", "a_agent", "a_communication"]
    + ["b_quality", "b_agent", "b_communication"]
    + ["cq1", "cq2", "cq3", "cq4", "cq5", "cq6", "cq7", "cq8", "cq9",
       "cq10", "cq11", "cq12", "cq13", "cq14"]
)

# Per-question weights. cq13 (overall preference) and cq14 (detailed
# justification) carry more weight per the product spec.
WEIGHTS = {
    "cq13": 2.0,
    "cq14": 3.0,
}
DEFAULT_WEIGHT = 1.0

# Adjacency on the scale that crosses the A/B midline — the closest signal
# the rater can give that "the responses are about the same". We award more
# credit here than for a normal off-by-one because there is no explicit
# "tie" option on the scale.
MIDLINE_PAIR = {"a_barely_better", "b_barely_better"}


def weight_for(question_key):
    return WEIGHTS.get(question_key, DEFAULT_WEIGHT)


def auto_score(question_key, given_answer):
    """Return (auto_score, expected_answer) for an MC question.

    auto_score is None for text questions (reviewer must score manually).
    """
    if question_key not in ANSWER_KEY:
        return None, None
    expected = ANSWER_KEY[question_key]
    if given_answer is None or given_answer == "":
        return 0.0, expected

    if expected == NA:
        return (1.0 if given_answer == NA else 0.0), expected
    if given_answer == NA:
        return 0.0, expected

    try:
        e = SCALE.index(expected)
        g = SCALE.index(given_answer)
    except ValueError:
        return 0.0, expected

    if e == g:
        return 1.0, expected
    if abs(e - g) == 1:
        if {expected, given_answer} == MIDLINE_PAIR:
            return 0.75, expected
        return 0.5, expected
    return 0.0, expected


def build_draft_scores(answers):
    """Build the per-question draft scoring rows from a tasker's answers dict.

    Returns a list of dicts: question_key, expected_answer, given_answer,
    auto_score, final_score, weight. Text questions get auto_score=None and
    final_score=0.0 (reviewer fills it in).
    """
    rows = []
    for key in ALL_QUESTIONS:
        given = answers.get(key)
        auto, expected = auto_score(key, given)
        rows.append({
            "question_key": key,
            "expected_answer": expected,
            "given_answer": given if given is not None else "",
            "auto_score": auto,
            "final_score": auto if auto is not None else 0.0,
            "weight": weight_for(key),
        })
    return rows


def compute_percent(scores):
    """Weighted percentage from a list of {final_score, weight} rows."""
    total_weight = sum(r["weight"] for r in scores)
    if total_weight == 0:
        return 0.0
    weighted = sum(r["final_score"] * r["weight"] for r in scores)
    return round(weighted / total_weight * 100, 2)
