import asyncio
import os
import json
from support_triage_env.server.stress_test import run_stress_test

async def main():
    print("Testing Static Compliance Audit...")
    res = await run_stress_test()
    print("SCORE:", res["compliance_score"])
    print("--------------------------------------------------")
    for r in res["results"]:
        if r["status"] == "FAIL":
            print(f"[{r['status']}] {r['scenario']} ({r['id']})")
            print(f"      Detected: Level={r['detected_level']}, Cat={r['detected_cat']}")
    print("--------------------------------------------------")

if __name__ == "__main__":
    asyncio.run(main())
