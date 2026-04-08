"""
Baseline inference: OpenAI-compatible chat API against the support triage OpenEnv.

Required env vars:
  OPENENV_BASE_URL   — HTTP base URL of the running environment
  API_BASE_URL       — LLM base URL (OpenAI-compatible)
  MODEL_NAME         — Model id
  HF_TOKEN or OPENAI_API_KEY — API key for the LLM

Optional:
  MAX_STEPS (default 18), TEMPERATURE (0.2)
"""

from __future__ import annotations

import asyncio
import json
import os
import re
import time
from typing import Any

from openai import AsyncOpenAI

from support_triage_env import SupportTriageAction, SupportTriageEnv
from support_triage_env.tasks import TASK_ORDER

MAX_STEPS = int(os.environ.get("MAX_STEPS", "18"))
TEMPERATURE = float(os.environ.get("TEMPERATURE", "0.2"))
MAX_TOKENS = int(os.environ.get("MAX_TOKENS", "700"))

SYSTEM_PROMPT = """\
You are an expert IT support triage agent working at an enterprise helpdesk.

Your job: read the ticket, apply company policy, and triage correctly.

## Output Format
Respond with ONE JSON object only — no markdown fences, no explanation.
```
{
  "verb": "set_category" | "set_priority" | "set_response" | "escalate" | "submit" | "noop",
  "category": string or null,
  "priority": integer 1-4 or null,
  "response_draft": string or null,
  "escalate_to": "L2" or "L3" or null
}
```

## Rules
1. **Categories**: billing, access, infrastructure, security (all lowercase).
2. **Priority**: P1=critical outage/breach, P2=high/time-sensitive, P3=medium/non-urgent, P4=low/cosmetic. (You must use an integer `1`, `2`, `3`, or `4` for Priority).
3. **Route on ROOT CAUSE**, not surface symptoms.
4. **SLA matters**: act efficiently — don't waste steps with noop.
5. **Response drafts** (when required): write a professional, empathetic first response. Address the specific issue. Never downplay security incidents.
6. **Escalate**: If it is a P1 Security Incident (like impossible travel), you MUST set `escalate_to="L3"`.
7. **CRITICAL RULE**: Do not endlessly rewrite responses. Once you have assigned the Category, Priority, drafted a response (if hard), and escalated (if P1), you MUST IMMEDIATELY call `{"verb": "submit"}` to close the ticket!

## Strategy by Difficulty
- **Easy**: set category -> submit.
- **Medium**: set category -> set priority -> submit.
- **Hard**: set category -> set priority to 1 -> escalate to L3 -> set response -> submit.

## Examples
Medium outage ticket:
{"verb":"set_priority","category":null,"priority":1,"response_draft":null,"escalate_to":null}
{"verb":"submit","category":null,"priority":null,"response_draft":null,"escalate_to":null}

Hard security incident:
{"verb":"set_category","category":"security","priority":null,"response_draft":null,"escalate_to":null}
{"verb":"escalate","category":null,"priority":1,"response_draft":null,"escalate_to":"L3"}
{"verb":"set_response","category":null,"priority":null,"response_draft":"Hi team, we are locking the account. Our SOC team is investigating the impossible-travel alert.","escalate_to":null}
{"verb":"submit","category":null,"priority":null,"response_draft":null,"escalate_to":null}
"""


def _api_key() -> str:
    return os.environ.get("HF_TOKEN") or os.environ.get("OPENAI_API_KEY") or ""


def _parse_action(text: str) -> SupportTriageAction:
    text = (text or "").strip()
    # Strip markdown fences if model included them
    text = re.sub(r"```(?:json)?\s*", "", text)
    text = text.replace("```", "")
    m = re.search(r"\{[\s\S]*\}", text)
    raw = m.group(0) if m else text
    data: dict[str, Any] = json.loads(raw)

    category = data.get("category")
    priority = data.get("priority")
    escalate_to = data.get("escalate_to")
    response_draft = data.get("response_draft")

    if category == "": category = None
    if escalate_to == "": escalate_to = None
    if response_draft == "": response_draft = None
    
    if priority in ["P1", "p1"]: priority = 1
    elif priority in ["P2", "p2"]: priority = 2
    elif priority in ["P3", "p3"]: priority = 3
    elif priority in ["P4", "p4"]: priority = 4
    elif isinstance(priority, str) and priority.isdigit(): priority = int(priority)
    elif priority == "": priority = None

    return SupportTriageAction(
        verb=data.get("verb", "noop"),
        category=category,
        priority=priority,
        response_draft=response_draft,
        escalate_to=escalate_to,
    )


