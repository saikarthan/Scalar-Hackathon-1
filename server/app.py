"""
High-Reliability Entry Point for Enterprise AI Governance Gateway.
Consolidated API routes and CORS policies for maximum demo stability.
"""

import os
import asyncio
from typing import Optional
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from contextlib import asynccontextmanager

# Import mailbox and engine components from the environment
from support_triage_env.server.mailbox import MAILBOX
from support_triage_env.server.stress_test import run_stress_test, run_adversarial_audit
from support_triage_env.server.stats_tracker import STATS
from server.auth_manager import AUTH

# GLOBAL POLLER STATE (Rule 1: Persistent Listener)
POLLER_TASK: Optional[asyncio.Task] = None

# --- ROBUST 500 GUARD ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Rule 1: Self-Hosting Live Listener
    user = os.environ.get("IMAP_USER")
    password = os.environ.get("IMAP_PASS")
    host = os.environ.get("IMAP_HOST", "imap.gmail.com")
    
    if user and password:
        from server.connectors.mail_poller import IMAPPoller
        poller = IMAPPoller(host, user, password)
        # Run poller as a background task
        global POLLER_TASK
        POLLER_TASK = asyncio.create_task(poller.start(interval=15))
    yield
    if POLLER_TASK:
        POLLER_TASK.cancel()

# --- APP INITIALIZATION ---
from support_triage_env.server.app import app as root_app
app = root_app
app.router.lifespan_context = lifespan

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    # PREVENT HTML LEAKAGE: Always return JSON
    print(f"🔴 SERVER_CRASH: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"error": "INTERNAL_GATEWAY_ERROR", "detail": str(exc)}
    )

# REDUNDANT CORS POLICY (Explicitly allow localhost and 127.0.0.1 origins on ports 3000/7860)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:7860",
        "http://127.0.0.1:7860",
        "http://0.0.0.0:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- CONSOLIDATED GOVERNANCE API ROUTES ---

# --- AUTH & TEAM ENDPOINTS ---

@app.post("/api/auth/login")
async def login(data: dict):
    try:
        username = data.get("username")
        password = data.get("password")
        token = AUTH.login(username, password)
        if token:
            return {"token": token, "username": username}
        return JSONResponse(status_code=401, content={"error": "Invalid corporate credentials"})
    except Exception as e:
        # LOG FOR HACKATHON DEBUGGING
        print(f"❌ AUTH_CRASH: {str(e)}")
        return JSONResponse(status_code=500, content={"error": "INTERNAL_GATEWAY_FAILURE", "detail": str(e)})

@app.get("/api/admin/users")
async def list_users():
    return AUTH.list_members()

@app.post("/api/admin/users/add")
async def add_user(data: dict):
    username = data.get("username")
    password = data.get("password")
    role = data.get("role", "analyst")
    if AUTH.add_member(username, password, role):
        return {"success": True}
    return JSONResponse(status_code=400, content={"error": "User already exists"})

@app.post("/api/integration/imap")
async def connect_imap(data: dict):
    global POLLER_TASK
    host = data.get("host")
    user = data.get("user")
    password = data.get("pass")
    
    if not all([host, user, password]):
        return JSONResponse(status_code=400, content={"error": "Missing IMAP credentials"})
    
    # 1. Cancel existing task if running
    if POLLER_TASK:
        POLLER_TASK.cancel()
        try:
            await POLLER_TASK
        except asyncio.CancelledError:
            pass
            
    # 2. Start new poller
    poller = IMAPPoller(host, user, password)
    POLLER_TASK = asyncio.create_task(poller.start(interval=10))
    return {"status": "CONNECTED", "user": user}

@app.post("/api/integration/zendesk")
async def connect_zendesk(data: dict):
    # Rule 2: Scoped Token Persistence
    subdomain = data.get("subdomain")
    email = data.get("email")
    token = data.get("token")
    # For this demo, we store these in the environment/memory
    os.environ["ZENDESK_SUBDOMAIN"] = subdomain
    os.environ["ZENDESK_EMAIL"] = email
    os.environ["ZENDESK_TOKEN"] = token
    return {"status": "CONFIGURED", "subdomain": subdomain}

@app.get("/health")
async def health_check():
    return {"status": "ONLINE", "engine": "Governance Gateway Consolidated"}

@app.get("/api/inbound/list")
async def get_inbound_list_v2():
    # Direct access to the mailbox feed
    return MAILBOX.get_feed()

@app.post("/api/admin/stress-test")
async def execute_stress_test_v2():
    # Direct execution of the Red Team Audit
    return await run_stress_test()

@app.post("/api/admin/stress-test/dynamic")
async def execute_dynamic_audit(data: dict):
    # Live AI-to-AI Adversarial Audit
    count = data.get("count", 5)
    return await run_adversarial_audit(count)

@app.post("/api/inbound/webhook")
async def inbound_webhook_v2(data: dict):
    from_addr = data.get("from", "unknown@it.corp")
    subject = data.get("subject", "No Subject")
    body = data.get("body", "")
    return await MAILBOX.push_email(from_addr, subject, body)

@app.get("/api/inbound/stats")
async def get_inbound_stats_v2():
    return STATS.get_summary()

@app.post("/api/inbound/simulate-attack")
async def simulate_inbound_attack():
    """Trigger the Red Team to send a live attack to the inbound mailbox."""
    from support_triage_env.server.engine import RED_TEAM
    from support_triage_env.server.mailbox import MAILBOX
    
    # Generate 1 elite attack
    attacks = await RED_TEAM.generate_attacks(1)
    if attacks:
        scn = attacks[0]
        # Push it as a live email
        record = await MAILBOX.push_email(
            from_addr="adversary-probe@redteam.ai",
            subject=f"[PROBE] {scn.get('subject', 'Security Test')}",
            body=scn.get("body", "Simulation Payload")
        )
        return {"status": "success", "scenario": scn.get("name"), "id": record["id"]}
    return {"status": "error", "message": "Red Team Engine offline"}

@app.get("/admin/stats")
async def get_stats_v2():
    return STATS.get_summary()

# --- FRONTEND STATIC MOUNTING ---
frontend_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "out")
if os.path.exists(frontend_path):
    app.mount("/", StaticFiles(directory=frontend_path, html=True), name="frontend")

def main() -> None:
    port = int(os.environ.get("PORT", 7860))
    # ENFORCE RELOAD for production-grade development
    uvicorn.run("server.app:app", host="0.0.0.0", port=port, reload=True)

if __name__ == "__main__":
    main()
