"""
Live Inbound Mailbox Simulator.
Manages the concurrent queue of emails arriving from the infrastructure.
"""

from typing import List, Dict, Any
import time
from uuid import uuid4
from support_triage_env.server.engine import AUTO_ENGINE

class InboundMailbox:
    def __init__(self):
        self.queue: List[Dict[str, Any]] = []
        self.max_size = 50

    async def push_email(self, from_addr: str, subject: str, body: str):
        """Simulate an incoming email from the infrastructure."""
        
        # 1. Automated Triage (The ERP Logic)
        triage = await AUTO_ENGINE.analyze_email(body, subject)
        
        # 2. Build Inbound Record
        record = {
            "id": f"MSG-{str(uuid4())[:8].upper()}",
            "timestamp": time.time(),
            "from": from_addr,
            "subject": subject,
            "body": body,
            "category": triage.get("category", "access"),
            "level": triage.get("level", "P4"),
            "risks": triage.get("risks", []),
            "draft": triage.get("draft", "Reviewing..."),
            "kb_citations": triage.get("kb_citations", []),
            "traces": triage.get("traces", []),
            "status": "TRIAGED"
        }
        
        # 3. Add to head of queue
        self.queue.insert(0, record)
        if len(self.queue) > self.max_size:
            self.queue.pop()
            
        # 4. Record Stats (Integration Bridge)
        from support_triage_env.server.stats_tracker import STATS
        STATS.record_inbound_triage(
            level=record["level"],
            category=record["category"],
            has_risks=len(record["risks"]) > 0
        )
            
        return record

    def _push_raw(self, record: dict):
        self.queue.insert(0, record)

    def get_feed(self) -> List[Dict[str, Any]]:
        return self.queue

# Singleton
MAILBOX = InboundMailbox()

# Initialize with some sample infrastructure noise (hardcoded to avoid API boot costs)
def populate_initial():
    MAILBOX._push_raw({
        "id": f"MSG-{str(uuid4())[:8].upper()}",
        "timestamp": time.time(),
        "from": "billing-bot@aws.amazon.com",
        "subject": "Invoice INV-9102 Ready",
        "body": "Your AWS invoice for March is available. Total: $1,420.50. Po Required.",
        "category": "billing",
        "level": "P3",
        "risks": [],
        "draft": "We have received your AWS invoice and routed it to finance.",
        "kb_citations": [],
        "traces": [],
        "status": "TRIAGED"
    })
    MAILBOX._push_raw({
        "id": f"MSG-{str(uuid4())[:8].upper()}",
        "timestamp": time.time() + 1,
        "from": "ops-alerts@it.corp",
        "subject": "Monitor: Latency Spike",
        "body": "High latency detected in us-east-1 RDS cluster. Potential infrastructure degradation.",
        "category": "infrastructure",
        "level": "P2",
        "risks": [],
        "draft": "Engaging on-call engineers for RDS latency.",
        "kb_citations": ["KB-991: POSTGRES REPLICATION LAG - Mitigation: failover if lag > 60s."],
        "traces": [],
        "status": "TRIAGED"
    })

populate_initial()
