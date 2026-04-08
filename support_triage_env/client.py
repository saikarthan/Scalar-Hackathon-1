"""
WebSocket client for the support triage environment.
"""

from __future__ import annotations

from typing import Any, Dict

from openenv.core.client_types import StepResult
from openenv.core.env_client import EnvClient

from support_triage_env.models import (
    SupportTriageAction,
    SupportTriageObservation,
    SupportTriageState,
)


class SupportTriageEnv(
    EnvClient[SupportTriageAction, SupportTriageObservation, SupportTriageState]
):
    def _step_payload(self, action: SupportTriageAction) -> Dict[str, Any]:
        return action.model_dump()

    def _parse_result(self, payload: Dict[str, Any]) -> StepResult[SupportTriageObservation]:
        obs = SupportTriageObservation(**payload["observation"])
        return StepResult(
            observation=obs,
            reward=payload.get("reward"),
            done=bool(payload.get("done", False)),
        )

    def _parse_state(self, payload: Dict[str, Any]) -> SupportTriageState:
        return SupportTriageState(**payload)