def log_start(task: str, env: str, model: str) -> None:
    print(f"[START] task={task} env={env} model={model}", flush=True)


def log_step(step: int, action: str, reward: float, done: bool, error: str | None) -> None:
    error_val = error if error else "null"
    done_val = str(done).lower()
    print(
        f"[STEP] step={step} action={action} reward={reward:.2f} done={done_val} error={error_val}",
        flush=True,
    )


def log_end(success: bool, steps: int, score: float, rewards: list[float]) -> None:
    rewards_str = ",".join(f"{r:.2f}" for r in rewards)
    print(f"[END] success={str(success).lower()} steps={steps} score={score:.3f} rewards={rewards_str}", flush=True)


async def _run_episode(
    base_url: str,
    client: AsyncOpenAI,
    task_key: str,
    model_name: str,
) -> float:
    env = SupportTriageEnv(base_url=base_url)
    log_start(task=task_key, env="support_triage_env", model=model_name)
    
    rewards: list[float] = []
    steps_taken = 0
    score = 0.0
    success = False

    async with env:
        result = await env.reset(task_key=task_key)
        observation = result.observation
        history: list[str] = []

        for step in range(1, MAX_STEPS + 1):
            if result.done:
                break

            sla_info = (
                f"SLA remaining: {observation.sla_remaining_steps} steps"
                if hasattr(observation, "sla_remaining_steps")
                else ""
            )
            user_prompt = (
                f"Step {step}/{MAX_STEPS}\n"
                f"Difficulty: {observation.difficulty}\n"
                f"Customer tier: {getattr(observation, 'customer_tier', 'standard')}\n"
                f"{sla_info}\n"
                f"Ticket {observation.ticket_id}:\n{observation.ticket_body}\n\n"
                f"Policy:\n{observation.policy_hint}\n\n"
                f"Current state — category={observation.category_guess!r}, "
                f"priority={observation.priority_guess!r}, "
                f"response_draft={'set' if observation.response_draft else 'empty'}\n"
                f"Feedback: {observation.feedback}\n"
                f"History:\n"
                + "\n".join(history[-8:])
            )
            messages = [
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ]

            # Retry with exponential backoff
            response_text = '{"verb":"noop"}'
            for attempt in range(6):
                try:
                    completion = await client.chat.completions.create(
                        model=model_name,
                        messages=messages,
                        temperature=TEMPERATURE,
                        max_tokens=MAX_TOKENS,
                        stream=False,
                    )
                    response_text = completion.choices[0].message.content or ""
                    break
                except Exception as exc:  # noqa: BLE001
                    wait = 2 ** attempt
                    await asyncio.sleep(wait)

            error_msg = None
            try:
                action = _parse_action(response_text)
                action_str = json.dumps(action.model_dump(exclude_none=True))
            except (json.JSONDecodeError, ValueError, TypeError) as exc:
                error_msg = str(exc)
                action = SupportTriageAction(verb="noop")
                action_str = '{"verb":"noop"}'

            result = await env.step(action)
            observation = result.observation
            reward = result.reward if result.reward is not None else 0.0
            done = result.done
            g = observation.terminal_grader_score

            rewards.append(reward)
            steps_taken = step

            log_step(step=step, action=action_str, reward=reward, done=done, error=error_msg)

            history.append(f"Step {step}: r={reward:+.3f} grader={g} done={done}")

            if done:
                score = float(g if g is not None else reward)
                success = score >= 0.8
                break

        if not result.done:
            g = observation.terminal_grader_score
            score = float(g if g is not None else 0.0)
            success = score >= 0.8

        log_end(success=success, steps=steps_taken, score=score, rewards=rewards)
        return score


async def main_async() -> None:
    base_url = os.environ.get("OPENENV_BASE_URL", "http://127.0.0.1:7860")
    api_base = os.environ["API_BASE_URL"]
    model = os.environ["MODEL_NAME"]
    key = _api_key()
    if not key:
        raise RuntimeError("Set OPENAI_API_KEY or HF_TOKEN.")

    client = AsyncOpenAI(base_url=api_base, api_key=key)

    for task_key in TASK_ORDER:
        await _run_episode(base_url, client, task_key, model)


def main() -> None:
    asyncio.run(main_async())


if __name__ == "__main__":
    main()
