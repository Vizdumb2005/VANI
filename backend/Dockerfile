# Multi-stage production Dockerfile for VAANI Cloud Run API Gateway
FROM python:3.11-slim as builder

WORKDIR /build

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Final minimal runtime image
FROM python:3.11-slim

WORKDIR /app

# Install runtime audio dependencies (ffmpeg, libsndfile)
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsndfile1 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy installed packages from builder
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH

# Create unprivileged application user
RUN useradd -m -u 1001 vaani && chown -R vaani:vaani /app
USER vaani

# Copy application code, results, and workflows
COPY --chown=vaani:vaani app/ ./app/
COPY --chown=vaani:vaani ../results/ ./results/
COPY --chown=vaani:vaani ../docs/ ./docs/
COPY --chown=vaani:vaani ../workflow/ ./workflow/

# Configure Cloud Run environment
ENV PORT=8080
ENV PYTHONUNBUFFERED=1
ENV ENVIRONMENT=production

EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8080/health || exit 1

# Launch production server with Uvicorn worker
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "4", "--log-level", "info"]
