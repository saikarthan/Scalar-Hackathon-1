"""
Typed Action, Observation, State, and Reward models for enterprise support triage.

Supports SLA-aware rewards, escalation mechanics, and rich diagnostic metadata.
"""

from __future__ import annotations

from typing import Dict, List, Literal, Optional

from pydantic import BaseModel, Field

from openenv.core.env_server.types import Action, Observation, State


class TrajectoryReward(BaseModel):
    """Structured reward signal (dense + terminal grader components)."""

    dense: float = Field(
        0.0, description="Per-step shaping: partial progress, penalties, time cost"
    )
    grader: Optional[float] = Field(
        None,
        ge=0.0,
        le=1.0,
        description="Final task score from deterministic grader (set on submit or episode end)",
    )
    total: float = Field(
        0.0, description="Scalar used as observation.reward (dense + terminal bump)"
    )


class SupportTriageAction(Action):
    """Agent action for triaging a simulated support ticket."""

    verb: Literal[
        "set_category", "set_priority", "set_response", "submit", "escalate", "noop"
    ] = "noop"
    category: Optional[str] = None
    priority: Optional[int] = Field(
        None, ge=1, le=4, description="1=highest urgency, 4=lowest"
    )
    response_draft: Optional[str] = None
    escalate_to: Optional[Literal["L2", "L3"]] = Field(
        None, description="Escalation target (only with verb='escalate')"
    )


class SupportTriageObservation(Observation):
    """What the agent sees after reset or each step."""

    ticket_id: str = ""
    difficulty: Literal["easy", "medium", "hard"] = "easy"
    ticket_body: str = ""
    policy_hint: str = ""

    # Current agent guesses
    category_guess: Optional[str] = None
    priority_guess: Optional[int] = Field(None, ge=1, le=4)
    response_draft: Optional[str] = None

    # Expert Knowledge (RAG)
    kb_results: List[str] = Field(default_factory=list)

    # Feedback and progress
    feedback: str = ""
    step_index: int = 0
    max_steps: int = 24

    # SLA pressure
    sla_remaining_steps: int = Field(
        12, description="Steps remaining before SLA breach (penalty kicks in)"
    )
    customer_tier: Literal["enterprise", "standard", "trial"] = "standard"

    # Escalation state
    escalated: bool = False
    escalated_to: Optional[str] = None

    # Terminal output
    terminal_grader_score: Optional[float] = Field(
        None, ge=0.0, le=1.0, description="Last computed 0–1 grader (episode outcome)"
    )
    reward_model: TrajectoryReward = Field(
        default_factory=TrajectoryReward,
        description="Structured reward (also mirrored into .reward)",
    )

    # Diagnostic info
    info: Dict[str, object] = Field(
        default_factory=dict,
        description="Step-level diagnostics (actions_taken, sla_status, etc.)",
    )


class SupportTriageState(State):
    """Server-side episode state exposed via state()."""

    task_key: str = ""
    difficulty: Literal["easy", "medium", "hard"] = "easy"
    submitted: bool = False
    noop_streak: int = 0
    category_guess: Optional[str] = None
    priority_guess: Optional[int] = Field(None, ge=1, le=4)
    response_excerpt: Optional[str] = None
    escalated: bool = False
    escalated_to: Optional[str] = None
    actions_taken: List[str] = Field(default_factory=list)
    sla_breached: bool = False
    customer_tier: Literal["enterprise", "standard", "trial"] = "standard"
