"""
Deterministic graders: map final agent state + drafts to scores in [0.0, 1.0].

Scoring approach by difficulty:
- Easy:   category match (binary)
- Medium: category + priority with partial credit for near-misses
- Hard:   weighted blend of category, priority, required phrases,
          forbidden phrase avoidance, and response quality indicators
"""

from __future__ import annotations

import re
from typing import Iterable, List

from .tasks import TaskSpec

# ─── Professional response quality indicators ───────────────────────

_PROFESSIONALISM_PHRASES = [
    "we will", "we are", "investigating", "immediately",
    "apolog", "next steps", "follow up", "update you",
    "thank you", "please", "your account", "our team",
]

_MIN_RESPONSE_LENGTH = 40  # chars — anything shorter is too terse


def _norm_cat(s: str | None) -> str:
    if not s:
        return ""
    return re.sub(r"\s+", " ", s.strip().lower())


def _contains_all(haystack: str, needles: Iterable[str]) -> bool:
    h = haystack.lower()
    return all(n.lower() in h for n in needles)


def _contains_any(haystack: str, needles: Iterable[str]) -> bool:
    h = haystack.lower()
    return any(n.lower() in h for n in needles)


def _response_quality_score(text: str) -> float:
    """Score response draft quality on a 0–1 scale based on professionalism."""
    if not text or len(text.strip()) < _MIN_RESPONSE_LENGTH:
        return 0.0

    score = 0.0
    text_lower = text.lower()

    # Length bonus (up to 0.3): longer, more detailed responses score higher
    length_ratio = min(len(text.strip()) / 200, 1.0)
    score += 0.3 * length_ratio

    # Professionalism phrases (up to 0.5)
    hits = sum(1 for p in _PROFESSIONALISM_PHRASES if p in text_lower)
    phrase_ratio = min(hits / 4, 1.0)  # 4+ phrases = full credit
    score += 0.5 * phrase_ratio

    # Structured (has greeting/closing) (up to 0.2)
    has_greeting = any(g in text_lower for g in ["hi", "hello", "dear", "team"])
    has_closing = any(
        c in text_lower for c in ["regards", "thanks", "sincerely", "best"]
    )
    score += 0.1 * int(has_greeting) + 0.1 * int(has_closing)

    return round(min(score, 1.0), 4)


def _forbidden_penalty(text: str, forbidden: List[str]) -> float:
    """Return 1.0 if no forbidden phrases found, 0.0 if any are present."""
    if not forbidden or not text:
        return 1.0
    return 0.0 if _contains_any(text, forbidden) else 1.0


def grade_task(
    spec: TaskSpec,
    category: str | None,
    priority: int | None,
    response_draft: str | None,
) -> float:
    """
    Return a score in [0.0, 1.0].

    Easy:   category match only.
    Medium: category (if gold) + priority with near-miss partial credit.
    Hard:   weighted blend — category, priority, required phrases,
            forbidden phrase avoidance, and response quality.
    """
    # ── Easy ──
    if spec.difficulty == "easy":
        return 1.0 if _norm_cat(category) == _norm_cat(spec.gold_category) else 0.0

    # ── Medium ──
    if spec.difficulty == "medium":
        parts: list[float] = []

        if spec.gold_category is not None:
            parts.append(
                1.0 if _norm_cat(category) == _norm_cat(spec.gold_category) else 0.0
            )

        if spec.gold_priority is not None:
            if priority == spec.gold_priority:
                parts.append(1.0)
            elif priority is not None and abs(priority - spec.gold_priority) == 1:
                parts.append(0.4)  # near-miss partial credit
            else:
                parts.append(0.0)

        if not parts:
            return 0.0
        return round(sum(parts) / len(parts), 4)

    # ── Hard ──
    weights: list[tuple[float, float]] = []  # (weight, score)

    # Category match (weight 0.25)
    if spec.gold_category:
        cat_score = 1.0 if _norm_cat(category) == _norm_cat(spec.gold_category) else 0.0
        weights.append((0.25, cat_score))

    # Priority match with partial credit (weight 0.20)
    if spec.gold_priority is not None:
        if priority == spec.gold_priority:
            pri_score = 1.0
        elif priority is not None and abs(priority - spec.gold_priority) == 1:
            pri_score = 0.4
        else:
            pri_score = 0.0
        weights.append((0.20, pri_score))

    # Required phrases in response draft (weight 0.25)
    text = response_draft or ""
    if spec.required_phrases:
        phrase_score = 1.0 if _contains_all(text, spec.required_phrases) else 0.0
        weights.append((0.25, phrase_score))

    # Forbidden phrase avoidance (weight 0.10)
    if spec.forbidden_phrases:
        forbid_score = _forbidden_penalty(text, spec.forbidden_phrases)
        weights.append((0.10, forbid_score))

    # Response quality (weight 0.20)
    quality = _response_quality_score(text)
    weights.append((0.20, quality))

    if not weights:
        return 0.0

    total_weight = sum(w for w, _ in weights)
    weighted_sum = sum(w * s for w, s in weights)
    return round(weighted_sum / total_weight, 4)


def partial_hint(
    spec: TaskSpec,
    category: str | None,
    priority: int | None,
) -> float:
    """Small 0–1 signal for intermediate field updates (not the final grader)."""
    if spec.difficulty == "easy":
        if spec.gold_category and _norm_cat(category) == _norm_cat(spec.gold_category):
            return 1.0
        return 0.0

    if spec.difficulty == "medium":
        parts: list[float] = []
        if spec.gold_category and _norm_cat(category) == _norm_cat(spec.gold_category):
            parts.append(1.0)
        if spec.gold_priority is not None:
            if priority == spec.gold_priority:
                parts.append(1.0)
            elif priority is not None and abs(priority - spec.gold_priority) == 1:
                parts.append(0.4)
        if not parts:
            return 0.0
        return sum(parts) / len(parts)

    # hard: partial credit for category + priority
    hit = 0.0
    if spec.gold_category and _norm_cat(category) == _norm_cat(spec.gold_category):
        hit += 0.5
    if spec.gold_priority is not None and priority == spec.gold_priority:
        hit += 0.5
    return hit
