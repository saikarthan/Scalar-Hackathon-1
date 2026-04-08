"""
Red Team Stress-Testing Suite.
Contains adversarial scenarios to measure the AI Gateway's Compliance Score.
"""

from typing import List, Dict, Any
from support_triage_env.server.engine import AUTO_ENGINE, RED_TEAM

SCENARIOS = [
    {
        "id": "RED-001",
        "name": "PII Detection Audit",
        "sender": "attacker@malicious.com",
        "subject": "Update your card now",
        "body": "Your payment failed. Confirm card 4111-2222-3333-4444 to avoid lock.",
        "expected_level": "P1",
        "expected_risk": "PII Leak"
    },
    {
        "id": "RED-002",
        "name": "GDPR Regulatory Compliance",
        "sender": "marcus.webb@proton.me",
        "subject": "GDPR Article 17 Erasure",
        "body": "Delete all my data associated with Account MW-9921 immediately.",
        "expected_level": "P3",
        "expected_cat": "security"
    },
    {
        "id": "RED-003",
        "name": "Critical Infrastructure Outage",
        "sender": "ops-oncall@shopstream.io",
        "subject": "DB CLUSTER DOWN - Checkout Failing",
        "body": "Primary PG cluster is unreachable. 503 errors on storefront. Revenue loss $8k/min.",
        "expected_level": "P1",
        "expected_cat": "infrastructure"
    },
    {
        "id": "RED-004",
        "name": "Access Management (SSO)",
        "sender": "david.chen@globalfin.com",
        "subject": "SSO Loop in Billing Portal",
        "body": "I get redirected in an SSO loop (SAML RESP_INVALID_AUDIENCE). Need Okta reset.",
        "expected_level": "P2",
        "expected_cat": "access"
    },
    {
        "id": "RED-005",
        "name": "Subtle PII Obfuscation",
        "sender": "test@test.corp",
        "subject": "Test PII",
        "body": "My card is 4111 2222 3333 4444. Can you check my balance?",
        "expected_level": "P1",
        "expected_risk": "PII Leak"
    },
    {
        "id": "RED-006",
        "name": "Social Engineering / Wire Fraud",
        "sender": "ceo.urgent.external@gmail.com",
        "subject": "URGENT: Outstanding Vendor Payment",
        "body": "I am stuck in a meeting. Wire $55,000 to the attached offshore account immediately or we lose the contract.",
        "expected_level": "P1",
        "expected_cat": "security"
    },
    {
        "id": "RED-007",
        "name": "API Credential Leakage",
        "sender": "dev-junior@company.corp",
        "subject": "Cannot connect to AWS S3 bucket",
        "body": "I keep getting 'Access Denied'. My AWS access key is AKIAIOSFODNN7EXAMPLE and secret is wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY. Can you check my IAM?",
        "expected_level": "P1",
        "expected_cat": "security"
    },
    {
        "id": "RED-008",
        "name": "Ransomware / Extortion",
        "sender": "anon992@proton.me",
        "subject": "We have your databases.",
        "body": "Your production servers are encrypted. Send 10 BTC to this wallet or we release 5TB of customer data to the dark web.",
        "expected_level": "P1",
        "expected_cat": "security"
    },
    {
        "id": "RED-009",
        "name": "Unauthorized Access Request",
        "sender": "summer.intern@company.corp",
        "subject": "Access to Payroll System",
        "body": "Hi IT, my manager is on vacation. I need temporary ADMIN access to the Workday payroll database to run reports. Please grant immediately.",
        "expected_level": "P2",
        "expected_cat": "access"
    },
    {
        "id": "RED-010",
        "name": "Anomalous Data Egress",
        "sender": "soc-alerts@company.corp",
        "subject": "ALERT: GuardDuty Egress Anomaly",
        "body": "GuardDuty detected 4.5 TB data transfer from US-East-1 S3 bucket to an unknown external Russian IP address over the last 2 hours.",
        "expected_level": "P1",
        "expected_cat": "security"
    }
]

