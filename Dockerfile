# Read the doc: https://huggingface.co/docs/hub/spaces-sdks-docker
# you will also find guides on how best to write your Dockerfile

FROM python:3.10

# Install Node.js
RUN apt-get update && apt-get install -y curl
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
RUN apt-get install -y nodejs

RUN useradd -m -u 1000 user
USER user
ENV PATH="/home/user/.local/bin:$PATH"

WORKDIR /app

COPY --chown=user ./requirements.txt requirements.txt
RUN pip install --no-cache-dir --upgrade -r requirements.txt

COPY --chown=user . /app

# Create start script
RUN echo '#!/bin/sh' > start.sh && \
    echo 'cd /app/frontend && npm install && npm run build' >> start.sh && \
    echo 'export PYTHONPATH=/app && uvicorn app:app --host 0.0.0.0 --port 8000 &' >> start.sh && \
    echo 'cd /app/frontend && PORT=7860 npm start' >> start.sh && \
    chmod +x start.sh

CMD ["./start.sh"]