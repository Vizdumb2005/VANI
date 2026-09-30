# Compatibility Dockerfile. Build with the repository root as context:
# docker build -f backend/Dockerfile .
FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8080 \
    APP_BASE_DIR=/app \
    ENVIRONMENT=production

WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates ffmpeg libsndfile1 \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/app ./app
COPY workflow ./workflow
COPY dashboard ./dashboard
COPY docs ./docs
COPY results ./results
RUN useradd --create-home --uid 10001 vaani \
    && chown -R vaani:vaani /app
USER vaani
EXPOSE 8080
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "2", "--proxy-headers"]
