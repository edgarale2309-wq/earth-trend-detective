# Deployment

The repository ships a single container that serves the website **and** the API from one URL, so there is no second service and no CORS to configure.

```
Dockerfile        builds web/ (Vite) and serves it from the FastAPI process
render.yaml       Render blueprint
.dockerignore
web/vercel.json   only needed for the two-service alternative below
```

The single-process serving was tested locally (pages, assets, SPA routes, API and 404 on unknown `/api/...`). The Docker image itself could not be built where this was written (no Docker daemon), so the first build happens on the host.

## Option A (recommended): Render, one URL

1. Push the repository to GitHub.
2. Create a free account at <https://render.com> and choose **New → Blueprint**.
3. Select the repository. Render reads `render.yaml`, builds the Docker image and starts the service.
4. When the build finishes, the URL looks like `https://earth-trend-detective.onrender.com`. That is the link for the NASA project page.

Notes
- The free plan sleeps after inactivity: the first request can take about a minute. Open the site once before the demo, and open `/explore?v=precipitation` to warm the calculation cache.
- The first per-state calculation for a variable takes about 7 seconds; later ones are cached in memory.
- The free plan has 512 MB of RAM. If the service restarts with an out-of-memory error, switch `plan` to `starter` in `render.yaml`.
- Health check: `/api/v1/health`.

## Option B: Vercel (web) + Render (API)

1. API on Render as a **Web Service** (Docker, root `api/`, or `pip install -r requirements.txt` and `uvicorn app.main:app --host 0.0.0.0 --port $PORT`). Set `CORS_ORIGINS=https://<your-vercel-domain>`.
2. Web on Vercel: import the repo, root directory `web`, framework Vite, environment variable `VITE_API_BASE_URL=https://<your-render-service>.onrender.com/api/v1/`. `web/vercel.json` makes client-side routes work.

## Option C: Run it on your own machine for the demo

```bash
docker build -t etd . && docker run -p 8000:8000 etd   # http://localhost:8000
```

or the two commands in the README (`uvicorn` and `npm run dev`).

## Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `PORT` | container | Port the server listens on (Render sets it) |
| `CORS_ORIGINS` | API | Allowed web origins; only needed in option B |
| `VITE_API_BASE_URL` | web build | API address; `/api/v1/` in the single-container build |
| `EARTHDATA_USERNAME` / `EARTHDATA_PASSWORD` | API, scripts only | Real GLDAS/OMI ingestion; not needed to run the app |
