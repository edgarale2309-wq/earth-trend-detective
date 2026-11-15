# Earth Trend Detective

NASA Space Apps Challenge 2026 · *Be An Earth System Trend Detective!*
Find what is changing on Earth, where, and whether it is real. React + TypeScript (web) · FastAPI + Python (api).

Design: [`docs/UX.md`](docs/UX.md) · Plan: [`docs/Roadmap.md`](docs/Roadmap.md)

## Run it

```bash
# 1. API  (Python 3.12)
cd api
python -m venv .venv && .venv\Scripts\activate        # macOS/Linux: source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload                          # http://localhost:8000/docs

# 2. Web  (Node 22+)
cd web
npm install
npm run dev                                            # http://localhost:5173
```

Or `docker compose up`. Copy `api/.env.example` to `api/.env` and `web/.env.example` to `web/.env`.

The cached datasets (`api/data/*.zarr`, about 4 MB) are committed, so the app works right after cloning.

## Data: what is real and what is not

| Variable | Status | Source |
|---|---|---|
| Precipitation | **Real** | NASA POWER (MERRA-2 `PRECTOTCORR`), 1984–2025 |
| Solar radiation | **Real** | NASA POWER (CERES `ALLSKY_SFC_SW_DWN`), 1984–2025 |
| Soil moisture | **Real, proxy** | NASA POWER MERRA-2 `GWETTOP` (surface wetness). The plan says GLDAS Noah. |
| Total ozone | **Real, proxy** | NASA POWER MERRA-2 `TO3`. The plan says OMI. |
| Surface runoff | **Synthetic demo** | `scripts/make_demo_data.py`. The UI shows a "Demo data" badge. |
| Nitrogen dioxide | **Synthetic demo** | Same. Real OMI needs Earthdata. |

Real ingestion for GLDAS and OMI is in `api/scripts/preprocess_earthdata.py`. It is written but **has not been run**: it needs Earthdata credentials in `api/.env`.
Once its output replaces a demo file, the badge disappears (the dataset's `status` attribute becomes `nasa`).

Refresh the real data: `python scripts/fetch_power.py` (558 grid points over Mexico at 1°, no account needed, resumable).

## Method

Seasonal cycle removed per calendar month, then Mann-Kendall test and Sen slope, plus OLS regression with t-test and 95% CI as a second opinion.
On maps, p-values get a Benjamini-Hochberg FDR correction across cells. Fewer than 10 years or more than 30% missing data returns "Not enough data".
p ≥ 0.05 is reported as "No clear trend", never "no change". The `/method` page explains this in plain language.
Code: `api/app/services/trend_service.py` (7 tests with synthetic series).

## API

`GET /api/v1/health` · `GET /variables` · `POST /trends` · `GET /series` · `GET /place` · `GET /clues`

## Quality gates

```bash
cd api && ruff check . && pytest -q
cd web && npm run check:accent && npm run lint && npm test && npm run build
```

## Images

Variable and home illustrations are not included yet. Drop WebP files in `web/public/images/` following `docs/UX.md` section 4
(`variables/<id>/<idle|rising|falling|no_trend|insufficient>.webp`, `home/earth.webp`). Until then the app draws an icon fallback.
AI-generated images must carry the "AI-generated" label and be declared at submission.

## Known gaps

- Real GLDAS/OMI ingestion not run; runoff and NO2 are synthetic.
- Docker files written but not tested here.
- Not deployed (Vercel for `web/`, Render for `api/` as per the roadmap). Set `CORS_ORIGINS` and `VITE_API_BASE_URL`.
- Map timeline (optional in the plan) and per-point live fetch from POWER/Data Rods/Giovanni are not built; points read from the cache.
- Validation against Giovanni/KNMI (US-11) is a manual task for the statistics owner.
- Lighthouse and screen-reader passes (T08) not done. Plotly chunk is large (about 390 KB gzip), loaded only in the explorer.
