"""Orchestrates repository + TrendService for the HTTP layer."""
from __future__ import annotations

from functools import lru_cache

import numpy as np
import pandas as pd

from app.adapters.zarr_repository import ZarrRepository
from app.domain.catalog import REGIONS, VARIABLES
from app.services import trend_service as ts

repo = ZarrRepository()


class AnalysisError(Exception):
    pass


def _slice(variable: str, region: str, start: int, end: int):
    if variable not in VARIABLES:
        raise AnalysisError(f"Unknown variable '{variable}'")
    if region not in REGIONS:
        raise AnalysisError(f"Unknown region '{region}'")
    try:
        ds = repo.load(variable)
    except FileNotFoundError as e:
        raise AnalysisError(f"No data cached for '{variable}'. Run the ingestion scripts.") from e
    la0, la1, lo0, lo1 = REGIONS[region]["bbox"]
    da = ds["value"].sel(lat=slice(la0, la1), lon=slice(lo0, lo1))
    da = da.sel(time=slice(f"{start}-01-01", f"{end}-12-31"))
    if da.time.size == 0 or da.lat.size == 0:
        raise AnalysisError("The selected region or period has no data")
    return da, ds.attrs.get("status", VARIABLES[variable]["status"])


def regional_series(da) -> pd.Series:
    w = np.cos(np.deg2rad(da.lat)).broadcast_like(da).where(da.notnull())
    m = (da * w).sum(("lat", "lon")) / w.sum(("lat", "lon"))
    return pd.Series(m.values, index=pd.DatetimeIndex(da.time.values))


@lru_cache(maxsize=256)
def trends(variable: str, region: str, start: int, end: int, resolution: str) -> dict:
    da, status = _slice(variable, region, start, end)
    times = pd.DatetimeIndex(da.time.values)
    slope, pct, p, p_fdr, state = ts.cell_trends(da.values, times, resolution)
    cells = []
    for i, la in enumerate(da.lat.values):
        for j, lo in enumerate(da.lon.values):
            if state[i, j] == "nodata":
                continue
            cells.append({
                "lat": float(la), "lon": float(lo), "state": str(state[i, j]),
                "slope": None if np.isnan(slope[i, j]) else round(float(slope[i, j]), 5),
                "pct": None if np.isnan(pct[i, j]) else round(float(pct[i, j]), 3),
                "p": None if np.isnan(p_fdr[i, j]) else round(float(p_fdr[i, j]), 5),
            })
    series = regional_series(da)
    summary = ts.analyze_series(series, resolution).to_dict()
    return {
        "variable": variable, "region": region, "start": start, "end": end, "resolution": resolution,
        "unit": VARIABLES[variable]["unit"], "source": VARIABLES[variable]["source"], "data_status": status,
        "step": 1.0, "n_cells": len(cells), "summary": summary, "cells": cells,
        "fdr_significant": int(sum(c["state"] in ("rising", "falling") for c in cells)),
    }


def series(variable: str, region: str, start: int, end: int, resolution: str, deseasonalize: bool,
           lat: float | None = None, lon: float | None = None) -> dict:
    da, status = _slice(variable, region, start, end)
    if lat is not None and lon is not None:
        pt = da.sel(lat=lat, lon=lon, method="nearest")
        s = pd.Series(pt.values, index=pd.DatetimeIndex(pt.time.values))
        place = {"lat": float(pt.lat), "lon": float(pt.lon)}
    else:
        s = regional_series(da)
        place = None
    result = ts.analyze_series(s, resolution)
    if deseasonalize:
        y, _ = ts.to_resolution(s, resolution)
    elif resolution == "annual":
        y = s.groupby(s.index.year).mean()
        y.index = pd.to_datetime(y.index.astype(str) + "-07-01")
    else:
        y = s
    y = y.dropna()
    fit = None
    if len(y) >= 4:
        x = np.arange(len(y), dtype=float)
        from scipy import stats
        lr = stats.linregress(x, y.values)
        tc = stats.t.ppf(0.975, len(y) - 2)
        yhat = lr.intercept + lr.slope * x
        half = tc * np.sqrt(lr.stderr**2 * (x - x.mean()) ** 2 + (np.sum((y.values - yhat) ** 2) / (len(y) - 2)) / len(y))
        fit = {"trend": [round(float(v), 5) for v in yhat],
               "ci_low": [round(float(v), 5) for v in yhat - half],
               "ci_high": [round(float(v), 5) for v in yhat + half]}
    return {
        "variable": variable, "unit": VARIABLES[variable]["unit"], "source": VARIABLES[variable]["source"],
        "data_status": status, "point": place, "resolution": resolution, "deseasonalized": deseasonalize,
        "dates": [d.strftime("%Y-%m-%d") for d in y.index],
        "values": [round(float(v), 5) for v in y.values], "fit": fit, "stats": result.to_dict(),
    }


def place_table(lat: float, lon: float, start: int = 1984, end: int = 2025) -> list[dict]:
    rows = []
    for var in VARIABLES:
        try:
            ds = repo.load(var)
        except FileNotFoundError:
            continue
        pt = ds["value"].sel(lat=lat, lon=lon, method="nearest").sel(time=slice(f"{start}-01-01", f"{end}-12-31"))
        s = pd.Series(pt.values, index=pd.DatetimeIndex(pt.time.values))
        r = ts.analyze_series(s, "annual")
        rows.append({"variable": var, "unit": VARIABLES[var]["unit"], "source": VARIABLES[var]["source"],
                     "data_status": ds.attrs.get("status", "nasa"), "stats": r.to_dict(),
                     "cell": {"lat": float(pt.lat), "lon": float(pt.lon)}})
    return rows


def clue(variable: str, start: int = 1984, end: int = 2025) -> dict:
    """Two preset regions with the most contrasting trends for the variable."""
    out = []
    for rid in ("desert", "rainforest", "estuary", "city"):
        try:
            da, _ = _slice(variable, rid, start, end)
        except AnalysisError:
            continue
        r = ts.analyze_series(regional_series(da), "annual")
        out.append({"region": rid, "stats": r.to_dict()})
    ranked = sorted([o for o in out if o["stats"]["pct_per_decade"] is not None], key=lambda o: o["stats"]["pct_per_decade"])
    return {"variable": variable, "regions": out, "opposite": [ranked[0], ranked[-1]] if len(ranked) >= 2 else ranked}
