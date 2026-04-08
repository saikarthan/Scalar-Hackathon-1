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
        try:
            from server.connectors.mail_poller import IMAPPoller
            poller = IMAPPoller(host, user, password)
            # Run poller as a background task
            global POLLER_TASK
            POLLER_TASK = asyncio.create_task(poller.start(interval=15))
        except Exception as e:
            print(f"Failed to start mail poller: {e}")
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