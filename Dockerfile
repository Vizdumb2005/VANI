# Production Dockerfile for VAANI Digital Public Good on Google Cloud Run
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8080

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application and dataset artifacts
COPY api/ ./api/
COPY app/ ./app/
COPY dashboard/ ./dashboard/
COPY data/ ./data/
COPY docs/ ./docs/
COPY results/ ./results/
COPY workflow/ ./workflow/

# Expose container port
EXPOSE 8080

# Run FastAPI app via uvicorn bound to 0.0.0.0:$PORT
CMD exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT}
