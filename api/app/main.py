from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from app.domain import states
from app.domain.catalog import REGIONS, VARIABLES
from app.services import analysis

load_dotenv()
app = FastAPI(title="Earth Trend Detective API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[o.strip() for o in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",")],
    allow_methods=["*"], allow_headers=["*"],
)
api = APIRouter(prefix="/api/v1")


class TrendRequest(BaseModel):
    variable: str
    region: str = "americas"
    start: int = Field(1984, ge=1980, le=2025)
    end: int = Field(2025, ge=1980, le=2025)
    resolution: str = Field("annual", pattern="^(annual|monthly)$")


def _guard(fn, *a, **kw):
    try:
        return fn(*a, **kw)
    except analysis.AnalysisError as e:
        raise HTTPException(status_code=422, detail=str(e)) from e


@api.get("/health")
def health():
    return {"status": "ok", "datasets": analysis.repo.available()}


@api.get("/variables")
def variables():
    return {"variables": [{"id": k, **v} for k, v in VARIABLES.items()],
            "regions": [{"id": k, "bbox": v["bbox"], "point": v["point"]} for k, v in REGIONS.items()]}


@api.post("/trends")
def trends(req: TrendRequest):
    if req.end <= req.start:
        raise HTTPException(422, "End year must be after start year")
    return _guard(analysis.trends, req.variable, req.region, req.start, req.end, req.resolution)


@api.get("/series")
def series(var: str, region: str = "americas", start: int = 1984, end: int = 2025,
           resolution: str = Query("annual", pattern="^(annual|monthly)$"), deseasonalize: bool = True,
           lat: float | None = None, lon: float | None = None, state: str | None = None):
    return _guard(analysis.series, var, region, start, end, resolution, deseasonalize, lat, lon, state)


@api.get("/geo/states")
def geo_states():
    return states.geojson()


@api.get("/geo/countries")
def geo_countries():
    return states.country_outlines()


@api.get("/place")
def place(lat: float, lon: float):
    rows = _guard(analysis.place_table, lat, lon)
    return {"lat": lat, "lon": lon, "rows": rows}


@api.get("/clues")
def clues(var: str):
    return _guard(analysis.clue, var)


app.include_router(api)


# In the single-container deployment the built web app lives in ./static and is served by this same process,
# so the site and the API share one URL (no CORS, no second service).
STATIC = Path(__file__).resolve().parents[1] / "static"
if STATIC.is_dir():
    @app.get("/{path:path}", include_in_schema=False)
    def web_app(path: str):
        if path.startswith("api/"):
            raise HTTPException(404, "Not found")
        target = (STATIC / path).resolve()
        if path and target.is_file() and STATIC.resolve() in target.parents:
            return FileResponse(target)
        return FileResponse(STATIC / "index.html")  # client-side routes (/explore, /place, ...)
