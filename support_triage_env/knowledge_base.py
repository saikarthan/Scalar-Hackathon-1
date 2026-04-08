"""
Simulated Knowledge Base (RAG) for IT Support Triage.
Contains excerpt-style documentation matching common ticket patterns.
"""

from typing import Dict, List

KNOWLEDGE_BASE: Dict[str, str] = {
    "SAML_SSO": (
        "KB-204: SAML INVALID_AUDIENCE ERROR\n"
        "Root Cause: Mismatch between 'Audience Restriction' in IdP (Okta/Azure) "
        "and the Service Provider (SP) metadata. Usually occurs when a new portal "
        "subdomain is added without updating the IdP relay state."
    ),
    "MFA_RESET": (
        "KB-311: MFA/2FA RE-ENROLLMENT PROCEDURE\n"
        "Security Note: Always force re-enrollment when a device is lost or "
        "credential compromise is suspected. Never reset MFA without manager "
        "approval for 'Platinum' tier customers."
    ),
    "PG_CASCADING_FAIL": (
        "KB-991: POSTGRES REPLICATION LAG\n"
        "Symptoms: 503 errors on checkout. Mitigation: Identify primary heavy-write "
        "process and kill bloat. If lag > 60s, failover to sync-replica in Region B."
    ),
    "GDPR_RTBF": (
        "KB-007: RIGHT TO BE FORGOTTEN (GDPR)\n"
        "Policy: Users may request data deletion. Step 1: Verify identity via SSO. "
        "Step 2: Escalate to LEGAL for 'Hard' deletion from backups. "
        "WARNING: Never include PII (SSN, Credit Card) in the ticket status reply."
    ),
    "VPN_SECURITY": (
        "KB-665: IMPOSSIBLE TRAVEL DETECTION\n"
        "Protocol: If login occurs from two distant geos within <4h, lock account "
        "immediately. This is a SEV-1 Security Incident. Involve SOC-Oncall."
    ),
}

def search_kb(query: str) -> List[str]:
    """Simple keyword-based 'RAG' search simulation."""
    query = query.lower()
    results = []
    
    # Simple mapping for the demo
    keyword_map = {
        "sso": "SAML_SSO",
        "saml": "SAML_SSO",
        "mfa": "MFA_RESET",
        "2fa": "MFA_RESET",
        "postgres": "PG_CASCADING_FAIL",
        "db": "PG_CASCADING_FAIL",
        "checkout": "PG_CASCADING_FAIL",
        "gdpr": "GDPR_RTBF",
        "delete": "GDPR_RTBF",
        "privacy": "GDPR_RTBF",
        "vpn": "VPN_SECURITY",
        "travel": "VPN_SECURITY",
        "lagos": "VPN_SECURITY",
        "nigeria": "VPN_SECURITY",
    }
    
    found_keys = set()
    for word, kb_key in keyword_map.items():
        if word in query:
            found_keys.add(kb_key)
            
    return [KNOWLEDGE_BASE[k] for k in found_keys]
