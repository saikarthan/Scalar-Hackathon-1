"""
FastAPI app exposing SupportTriageEnvironment over OpenEnv HTTP/WebSocket.
Simplified to avoid middleware conflicts with the main entry point.
"""

from __future__ import annotations
from openenv.core.env_server import create_app
from support_triage_env.models import SupportTriageAction, SupportTriageObservation
from support_triage_env.server.support_environment import SupportTriageEnvironment
from support_triage_env.server.stats_tracker import STATS

app = create_app(
    SupportTriageEnvironment,
    SupportTriageAction,
    SupportTriageObservation,
    env_name="support_triage_env",
)

# Root endpoint
@app.get("/")
async def root():
    return {
        "name": "Support Triage OpenEnv",
        "description": "An OpenEnv environment for IT support ticket triage",
        "docs": "/docs",
        "endpoints": {
            "reset": "POST /reset - Initialize the environment",
            "step": "POST /step - Execute an action",
            "state": "GET /state - Get current state",
            "docs": "GET /docs - Interactive API documentation"
        }
    }

# Routes are now consolidated in server/app.py for high-reliability.
# This file is kept as the core OpenEnv server for MCP/WS connectivity.
