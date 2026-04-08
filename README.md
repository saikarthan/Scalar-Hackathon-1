---
title: Support Triage OpenEnv
emoji: 🎧
colorFrom: blue
colorTo: green
sdk: docker
pinned: false
tags:
  - openenv
---

# 🎧 IT Support Triage — OpenEnv Environment

Enterprise-grade **IT support ticket triage** environment for training and evaluating AI agents. Implements the full [OpenEnv](https://github.com/meta-pytorch/OpenEnv) contract (`reset` / `step` / `state`) with typed Pydantic models, SLA-aware rewards, escalation mechanics, and deterministic graders.

## Why This Domain

| Metric | Value |
|---|---|
| Market size (2024) | **$26.4 billion** — AI in IT support |
| Growth rate | ~30% CAGR through 2032 |
| Enterprise adoption | Mission-critical at scale |
| Key capability tested | Unstructured text → structured decisions under time pressure |

## 🏢 Enterprise On-Prem Deployment (Rule 1)

The **Governance Gateway** is designed for high-security environments where data sovereignty is paramount. It can be deployed as a self-hosted "Appliance" inside your private VPC.

### Deployment Quickstart
1. **Configure Secrets**: Copy `.env.enterprise` to `.env` and add your scoped API tokens.
2. **Launch Stack**: Use Docker Compose to orchestrate the backend and frontend:
   ```bash
   docker-compose up -d --build
   ```
3. **Verify Compliance**: Access the local dashboard at `http://localhost:7860/admin/stats`.

### 🔒 The Rules of Trust
To ensure maximum security, the product follows three non-negotiable enterprise rules:
*   **Rule 1: Private Compute**: The gateway runs on *your* hardware. No raw customer data ever leaves your network.
*   **Rule 2: Least Privilege**: Connectors use **Scoped API Tokens** (Write-Only). The AI cannot read your historical database.
*   **Rule 3: Vault-First**: Supports integration with **AWS Secrets Manager** and **HashiCorp Vault** for secure key rotation.

---

## 🔒 IP Protection & Commercial Roadmap

While we provide a "Transparent Audit" layer for enterprise trust, our core **Adversarial Red-Team Logic** is protected through a multi-tiered IP strategy:

1. **Phase 1: Binary Obfuscation**: Production images use compiled Python (Nuitka/PyInstaller) to prevent reverse-engineering of the proprietary governance prompts.
2. **Phase 2: Hybrid "Brain" Architecture**: High-value, custom-trained Red Team scenarios can be served via a secure, encrypted SaaS API while the triage "Shield" remains on-prem.
3. **Phase 3: Proprietary Knowledge Base**: Our "Secret Sauce" includes the curated mapping of P1-P4 risks and multi-step reasoning traces that are legally protected under enterprise licensing.

Every enterprise support team triages 100+ tickets/day. This environment trains agents to do what humans do: read unstructured text, apply company policy, prioritize by SLA, and draft professional responses — all under time pressure.

## 📧 Live Real-World Email Integration

The Gateway can now poll a **real email inbox** (Gmail, Outlook, etc.) in the background.

### Setup Instructions:
1. **Generate an App Password**:
   - Go to your Google Account > Security > 2-Step Verification > **App Passwords**.
   - Select 'Mail' and 'Other (Name it: Governance Gateway)'.
   - Copy the 16-character code.
2. **Configure Environment**:
   ```bash
   export IMAP_USER="your-email@gmail.com"
   export IMAP_PASS="xxxx xxxx xxxx xxxx" 
   export IMAP_HOST="imap.gmail.com"
   ```
3. **Restart the Engine**:
   The `IMAPPoller` will automatically launch and begin watching for `UNSEEN` messages.

---

## 🏆 Hackathon Demo Script: "The Full Story"

## Architecture

```
┌─────────────────────────────────────────────────┐
│                 Agent (LLM)                      │
│  Reads ticket → applies policy → takes actions   │
└─────────┬───────────────────────────┬───────────┘
          │ SupportTriageAction       │ observe
          ▼                           │
┌─────────────────────────────────────────────────┐
│         SupportTriageEnvironment                 │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ TaskSpec  │  │ Graders  │  │ SLA Engine    │  │
│  │ (4 tasks) │  │ (0→1)    │  │ (countdown)   │  │
│  └──────────┘  └──────────┘  └───────────────┘  │
│  ┌──────────────────────────────────────────┐    │
│  │ Reward Shaping (dense + partial + grader)│    │
│  └──────────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

## Action Space (`SupportTriageAction`)

| Field | Type | Description |
|---|---|---|
| `verb` | enum | `set_category`, `set_priority`, `set_response`, `escalate`, `submit`, `noop` |
| `category` | string | `billing`, `access`, `infrastructure`, `security` |
| `priority` | int | **1** (critical) – **4** (low) |
| `response_draft` | string | Professional first-response text |
| `escalate_to` | string | `L2` or `L3` (escalation target) |

## Observation Space (`SupportTriageObservation`)

Key fields: `ticket_body`, `policy_hint`, `difficulty`, current guesses, `feedback`, `step_index`, `max_steps`, **`sla_remaining_steps`**, **`customer_tier`**, **`escalated`**, `terminal_grader_score`, `reward_model` (dense/grader/total), and **`info`** (diagnostics).

## Tasks & Difficulty

| Task | Difficulty | Objective | SLA (steps) | Customer |
|---|---|---|---|---|
| `easy_billing` | Easy | Route duplicate invoice → **billing** | 15 | Standard |
| `medium_infra` | Medium | Prioritize production outage → **P1** | 8 | Enterprise |
| `medium_access` | Medium | Route SSO failure → **access** (not billing!) | 10 | Enterprise |
| `hard_security` | Hard | Category + priority + professional response with **MFA** and **lock** | 6 | Enterprise |

> **Red herring**: `medium_access` has "billing portal" in the subject, but the root cause is an SSO/access issue. Agent must route on root cause, not surface symptoms.

## Reward Design

| Signal | When | Effect |
|---|---|---|
| Per-step cost | Every step | −0.02 (discourages dithering) |
| SLA time bonus | Before SLA breach | +0.01 × (remaining/total) |
| SLA breach penalty | SLA exceeded | −0.08 + 0.85× final score |
| Partial progress | Correct field set | +0.15 × improvement |
| Noop penalty | 4+ consecutive noops | −0.06 |
| Invalid category | Bad category string | −0.03 |
| Escalation (hard) | Escalate on hard task | +0.04 |
| Escalation (easy) | Unnecessary escalation | −0.05 |
| Max-steps penalty | Timeout | 0.75× final score |
| Forbidden phrases | Response has "ignore" etc. | Reduces grader score |

## Grading

- **Easy**: binary category match
- **Medium**: category + priority with **partial credit** (off-by-1 priority → 0.4)
- **Hard**: weighted blend — category (25%), priority (20%), required phrases (25%), forbidden-phrase avoidance (10%), response quality (20%)

Response quality scores: length, professionalism indicators, greeting/closing structure.

## Local Setup

```bash
pip install -e .
uvicorn server.app:app --host 0.0.0.0 --port 7860
```

Health check: `GET /health` → 200.

## Docker

```bash
docker build -t support-triage-env .
docker run --rm -p 7860:7860 -e PORT=7860 support-triage-env
```

HF Spaces sets `PORT` (often `7860`); the image respects `PORT`.

## Baseline Inference

```bash
set OPENENV_BASE_URL=http://127.0.0.1:7860
set API_BASE_URL=https://api.openai.com/v1
set MODEL_NAME=gpt-4o-mini
set OPENAI_API_KEY=sk-...
python inference.py
```

Runs all 4 tasks, prints per-task grader scores and mean.

## Tests

```bash
pip install -e ".[dev]"
pytest tests/ -v
```

49 tests covering graders, environment, SLA, escalation, and edge cases.

## Validation

```bash
pip install openenv-core
openenv validate
```

## OpenEnv Metadata

See `openenv.yaml` (FastAPI app entry: `server.app:app`).