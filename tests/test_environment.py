"""Integration tests for SupportTriageEnvironment."""

from support_triage_env.models import SupportTriageAction
from support_triage_env.server.support_environment import SupportTriageEnvironment
from support_triage_env.tasks import TASKS, TASK_ORDER


def _make_env() -> SupportTriageEnvironment:
    return SupportTriageEnvironment()


# ─── Reset ────────────────────────────────────────────────────


def test_reset_clean_state() -> None:
    env = _make_env()
    obs = env.reset(task_key="easy_billing")
    assert obs.done is False
    assert obs.step_index == 0
    assert obs.category_guess is None
    assert obs.priority_guess is None
    assert obs.response_draft is None
    assert obs.terminal_grader_score is None
    assert obs.ticket_id == TASKS["easy_billing"].ticket_id


def test_reset_correct_difficulty() -> None:
    env = _make_env()
    for key in TASK_ORDER:
        obs = env.reset(task_key=key)
        assert obs.difficulty == TASKS[key].difficulty


def test_reset_sla_populated() -> None:
    env = _make_env()
    obs = env.reset(task_key="medium_infra")
    assert obs.sla_remaining_steps == TASKS["medium_infra"].sla_steps


def test_reset_customer_tier() -> None:
    env = _make_env()
    obs = env.reset(task_key="hard_security")
    assert obs.customer_tier == "enterprise"


# ─── Step basics ──────────────────────────────────────────────


def test_step_increments() -> None:
    env = _make_env()
    env.reset(task_key="easy_billing")
    obs = env.step(SupportTriageAction(verb="noop"))
    assert obs.step_index == 1
    obs = env.step(SupportTriageAction(verb="noop"))
    assert obs.step_index == 2


def test_set_category() -> None:
    env = _make_env()
    env.reset(task_key="easy_billing")
    obs = env.step(SupportTriageAction(verb="set_category", category="billing"))
    assert obs.category_guess == "billing"
    assert obs.done is False


def test_set_priority() -> None:
    env = _make_env()
    env.reset(task_key="medium_infra")
    obs = env.step(SupportTriageAction(verb="set_priority", priority=1))
    assert obs.priority_guess == 1


def test_set_response() -> None:
    env = _make_env()
    env.reset(task_key="hard_security")
    draft = "We will lock the account and enforce MFA."
    obs = env.step(SupportTriageAction(verb="set_response", response_draft=draft))
    assert obs.response_draft == draft


def test_invalid_category_rejected() -> None:
    env = _make_env()
    env.reset(task_key="easy_billing")
    obs = env.step(SupportTriageAction(verb="set_category", category="invalid_xyz"))
    assert obs.category_guess is None  # should NOT update
    assert "Invalid category" in obs.feedback


# ─── Submit ───────────────────────────────────────────────────


def test_submit_easy_perfect() -> None:
    env = _make_env()
    env.reset(task_key="easy_billing")
    env.step(SupportTriageAction(verb="set_category", category="billing"))
    obs = env.step(SupportTriageAction(verb="submit"))
    assert obs.done is True
    assert obs.terminal_grader_score == 1.0


def test_submit_easy_wrong() -> None:
    env = _make_env()
    env.reset(task_key="easy_billing")
    env.step(SupportTriageAction(verb="set_category", category="security"))
    obs = env.step(SupportTriageAction(verb="submit"))
    assert obs.done is True
    assert obs.terminal_grader_score == 0.0


def test_submit_medium_access_correct() -> None:
    """Red-herring task: must route to access, not billing."""
    env = _make_env()
    env.reset(task_key="medium_access")
    env.step(SupportTriageAction(verb="set_category", category="access"))
    env.step(SupportTriageAction(verb="set_priority", priority=2))
    obs = env.step(SupportTriageAction(verb="submit"))
    assert obs.done is True
    assert obs.terminal_grader_score == 1.0


def test_submit_hard_full_score() -> None:
    env = _make_env()
    env.reset(task_key="hard_security")
    env.step(SupportTriageAction(verb="set_category", category="security"))
    env.step(SupportTriageAction(verb="set_priority", priority=2))
    draft = (
        "Hi team, thank you for the alert. We are immediately locking the "
        "account and enforcing MFA re-enrollment. Our team will investigate "
        "and follow up with next steps. Best regards."
    )
    env.step(SupportTriageAction(verb="set_response", response_draft=draft))
    obs = env.step(SupportTriageAction(verb="submit"))
    assert obs.done is True
    assert obs.terminal_grader_score is not None
    assert obs.terminal_grader_score > 0.85


# ─── SLA mechanics ────────────────────────────────────────────


def test_sla_countdown() -> None:
    env = _make_env()
    obs = env.reset(task_key="medium_infra")
    initial_sla = obs.sla_remaining_steps
    obs = env.step(SupportTriageAction(verb="noop"))
    assert obs.sla_remaining_steps == initial_sla - 1


def test_sla_breach_penalty() -> None:
    """Score should be reduced when SLA is breached."""
    env = _make_env()
    env.reset(task_key="medium_infra")
    sla = TASKS["medium_infra"].sla_steps
    # Burn through SLA steps
    for _ in range(sla + 1):
        env.step(SupportTriageAction(verb="noop"))
    env.step(SupportTriageAction(verb="set_priority", priority=1))
    obs = env.step(SupportTriageAction(verb="submit"))
    assert obs.done is True
    # Should be penalized (0.85x)
    assert obs.terminal_grader_score is not None
    assert obs.terminal_grader_score < 1.0


# ─── Escalation ───────────────────────────────────────────────


def test_escalation_hard() -> None:
    """Escalation on hard task should be rewarded."""
    env = _make_env()
    env.reset(task_key="hard_security")
    obs = env.step(SupportTriageAction(verb="escalate", escalate_to="L2"))
    assert obs.escalated is True
    assert obs.reward > -0.02  # should have positive bonus


def test_escalation_easy_penalized() -> None:
    """Unnecessary escalation on easy task should be penalized."""
    env = _make_env()
    env.reset(task_key="easy_billing")
    obs = env.step(SupportTriageAction(verb="escalate", escalate_to="L2"))
    assert obs.escalated is True
    assert obs.reward < -0.02  # should have penalty


# ─── Max steps ────────────────────────────────────────────────


def test_max_steps_auto_grade() -> None:
    env = _make_env()
    env.reset(task_key="easy_billing")
    obs = None
    for _ in range(env.MAX_STEPS):
        obs = env.step(SupportTriageAction(verb="noop"))
        if obs.done:
            break
    assert obs is not None
    assert obs.done is True
    assert obs.terminal_grader_score is not None
    # Auto-grade has 0.75x penalty
    assert obs.terminal_grader_score <= 0.75


# ─── State ────────────────────────────────────────────────────


def test_state_property() -> None:
    env = _make_env()
    env.reset(task_key="easy_billing")
    env.step(SupportTriageAction(verb="set_category", category="billing"))
    state = env.state
    assert state.category_guess == "billing"
    assert state.task_key == "easy_billing"
    assert len(state.actions_taken) == 1


# ─── Info dict ────────────────────────────────────────────────


def test_info_populated() -> None:
    env = _make_env()
    env.reset(task_key="easy_billing")
    obs = env.step(SupportTriageAction(verb="noop"))
    assert "sla_remaining_steps" in obs.info
    assert "actions_so_far" in obs.info
    assert obs.info["actions_so_far"] == 1
