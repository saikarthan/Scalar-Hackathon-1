# Stage 1: Build the Next.js frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Final image with Python and UV for ultra-fast, reliable enterprise builds
FROM python:3.11-slim

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install 'uv' for deterministic dependency resolution
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Use non-root user (ID 1000) for high-security environments (Rule 1)
RUN useradd -m -u 1000 user
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    PORT=7860

WORKDIR $HOME/app

# Copy lockfiles and dependency declarations
COPY --chown=user pyproject.toml README.md openenv.yaml uv.lock ./

# Install python dependencies using 'uv' sync for high-reliability
# This ensures we use the EXACT same versions used in development
RUN uv sync --frozen

# Copy the application source code
COPY --chown=user support_triage_env ./support_triage_env
COPY --chown=user server ./server
COPY --chown=user inference.py ./

# Copy the optimized Next.js build from Stage 1
COPY --from=frontend-builder --chown=user /app/frontend/out ./frontend/out

# Final production stage exposed on the enterprise standard port
EXPOSE 7860

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD sh -c 'curl -fsS "http://127.0.0.1:7860/admin/stats" || exit 1'

# Use JSON format for CMD to ensure signals (SIGTERM) are handled correctly
CMD ["uv", "run", "uvicorn", "server.app:app", "--host", "0.0.0.0", "--port", "7860", "--proxy-headers"]
