"""
IT support triage environment: reset / step / state with SLA-aware shaped
rewards, escalation mechanics, and enterprise-grade feedback.
"""

from __future__ import annotations

import uuid
from typing import Any, Optional

from openenv.core.env_server.interfaces import Environment

from support_triage_env.graders import grade_task, partial_hint
from support_triage_env.knowledge_base import search_kb
from support_triage_env.models import (
    SupportTriageAction,
    SupportTriageObservation,
    SupportTriageState,
    TrajectoryReward,
)
from support_triage_env.server.stats_tracker import STATS
from support_triage_env.tasks import CATEGORIES, TASKS, task_key_for_seed


class SupportTriageEnvironment(
    Environment[SupportTriageAction, SupportTriageObservation, SupportTriageState]
):
    """
    Simulates routing, priority assignment, and first-response drafting for
    enterprise IT tickets with SLA pressure and escalation.

    One instance per WebSocket session; safe for concurrent sessions.
    """

    SUPPORTS_CONCURRENT_SESSIONS = True
    MAX_STEPS = 24

    def __init__(self) -> None:
        super().__init__(transform=None, rubric=None)
        self._state = SupportTriageState()
        self._spec = TASKS["easy_billing"]
        self._last_partial: float = 0.0

    # ─── reset ────────────────────────────────────────────────

    def reset(
        self,
        seed: Optional[int] = None,
        episode_id: Optional[str] = None,
        task_key: Optional[str] = None,
        **kwargs: Any,
    ) -> SupportTriageObservation:
        self._reset_rubric()
        tid = episode_id or str(uuid.uuid4())
        key = task_key or task_key_for_seed(seed)
        if key not in TASKS:
            key = "easy_billing"
        self._spec = TASKS[key]
        self._last_partial = 0.0
        self._state = SupportTriageState(
            episode_id=tid,
            step_count=0,
            task_key=key,
            difficulty=self._spec.difficulty,
            submitted=False,
            noop_streak=0,
            category_guess=None,
            priority_guess=None,
            response_excerpt=None,
            escalated=False,
            escalated_to=None,
            actions_taken=[],
            sla_breached=False,
            customer_tier=self._spec.customer_tier,
        )
        return self._obs(
            done=False,
            terminal_score=None,
            feedback=(
                f"New ticket loaded — {self._spec.difficulty.upper()} difficulty. "
                f"Customer tier: {self._spec.customer_tier}. "
                f"SLA budget: {self._spec.sla_steps} steps. "
                "Read the ticket and policy, then triage."
            ),
        )

    # ─── step ─────────────────────────────────────────────────

    def step(
        self,
        action: SupportTriageAction,
        timeout_s: Optional[float] = None,
        **kwargs: Any,
    ) -> SupportTriageObservation:
        if not isinstance(action, SupportTriageAction):
            raise ValueError(f"Expected SupportTriageAction, got {type(action)}")

        spec = self._spec
        st = self._state
        st.step_count += 1
        st.actions_taken.append(action.verb)

        feedback_parts: list[str] = []
        dense = -0.02  # small per-step cost
        terminal: Optional[float] = None
        done = False

        # ── SLA tracking ──
        sla_remaining = max(0, spec.sla_steps - st.step_count)
        if sla_remaining == 0 and not st.sla_breached:
            st.sla_breached = True
            feedback_parts.append("⚠ SLA breached — response time target exceeded.")
            dense -= 0.08

        # ── SLA pressure bonus (reward acting faster) ──
        if sla_remaining > 0 and st.step_count <= spec.sla_steps:
            time_bonus = 0.01 * (sla_remaining / spec.sla_steps)
            dense += time_bonus

        # ── Handle verb ──
        if action.verb == "noop":
            st.noop_streak += 1
            if st.noop_streak >= 4:
                dense -= 0.06
                feedback_parts.append(
                    "Repeated no-ops waste queue time. The customer is waiting."
                )
            elif st.noop_streak >= 2:
                dense -= 0.02
                feedback_parts.append("Idle — please take action on the ticket.")
        else:
            st.noop_streak = 0

        if action.verb == "set_category" and action.category is not None:
            cat = action.category.strip().lower()
            if cat not in CATEGORIES:
                feedback_parts.append(
                    f"Invalid category '{cat}'. Valid: {', '.join(CATEGORIES)}. "
                    "Category was NOT updated."
                )
                dense -= 0.03
            else:
                st.category_guess = cat
                feedback_parts.append(f"Category set to '{cat}'.")

        elif action.verb == "set_priority" and action.priority is not None:
            st.priority_guess = int(action.priority)
            feedback_parts.append(f"Priority set to P{st.priority_guess}.")

        elif action.verb == "set_response" and action.response_draft is not None:
            draft = action.response_draft.strip()
            st.response_excerpt = draft
            if len(draft) < 20:
                feedback_parts.append(
                    "Response draft saved, but it's very short. "
                    "Consider adding more detail for a professional reply."
                )
            else:
                feedback_parts.append("Response draft updated.")

        elif action.verb == "escalate":
            target = action.escalate_to or "L2"
            st.escalated = True
            st.escalated_to = target
            # Escalation scoring: helpful on hard tasks, wasteful on easy
            if spec.difficulty == "hard":
                dense += 0.04
                feedback_parts.append(
                    f"Ticket escalated to {target}. "
                    "Good call — this appears to be a serious incident."
                )
            elif spec.difficulty == "easy":
                dense -= 0.05
                feedback_parts.append(
                    f"Ticket escalated to {target}, but this is a routine issue. "
                    "Unnecessary escalation increases queue load."
                )
            else:
                feedback_parts.append(f"Ticket escalated to {target}.")

        elif action.verb == "submit":
            st.submitted = True
            terminal = grade_task(
                spec,
                st.category_guess,
                st.priority_guess,
                st.response_excerpt,
            )
            # SLA penalty: reduce score if SLA was breached
            if st.sla_breached:
                terminal = round(terminal * 0.85, 4)
            dense = 0.0
            done = True
            feedback_parts.append(
                f"Submitted. Grader score: {terminal:.3f}"
                + (" (SLA penalty applied)" if st.sla_breached else "")
            )

        # ── Max-steps auto-grade ──
        if st.step_count >= self.MAX_STEPS and not done:
            st.submitted = True
            terminal = grade_task(
                spec,
                st.category_guess,
                st.priority_guess,
                st.response_excerpt,
            )
            # Always penalise running out the clock
            terminal = round(terminal * 0.75, 4)
            done = True
            feedback_parts.append(
                f"Max steps reached — auto-graded with time penalty. Score: {terminal:.3f}"
            )

        # ── Global Stats Tracking ──
        if done and terminal is not None:
             STATS.record_session(
                task_key=st.task_key,
                score=terminal,
                sla_breached=st.sla_breached,
                steps=st.step_count
            )

        # ── Partial-progress shaping (only while episode is alive) ──
        if not done:
            ph = partial_hint(spec, st.category_guess, st.priority_guess)
            delta = max(0.0, ph - self._last_partial)
            self._last_partial = max(self._last_partial, ph)
            dense += 0.15 * delta
            if delta > 0:
                feedback_parts.append("✓ Closer to reference triage.")

            # Progressive hint: if agent is stuck
            if st.step_count >= 5 and self._last_partial < 0.3:
                feedback_parts.append(
                    "Hint: re-read the policy carefully — the routing guide and "
                    "priority rubric contain the information you need."
                )

        # ── Build reward model ──
        reward_model = TrajectoryReward(
            dense=round(dense, 4),
            grader=terminal,
            total=round(terminal if terminal is not None else dense, 4),
        )

        fb = " ".join(feedback_parts) if feedback_parts else "Continue triage."

        # ── Diagnostic info ──
        info = {
            "sla_remaining_steps": sla_remaining,
            "sla_breached": st.sla_breached,
            "actions_so_far": len(st.actions_taken),
            "escalated": st.escalated,
            "partial_progress": round(self._last_partial, 3),
        }

        return self._obs(
            done=done,
            terminal_score=terminal,
            feedback=fb,
            reward_model=reward_model,
            info=info,
        )

    # ─── helpers ──────────────────────────────────────────────

    def _obs(
        self,
        done: bool,
        terminal_score: Optional[float],
        feedback: str = "",
        reward_model: Optional[TrajectoryReward] = None,
        info: Optional[dict[str, object]] = None,
    ) -> SupportTriageObservation:
        spec = self._spec
        st = self._state
        if reward_model is None:
            reward_model = TrajectoryReward(dense=0.0, grader=None, total=0.0)

        sla_remaining = max(0, spec.sla_steps - st.step_count)
        kb_results = search_kb(spec.ticket_body)

        return SupportTriageObservation(
            done=done,
            reward=reward_model.total,
            ticket_id=spec.ticket_id,
            difficulty=spec.difficulty,
            ticket_body=spec.ticket_body,
            policy_hint=spec.policy_hint,
            kb_results=kb_results,
            category_guess=st.category_guess,
            priority_guess=st.priority_guess,
            response_draft=st.response_excerpt,
            feedback=feedback,
            step_index=st.step_count,
            max_steps=self.MAX_STEPS,
            sla_remaining_steps=sla_remaining,
            customer_tier=spec.customer_tier,
            escalated=st.escalated,
            escalated_to=st.escalated_to,
            terminal_grader_score=terminal_score,
            reward_model=reward_model,
            info=info or {},
        )

    @property
    def state(self) -> SupportTriageState:
        return self._state
