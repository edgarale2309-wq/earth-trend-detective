# Earth Trend Detective

NASA Space Apps Challenge 2026 · *Be An Earth System Trend Detective!*

A tool that turns NASA Earth-science data into plain answers: **what** is changing, **where**, **how much**, and whether the change is statistically **significant**. It covers the whole Americas (669 states, provinces and departments in 49 countries), six variables, 1984–2025, in English and Spanish.

React + TypeScript (`web/`) · FastAPI + Python (`api/`).

| Document | What it covers |
|---|---|
| [`docs/METHODOLOGY.md`](docs/METHODOLOGY.md) | The statistics, step by step, and how they are validated |
| [`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md) | Every dataset, what is real and what is a demo, limits |
| [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) | Publishing the site and getting a public URL |
| [`docs/ACCESSIBILITY.md`](docs/ACCESSIBILITY.md) | What was done for accessibility and how it was checked |
| [`docs/SUBMISSION.md`](docs/SUBMISSION.md) | Text for the NASA Space Apps project page, references, project summary |
| [`docs/UX.md`](docs/UX.md) · [`docs/Roadmap.md`](docs/Roadmap.md) | Design and original plan |

## What the app does

- **Explorer** (`/explore`): pick a variable, see a trend map by state, a time series you can brush to choose years, and a verdict ("rising", "falling", "no clear trend") with the rate of change per decade. Zone, detail (annual or monthly), view (map or table) and years analysed are filters. *Explorer* mode gives the plain-language verdict; *Scientific* mode adds Sen slope CI, Mann-Kendall Z, t, R², lag-1 autocorrelation and the test used.
- **Detective challenge** (`/detective`): a game with four modes (random mix, data cases, statistics lab, real-world stories). Each round draws six questions at random from banks of 16 concept questions and 8 true stories, plus data cases built from the real NASA variables.
- **My place** (`/place`): all variables for one location, with the state, a summary and how to read it.
- **More information** (`/info`): methods and glossary in plain language.
- Opens on the whole continent; on the first visit it can ask for your location and centre the map on your country.

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

Or one container, one URL: `docker build -t etd . && docker run -p 8000:8000 etd`, then open <http://localhost:8000>.
Copy `api/.env.example` to `api/.env` and `web/.env.example` to `web/.env` when you need them.

The cached datasets (`api/data/*.zarr`) are committed, so the app works right after cloning.

## Data at a glance

| Variable | Status | Source |
|---|---|---|
| Precipitation | **Real** | NASA POWER (MERRA-2 `PRECTOTCORR`) |
| Solar radiation | **Real** | NASA POWER (CERES `ALLSKY_SFC_SW_DWN`) |
| Soil moisture | **Real, proxy** | NASA POWER MERRA-2 `GWETTOP` (surface wetness) |
| Total ozone | **Real, proxy** | NASA POWER MERRA-2 `TO3` |
| Surface runoff | **Demo (synthetic)** | `scripts/make_demo_data.py`, flagged "Demo data" in the UI |
| Nitrogen dioxide | **Demo (synthetic)** | Same. Real OMI/GLDAS need Earthdata credentials |

Details, limits and how to replace the demo files: [`docs/DATA_SOURCES.md`](docs/DATA_SOURCES.md).

## Method in one paragraph

Seasonal cycle removed per calendar month, then the Mann-Kendall test and Sen slope, with an OLS regression and t-test as a second opinion. When neighbouring years are correlated the test switches to trend-free pre-whitening. On maps, p-values get a Benjamini-Hochberg false-discovery-rate correction across all states. Fewer than 10 years or more than 30% missing data gives "Not enough data". p ≥ 0.05 is reported as "No clear trend", never "no change". See [`docs/METHODOLOGY.md`](docs/METHODOLOGY.md).

## API

`GET /api/v1/health` · `GET /variables` · `POST /trends` (per-state results) · `GET /series` (region, `state=` or `lat/lon`) · `GET /geo/states` · `GET /geo/countries` · `GET /place` · `GET /clues`

## Quality gates

```bash
cd api && ruff check . && pytest -q                 # 22 tests, including statistical validation
cd web && npm run check:accent && npm run lint && npm test && npm run build
```

Rebuild the data: `python scripts/build_states.py` (polygons), `python scripts/fetch_power.py` (real data, ~4,500 points, resumable, about 40 minutes because NASA POWER throttles parallel requests), `python scripts/make_demo_data.py` (demo layers).

## Known gaps

- Runoff and NO₂ are synthetic. Real runoff is one command away (`scripts/fetch_gldas_runoff.py`, about 2 hours, needs Earthdata credentials in `api/.env`); real NO₂ is a much larger download. Real records start in 2000 (GLDAS) and 2005 (OMI), so those variables will have a shorter year range. See `docs/DATA_SOURCES.md`.
- Not validated against Giovanni/KNMI yet (see `docs/METHODOLOGY.md`, "Validation").
- MERRA-2 is a reanalysis (model output guided by observations), not a direct measurement. Only linear trends are tested. The 1° grid blurs small states.
- Screen-reader testing by hand (NVDA/VoiceOver) is pending; automated checks pass.
- Docker image not built in the authoring environment (the single-process serving was tested locally).

## Use of Super Intelligence (SI)

- **Code**: written with the help of an AI coding assistant (Claude Code, Anthropic) and reviewed and tested by the team (22 API tests, 9 web tests, automated accessibility checks).
- **Documentation and the detective question banks**: drafted with AI assistance and reviewed by the team.
- **Home-page video**: generated with Google Gemini (video generation) and labelled "AI-generated video" on the page.
- **Illustrations of the variables**: vector drawings made for this project.
- No NASA logos, flags or mission identifiers were generated or modified.
