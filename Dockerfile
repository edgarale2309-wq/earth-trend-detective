# One image, one URL: the web app is built first and then served by the FastAPI process.
FROM node:22-alpine AS web
WORKDIR /web
COPY web/package*.json ./
RUN npm ci
COPY web/ .
ENV VITE_API_BASE_URL=/api/v1/
RUN npm run build

FROM python:3.12-slim
WORKDIR /app
COPY api/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY api/ .
COPY --from=web /web/dist ./static
# fewer malloc arenas keeps the resident memory low on a 512 MB instance
ENV PORT=8000 \
    MALLOC_ARENA_MAX=2 \
    PYTHONUNBUFFERED=1
EXPOSE 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT}"]
