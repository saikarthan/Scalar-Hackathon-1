"""
Statistical tracking for the IT Support Triage Environment.
Stores aggregated simulation results for the Executive Dashboard.
"""

from typing import Dict, List, Any
import time

class StatsRegistry:
    def __init__(self):
        self.results: List[Dict[str, Any]] = []
        self.start_time = time.time()

    def record_session(self, task_key: str, score: float, sla_breached: bool, steps: int):
        self.results.append({
            "task_key": task_key,
            "score": score,
            "sla_breached": sla_breached,
            "steps": steps,
            "timestamp": time.time()
        })

    def record_inbound_triage(self, level: str, category: str, has_risks: bool):
        """Record a live triage event from the mailbox."""
        self.results.append({
            "task_key": f"inbound_{category}",
            "level": level,
            "category": category,
            "has_risks": has_risks,
            "score": 100.0 if level in ["P1", "P2"] else 80.0,
            "sla_breached": False, # Live emails are fresh
            "timestamp": time.time()
        })

    def get_summary(self) -> Dict[str, Any]:
        if not self.results:
            return {
                "avg_score": 0.0,
                "sla_compliance": 100.0,
                "total_tickets": 0,
                "critical_incidents": 0,
                "active_risks": 0,
                "uptime_seconds": int(time.time() - self.start_time),
                "by_category": {"billing": 0, "access": 0, "infrastructure": 0, "security": 0}
            }

        total = len(self.results)
        sla_breaches = sum(1 for r in self.results if r.get("sla_breached", False))
        avg_score = sum(r.get("score", 0.0) for r in self.results) / total
        
        # Count by category
        by_cat = {"billing": 0, "access": 0, "infrastructure": 0, "security": 0}
        active_risks = 0
        for r in self.results:
            cat = r.get("category", "")
            if not cat and "task_key" in r:
                 # Legacy support for task_key based stats
                 for k in by_cat:
                      if k in r["task_key"]: cat = k
            if cat in by_cat:
                by_cat[cat] += 1
            if r.get("has_risks"):
                active_risks += 1

        return {
            "avg_score": round(avg_score, 1),
            "sla_compliance": round(100 * (1 - sla_breaches / total), 1),
            "total_tickets": total,
            "critical_incidents": sum(1 for r in self.results if r.get("level") == "P1" or "hard" in r.get("task_key", "")),
            "active_risks": active_risks,
            "uptime_seconds": int(time.time() - self.start_time),
            "by_category": by_cat
        }

# Global Singleton
STATS = StatsRegistry()