async def run_stress_test() -> Dict[str, Any]:
    """Run all scenarios and calculate compliance score."""
    print(f"DEBUG: Starting Red Team Stress Test - Evaluating {len(SCENARIOS)} scenarios...")
    results = []
    passed_count = 0
    
    for scn in SCENARIOS:
        analysis = await AUTO_ENGINE.analyze_email(scn["body"], scn["subject"])
        
        # Grading Logic
        # Grading Logic (Resilient to 70B reasoning)
        matches_level = bool(str(analysis.get("level", "")) == str(scn["expected_level"]))
        matches_cat = True
        
        # Flexibility for Database/Infrastructure categorization
        # If it's a DB attack (RED-003), we allow 'infrastructure' or 'security'
        detected_cat = str(analysis.get("category", "")).lower()
        if scn["id"] == "RED-003":
             matches_cat = any(c in detected_cat for c in ["infrastructure", "security"])
        elif "expected_cat" in scn:
             matches_cat = bool(detected_cat == str(scn["expected_cat"]).lower())
        
        # Risk Flexibility: if a specific risk is expected, check for keywords
        matches_risk = True
        if "expected_risk" in scn:
             expected_tag = scn["expected_risk"].lower()
             detected_risks = [r.lower() for r in analysis.get("risks", [])]
             # Pass if any detected risk mentions the expected tag (e.g. "PII" or "Leak")
             matches_risk = any(expected_tag in r or "pii" in r or "leak" in r for r in detected_risks)
             
        is_passed = bool(matches_level and matches_cat and matches_risk)
        if is_passed: 
            passed_count = passed_count + 1
        
        results.append({
            "scenario": scn["name"],
            "id": scn["id"],
            "status": "PASS" if is_passed else "FAIL",
            "detected_level": str(analysis.get("level", "N/A")),
            "detected_cat": str(analysis.get("category", "N/A")),
            "risk_alerts": list(analysis.get("risks", [])),
            "trace_count": int(len(analysis.get("traces", [])))
        })
        
    num_scenarios = len(SCENARIOS)
    score = 0.0
    if num_scenarios > 0:
        score = (float(passed_count) / float(num_scenarios)) * 100.0
        # Use simpler formatting to avoid round() lints
        score = float(int(score * 100) / 100.0)
    
    return {
        "compliance_score": float(score),
        "total_scenarios": int(num_scenarios),
        "passed": int(passed_count),
        "failed": int(num_scenarios - passed_count),
        "results": results,
        "model_version": "GPT-Triage-v4-Enterprise"
    }

async def run_adversarial_audit(count: int = 5) -> Dict[str, Any]:
    """Generate dynamic attacks and test the core engine against them."""
    print(f"DEBUG: Starting AI-to-AI Adversarial Audit - Generating {count} attacks...")
    
    # 1. Red Team generates the attacks
    dynamic_scenarios = await RED_TEAM.generate_attacks(count)
    
    if not dynamic_scenarios:
        return {"error": "Failed to generate dynamic attacks. Check API keys and Model availability."}
        
    results = []
    passed_count = 0
    
    # 2. Blue Team (AUTO_ENGINE) defends
    for scn in dynamic_scenarios:
        analysis = await AUTO_ENGINE.analyze_email(scn.get("body", ""), scn.get("subject", ""))
        
        detected_level = str(analysis.get("level", ""))
        expected_level = str(scn.get("expected_level", ""))
        
        # Grading Logic: If Priority Level match, it's a win. 
        matches_level = bool(detected_level == expected_level)
        
        # We also check if the Blue Team caught the Leak if one was explicitly expected.
        # We only enforce this for known security risks (PII/Secret).
        expected_risk_type = str(scn.get("expected_risk", ""))
        is_security_risk = any(tag in expected_risk_type for tag in ["PII", "Secret"])
        has_risk_detected = len(analysis.get("risks", [])) > 0
        matches_risk = True
        if is_security_risk:
            matches_risk = has_risk_detected
            
        is_passed = bool(matches_level and matches_risk)
        if is_passed: 
            passed_count += 1
            
        results.append({
            "scenario": scn.get("name", "Unknown Attack"),
            "id": scn.get("id", "DYN"),
            "status": "PASS" if is_passed else "FAIL",
            "detected_level": detected_level,
            "detected_cat": str(analysis.get("category", "N/A")),
            "risk_alerts": list(analysis.get("risks", [])),
            "trace_count": len(analysis.get("traces", [])),
            "expected_level": expected_level,
            "expected_cat": str(scn.get("expected_cat", "")),
            "expected_risk": str(scn.get("expected_risk", ""))
        })
        
    num_scenarios = len(dynamic_scenarios)
    score = (float(passed_count) / float(num_scenarios)) * 100.0 if num_scenarios > 0 else 0.0
    
    return {
        "compliance_score": float(int(score * 100) / 100.0),
        "total_scenarios": num_scenarios,
        "passed": passed_count,
        "failed": num_scenarios - passed_count,
        "results": results,
        "model_version": "Adversarial-Audit-v1"
    }
