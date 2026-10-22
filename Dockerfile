# One image serves both the API and the built website, so the login cookie works with no CORS setup.
# Build:  docker build -t neuroshield .      Run:  docker run -p 8000:8000 -e JWT_SECRET=... neuroshield
# NOTE: this file could not be built in the environment where it was written (no Docker there).

# --- Stage 1: build the React app, calling the API on the same origin ---
FROM node:22-slim AS web
WORKDIR /web
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
ENV VITE_API_URL=/api/v1
RUN npm run build

# --- Stage 2: the Python API, serving the built site ---
FROM python:3.12-slim
ENV PYTHONUNBUFFERED=1 PYTHONDONTWRITEBYTECODE=1
WORKDIR /app
COPY backend/requirements.txt backend/requirements.txt
COPY ml/requirements.txt ml/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt
COPY backend/ backend/
COPY ml/ ml/
# Trained model files. On the deploy branch these are the real files. On a plain checkout the folder only holds
# a README, and the app then shows "model not trained yet" instead of faking anything.
COPY artifacts/ artifacts/
COPY --from=web /web/dist frontend/dist
ENV APP_ENV=production FRONTEND_DIST=/app/frontend/dist
RUN useradd --create-home appuser && chown -R appuser /app
USER appuser
WORKDIR /app/backend
EXPOSE 8000
# $PORT is provided by most hosts. --forwarded-allow-ips='*' trusts X-Forwarded-For, which is only safe behind the host's proxy.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000} --proxy-headers --forwarded-allow-ips='*'"]
