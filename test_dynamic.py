import asyncio
import os
if not os.environ.get("GROQ_API_KEY"):
    os.environ["GROQ_API_KEY"] = "your_placeholder_here" # User should set this in .env or environment
os.environ["MODEL_NAME"] = "llama-3.1-8b-instant"
os.environ["API_BASE_URL"] = "https://api.groq.com/openai/v1"

from support_triage_env.server.stress_test import run_adversarial_audit

async def main():
    print("Testing Dynamic AI-to-AI Audit...")
    res = await run_adversarial_audit(count=2)
    if "error" in res:
        print("ERROR:", res["error"])
        return
        
    print("SCORE:", res["compliance_score"])
    print("--------------------------------------------------")
    for r in res["results"]:
        print(f"[{r['status']}] {r['scenario']}")
        print(f"      Detected: Level={r['detected_level']}, Cat={r['detected_cat']}, Risks={r['risk_alerts']}")
        print(f"      Expected: Level={r['expected_level']}, Cat={r['expected_cat']}, Risk={r['expected_risk']}")
    print("--------------------------------------------------")

if __name__ == "__main__":
    asyncio.run(main())
