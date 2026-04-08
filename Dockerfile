# Read the doc: https://huggingface.co/docs/hub/spaces-sdks-docker
# you will also find guides on how best to write your Dockerfile

FROM python:3.10

RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:$PATH"
ENV PYTHONPATH=/app

WORKDIR /app

# Install uv
RUN pip install uv

COPY --chown=user ./pyproject.toml ./uv.lock ./
RUN uv sync --frozen --no-install-project

COPY --chown=user . /app

CMD ["uvicorn", "support_triage_env.server.app:app", "--host", "0.0.0.0", "--port", "7860"]