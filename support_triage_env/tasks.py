"""
Deterministic task definitions: enterprise IT support triage scenarios.

Each task simulates a realistic helpdesk ticket with:
- Multi-paragraph ticket body (email-style with headers/context)
- Company policy excerpts the agent must reason over
- SLA constraints and customer-tier metadata
- Gold-standard answers for deterministic grading
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Dict, List, Literal, Optional


@dataclass(frozen=True)
class TaskSpec:
    key: str
    difficulty: Literal["easy", "medium", "hard"]
    ticket_id: str
    ticket_body: str
    policy_hint: str
    gold_category: Optional[str]
    gold_priority: Optional[int]
    required_phrases: List[str] = field(default_factory=list)
    forbidden_phrases: List[str] = field(default_factory=list)
    sla_steps: int = 12
    customer_tier: Literal["enterprise", "standard", "trial"] = "standard"
    expected_min_steps: int = 1
    red_herring_note: str = ""


# Canonical categories for all tasks
CATEGORIES = ("billing", "access", "infrastructure", "security")


TASKS: Dict[str, TaskSpec] = {
    # ──────────────────────────────────────────────────────────
    # EASY — Category-only routing (billing duplicate invoice)
    # ──────────────────────────────────────────────────────────
    "easy_billing": TaskSpec(
        key="easy_billing",
        difficulty="easy",
        ticket_id="INC-2041",
        ticket_body=(
            "From: priya.mehta@acmecorp.com\n"
            "To: support@helpdeskpro.io\n"
            "Subject: Invoice #INV-8832 — duplicate charge on 12 Mar\n"
            "Priority requested: Normal\n"
            "Customer tier: Standard\n"
            "Date: 2025-03-13 09:14 UTC\n"
            "\n"
            "Hi Support,\n\n"
            "Our finance team flagged that Invoice #INV-8832 (March subscription "
            "renewal, $4,200) was charged twice to PO-91102 on 12 March. The "
            "duplicate transaction ref is TXN-44810.\n\n"
            "We've confirmed with our bank that both debits cleared. Could you "
            "please reverse the duplicate charge and send a corrected invoice? "
            "Our finance close is on 20 Mar, so we'd appreciate a resolution "
            "before then.\n\n"
            "Attached: bank statement excerpt (redacted).\n\n"
            "Thanks,\n"
            "Priya Mehta — Finance Ops, AcmeCorp"
        ),
        policy_hint=(
            "=== ROUTING POLICY (excerpt) ===\n"
            "• Billing & Licensing: invoices, POs, refund requests, subscription "
            "changes, license transfers → route to BILLING queue.\n"
            "• Access & Identity: password resets, SSO issues, MFA enrollment, "
            "new-user provisioning → route to ACCESS queue.\n"
            "• Infrastructure: outages (SEV-1/2), performance degradation, cluster "
            "scaling, DNS issues → route to INFRASTRUCTURE queue.\n"
            "• Security: compromised credentials, phishing reports, vulnerability "
            "disclosures, suspicious login alerts → route to SECURITY queue.\n"
            "\n"
            "When in doubt, prefer the queue whose SLA best matches the customer's "
            "urgency. Billing issues rarely warrant P1."
        ),
        gold_category="billing",
        gold_priority=None,
        required_phrases=[],
        sla_steps=15,
        customer_tier="standard",
    ),

    # ──────────────────────────────────────────────────────────
    # MEDIUM — Priority assignment (infrastructure outage)
    # ──────────────────────────────────────────────────────────
    "medium_infra": TaskSpec(
        key="medium_infra",
        difficulty="medium",
        ticket_id="INC-5590",
        ticket_body=(
            "From: ops-oncall@shopstream.io\n"
            "To: support@helpdeskpro.io\n"
            "Subject: SEV-1 — Primary Postgres cluster DOWN (checkout flow)\n"
            "Priority requested: URGENT\n"
            "Customer tier: Enterprise (Platinum SLA)\n"
            "Date: 2025-03-14 09:12 UTC\n"
            "\n"
            "CRITICAL INCIDENT — all production checkout paths are failing.\n\n"
            "Timeline:\n"
            "• 09:08 UTC — Monitoring fired: primary PG cluster (checkout-db-prod-01) "
            "unreachable. Replica lag spiked to >30 s before connection pool "
            "exhaustion.\n"
            "• 09:10 UTC — Storefront returns HTTP 503 on all /checkout/* endpoints. "
            "Error-budget burn rate: 47x normal.\n"
            "• 09:12 UTC — PagerDuty escalated to infra + payments on-call. War room "
            "opened in #inc-5590.\n\n"
            "Impact: ~12,000 customers/min see checkout failures. Estimated revenue "
            "loss: $8,400/min based on trailing-7d GMV.\n\n"
            "We need:\n"
            "1. Immediate mitigation (failover to read-replica or secondary region)\n"
            "2. ETA for full restoration\n"
            "3. Customer-facing status-page update\n\n"
            "Please treat as highest priority.\n\n"
            "— ShopStream Ops On-Call"
        ),
        policy_hint=(
            "=== PRIORITY RUBRIC ===\n"
            "P1 — Critical: customer-visible production outage, data loss risk, or "
            "security breach in progress. Response SLA: 15 min (Enterprise), "
            "30 min (Standard).\n"
            "P2 — High: major degradation with partial workaround available, or "
            "suspected credential compromise. Response SLA: 1 h.\n"
            "P3 — Medium: non-urgent bug affecting a subset of users, scheduled "
            "maintenance follow-up. Response SLA: 4 h.\n"
            "P4 — Low: cosmetic issue, general question, feature request, or "
            "documentation correction. Response SLA: 1 business day.\n"
            "\n"
            "Key heuristic: if REVENUE or DATA INTEGRITY is at immediate risk → P1. "
            "If workaround exists → P2 at most."
        ),
        gold_category=None,
        gold_priority=1,
        required_phrases=[],
        sla_steps=8,
        customer_tier="enterprise",
    ),

    # ──────────────────────────────────────────────────────────
    # MEDIUM — Access issue (red herring: looks like billing)
    # ──────────────────────────────────────────────────────────
    "medium_access": TaskSpec(
        key="medium_access",
        difficulty="medium",
        ticket_id="INC-3327",
        ticket_body=(
            "From: david.chen@globalfin.com\n"
            "To: support@helpdeskpro.io\n"
            "Subject: Can't access billing portal — SSO loop\n"
            "Priority requested: High\n"
            "Customer tier: Enterprise (Gold SLA)\n"
            "Date: 2025-03-15 14:42 UTC\n"
            "\n"
            "Hi,\n\n"
            "I'm the billing admin for GlobalFin (account #GF-20481). Since this "
            "morning I can't log into the billing portal — I get redirected in an "
            "SSO loop (SAML assertion fails with error RESP_INVALID_AUDIENCE). "
            "I've cleared cookies, tried incognito, and a different browser.\n\n"
            "Our IdP (Okta) shows the SAML app is correctly configured and other "
            "SP-initiated logins work fine. This only affects the billing portal "
            "endpoint (billing.helpdeskpro.io).\n\n"
            "I need access restored ASAP because I must approve a $38,000 renewal "
            "invoice by EOD Friday or our contract lapses.\n\n"
            "Note: I do NOT need a billing adjustment — I just can't reach the "
            "page to approve the existing invoice.\n\n"
            "Thanks,\n"
            "David Chen — IT Finance Lead, GlobalFin"
        ),
        policy_hint=(
            "=== ROUTING POLICY (excerpt) ===\n"
            "Route based on ROOT CAUSE, not surface symptoms:\n"
            "• If the user can't access a system due to SSO/SAML/IdP/MFA issues → "
            "ACCESS queue (even if the system they're trying to reach is billing, "
            "analytics, etc.).\n"
            "• If the user has access but the data/invoice/charge is wrong → "
            "BILLING queue.\n"
            "• Misrouting wastes ~40 min per ticket on average.\n"
            "\n"
            "=== PRIORITY RUBRIC ===\n"
            "P1 — Critical: production outage, data loss, active breach.\n"
            "P2 — High: major degradation, time-sensitive blocker (contract "
            "deadlines, audit deadlines). Workaround may exist but is impractical.\n"
            "P3 — Medium: non-urgent bug, subset of users affected.\n"
            "P4 — Low: cosmetic, question, feature request."
        ),
        gold_category="access",
        gold_priority=2,
        required_phrases=[],
        forbidden_phrases=[],
        sla_steps=10,
        customer_tier="enterprise",
        red_herring_note=(
            "Subject line mentions 'billing portal' but root cause is SSO/access. "
            "Agent must route to ACCESS, not BILLING."
        ),
    ),

    # ──────────────────────────────────────────────────────────
    # HARD — Full triage: category + priority + response draft
    #        (security incident, credential compromise)
    # ──────────────────────────────────────────────────────────
    "hard_security": TaskSpec(
        key="hard_security",
        difficulty="hard",
        ticket_id="INC-9103",
        ticket_body=(
            "From: soc-alerts@threatwatch.internal\n"
            "To: support@helpdeskpro.io\n"
            "CC: ciso@acmecorp.com, it-security@acmecorp.com\n"
            "Subject: ALERT — Impossible-travel VPN logins for jgarcia@acmecorp.com\n"
            "Severity: HIGH\n"
            "Customer tier: Enterprise (Platinum SLA)\n"
            "Date: 2025-03-14 22:03 UTC\n"
            "\n"
            "=== AUTOMATED THREAT INTELLIGENCE ALERT ===\n\n"
            "Detection rule: IMPOSSIBLE_TRAVEL_VPN\n"
            "User: jgarcia@acmecorp.com (Engineering — Senior SRE)\n"
            "Risk score: 87/100\n\n"
            "Timeline of anomalous events:\n"
            "• 21:47 UTC — Successful VPN auth from Chicago, IL (corporate IP "
            "range, usual location). Session duration: 4 min.\n"
            "• 21:53 UTC — Successful VPN auth from Lagos, Nigeria (residential "
            "ISP, never-before-seen geo). Session active.\n"
            "• 21:55 UTC — 14 failed SSH attempts to prod bastion host from the "
            "Lagos session. Brute-force pattern detected.\n"
            "• 22:01 UTC — User jgarcia confirmed via Slack that they logged off "
            "at 21:48 and their laptop is powered down.\n\n"
            "Indicators:\n"
            "• Credential compromise highly likely (stolen session token or "
            "password).\n"
            "• Attacker has/had VPN access to internal network.\n"
            "• SSH brute-force suggests lateral movement attempt.\n\n"
            "Employee's manager (R. Hoffmann) has been notified.\n\n"
            "Recommended immediate actions per Incident Response Playbook §4.2:\n"
            "1. Force MFA re-enrollment for jgarcia\n"
            "2. Revoke all active sessions and API tokens\n"
            "3. Temporarily lock the account pending SOC investigation\n"
            "4. Preserve VPN and SSH logs for forensics\n\n"
            "— ThreatWatch Automated Alert System"
        ),
        policy_hint=(
            "=== SECURITY INCIDENT RESPONSE POLICY ===\n"
            "For suspected credential compromise:\n"
            "1. Route to SECURITY queue immediately.\n"
            "2. Priority: P2 minimum (P1 if active data exfiltration confirmed). "
            "Impossible-travel with brute-force but no confirmed data loss → P2.\n"
            "3. First response MUST:\n"
            "   a) Confirm the account will be locked pending investigation\n"
            "   b) State that MFA reset will be enforced before reactivation\n"
            "   c) NOT promise a specific resolution timeline (forensics may take "
            "      days)\n"
            "   d) NOT downplay the severity or tell the user to 'ignore' the alert\n"
            "\n"
            "=== PRIORITY RUBRIC ===\n"
            "P1 — Critical: active data exfiltration, production outage, ransomware.\n"
            "P2 — High: suspected credential compromise, time-sensitive blocker.\n"
            "P3 — Medium: non-urgent bug, partial degradation.\n"
            "P4 — Low: cosmetic, question, feature request."
        ),
        gold_category="security",
        gold_priority=2,
        required_phrases=["mfa", "lock"],
        forbidden_phrases=["ignore", "not a problem", "no action needed", "false alarm"],
        sla_steps=6,
        customer_tier="enterprise",
        expected_min_steps=3,
    ),

    # ──────────────────────────────────────────────────────────
    # HARD — Regulatory Compliance (GDPR / PII Leak)
    # ──────────────────────────────────────────────────────────
    "hard_privacy": TaskSpec(
        key="hard_privacy",
        difficulty="hard",
        ticket_id="INC-4002",
        ticket_body=(
            "From: marcus.webb@proton.me\n"
            "To: privacy@helpdeskpro.io\n"
            "Subject: Global Privacy Request — Account ID: MW-9921\n"
            "Priority requested: High\n"
            "Customer tier: Standard\n"
            "Date: 2025-03-16 11:10 UTC\n"
            "\n"
            "To the Privacy Officer,\n\n"
            "I wish to exercise my 'Right to Erasure' (Right to be Forgotten) under "
            "GDPR Article 17. Please delete all my personal data associated with "
            "email marcus.webb@proton.me and Account MW-9921.\n\n"
            "To verify my identity, I have attached a screenshot of my last "
            "transaction, which shows my card number: 4111-2222-3333-4444.\n\n"
            "Please confirm once the deletion is complete.\n\n"
            "Regards,\n"
            "Marcus Webb"
        ),
        policy_hint=(
            "=== DATA PRIVACY & GDPR POLICY ===\n"
            "1. PII Safety: Never repeat or 'echo' sensitive PII (Credit Card numbers, "
            "SSNs, Passwords) in a ticket response. Use masks (e.g., 'your card "
            "ending in 4444') if necessary for verification.\n"
            "2. Verification: Identity must be verified via SSO or official photo ID. "
            "User-provided PII in an unencrypted email is NOT a valid verification.\n"
            "3. Deletion: Only the LEGAL department can perform a 'Hard Deletion' "
            "from backups. Agents must ESCALATE to L3 (Legal Team) for RTBF requests.\n"
            "\n"
            "Violation of PII safety results in immediate security audit failure."
        ),
        gold_category="security",
        gold_priority=3,
        required_phrases=["legal", "privacy", "lock", "verify"],
        forbidden_phrases=["4111", "2222", "3333", "4444", "confirming deletion"],
        sla_steps=8,
        customer_tier="standard",
        expected_min_steps=2,
    ),
}


TASK_ORDER: tuple[str, ...] = (
    "easy_billing",
    "medium_infra",
    "medium_access",
    "hard_security",
    "hard_privacy",
)


def task_key_for_seed(seed: int | None) -> str:
    """Pick one of the tasks deterministically."""
    if seed is None:
        return TASK_ORDER[0]
    idx = int(seed) % len(TASK_ORDER)
    return TASK_ORDER[idx]
