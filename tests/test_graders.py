"""Comprehensive tests for deterministic graders."""

from support_triage_env.graders import (
    grade_task,
    partial_hint,
    _response_quality_score,
    _forbidden_penalty,
)
from support_triage_env.tasks import TASKS, TASK_ORDER


# ─── Easy task tests ──────────────────────────────────────────


def test_easy_correct_category() -> None:
    spec = TASKS["easy_billing"]
    assert grade_task(spec, "billing", None, None) == 1.0


def test_easy_wrong_category() -> None:
    spec = TASKS["easy_billing"]
    assert grade_task(spec, "security", None, None) == 0.0


def test_easy_none_category() -> None:
    spec = TASKS["easy_billing"]
    assert grade_task(spec, None, None, None) == 0.0


def test_easy_case_insensitive() -> None:
    spec = TASKS["easy_billing"]
    assert grade_task(spec, "BILLING", None, None) == 1.0
    assert grade_task(spec, "  Billing  ", None, None) == 1.0


# ─── Medium infra task tests ─────────────────────────────────


def test_medium_infra_correct_priority() -> None:
    spec = TASKS["medium_infra"]
    assert grade_task(spec, None, 1, None) == 1.0


def test_medium_infra_wrong_priority() -> None:
    spec = TASKS["medium_infra"]
    assert grade_task(spec, None, 3, None) == 0.0


def test_medium_infra_near_miss() -> None:
    """Priority off by 1 should get partial credit."""
    spec = TASKS["medium_infra"]
    score = grade_task(spec, None, 2, None)
    assert 0.0 < score < 1.0, f"Expected partial credit, got {score}"


def test_medium_infra_none_priority() -> None:
    spec = TASKS["medium_infra"]
    assert grade_task(spec, None, None, None) == 0.0


# ─── Medium access task (red herring) ────────────────────────


def test_medium_access_correct() -> None:
    """Must route to ACCESS not BILLING despite subject line."""
    spec = TASKS["medium_access"]
    score = grade_task(spec, "access", 2, None)
    assert score == 1.0


def test_medium_access_billing_trap() -> None:
    """If agent falls for the red herring and routes to billing."""
    spec = TASKS["medium_access"]
    score = grade_task(spec, "billing", 2, None)
    assert score < 1.0


def test_medium_access_partial_credit() -> None:
    """Correct category, wrong priority → partial."""
    spec = TASKS["medium_access"]
    score = grade_task(spec, "access", 4, None)
    assert 0.0 < score < 1.0


# ─── Hard task tests ─────────────────────────────────────────


def test_hard_perfect() -> None:
    spec = TASKS["hard_security"]
    draft = (
        "Hi team, we are immediately locking the affected account and "
        "enforcing MFA re-enrollment. Our investigation team will follow up "
        "with next steps. Thank you for the alert. Best regards."
    )
    score = grade_task(spec, "security", 2, draft)
    assert score > 0.85, f"Perfect hard should be >0.85, got {score}"


def test_hard_partial_no_response() -> None:
    spec = TASKS["hard_security"]
    score = grade_task(spec, "security", 2, None)
    assert score < 0.7, f"Missing response should be <0.7, got {score}"


def test_hard_wrong_category() -> None:
    spec = TASKS["hard_security"]
    score = grade_task(spec, "billing", 2, "lock the account and reset mfa")
    assert score < 0.8


def test_hard_forbidden_phrases() -> None:
    """Response containing 'ignore' should be penalized."""
    spec = TASKS["hard_security"]
    score_good = grade_task(
        spec, "security", 2,
        "We will lock the account and enforce MFA re-enrollment immediately."
    )
    score_bad = grade_task(
        spec, "security", 2,
        "Please ignore the alert — this is not a problem. MFA lock."
    )
    assert score_good > score_bad, (
        f"Forbidden phrase should reduce score: good={score_good}, bad={score_bad}"
    )


# ─── Response quality scoring ────────────────────────────────


def test_quality_empty() -> None:
    assert _response_quality_score("") == 0.0
    assert _response_quality_score("ok") == 0.0


def test_quality_professional() -> None:
    text = (
        "Hi team, thank you for reporting this. We will investigate "
        "immediately and follow up with next steps. Our team is on it."
    )
    score = _response_quality_score(text)
    assert score > 0.5, f"Professional response should score >0.5, got {score}"


def test_quality_terse() -> None:
    text = "Fixed it. Done. No worries mate."
    score = _response_quality_score(text)
    assert score < 0.4, f"Terse response should score <0.4, got {score}"


# ─── Forbidden penalty ───────────────────────────────────────


def test_forbidden_none() -> None:
    assert _forbidden_penalty("some text", []) == 1.0


def test_forbidden_present() -> None:
    assert _forbidden_penalty("just ignore it", ["ignore"]) == 0.0


def test_forbidden_absent() -> None:
    assert _forbidden_penalty("we will fix it", ["ignore"]) == 1.0


# ─── Partial hint ────────────────────────────────────────────


def test_partial_hint_easy() -> None:
    spec = TASKS["easy_billing"]
    assert partial_hint(spec, "billing", None) == 1.0
    assert partial_hint(spec, "security", None) == 0.0


def test_partial_hint_hard() -> None:
    spec = TASKS["hard_security"]
    ph = partial_hint(spec, "security", 2)
    assert ph == 1.0


def test_partial_hint_hard_partial() -> None:
    spec = TASKS["hard_security"]
    ph = partial_hint(spec, "security", None)
    assert ph == 0.5


# ─── Task configuration integrity ────────────────────────────


def test_all_tasks_have_gold() -> None:
    """Every task must have at least one gold answer."""
    for key, spec in TASKS.items():
        assert spec.gold_category is not None or spec.gold_priority is not None, (
            f"Task {key} has no gold answer"
        )


def test_task_order_consistent() -> None:
    """All tasks in TASK_ORDER must exist in TASKS dict."""
    for key in TASK_ORDER:
        assert key in TASKS, f"{key} in TASK_ORDER but missing from TASKS"


def test_minimum_tasks() -> None:
    """Must have at least 3 tasks (requirement)."""
    assert len(TASKS) >= 3


def test_difficulty_range() -> None:
    """Must have easy, medium, and hard tasks."""
    difficulties = {spec.difficulty for spec in TASKS.values()}
    assert "easy" in difficulties
    assert "medium" in difficulties
    assert "hard" in difficulties


# ─── Grader determinism ──────────────────────────────────────


def test_grader_deterministic() -> None:
    """Same inputs must always produce same output."""
    spec = TASKS["hard_security"]
    draft = "We will lock the account and enforce MFA reset."
    scores = [grade_task(spec, "security", 2, draft) for _ in range(10)]
    assert len(set(scores)) == 1, f"Grader not deterministic: {scores}"
