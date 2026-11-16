"""Orchestrates repository + TrendService for the HTTP layer."""
from __future__ import annotations

from functools import lru_cache

import numpy as np
import pandas as pd
from scipy import stats

from app.adapters.zarr_repository import ZarrRepository
from app.domain import states as st
from app.domain.catalog import REGIONS, VARIABLES
from app.services import trend_service as ts

repo = ZarrRepository()


class AnalysisError(Exception):
    pass


def _load(variable: str):
    if variable not in VARIABLES:
        raise AnalysisError(f"Unknown variable '{variable}'")
    try:
        ds = repo.load(variable)
    except FileNotFoundError as e:
        raise AnalysisError(f"No data cached for '{variable}'. Run the ingestion scripts.") from e
    return ds, ds.attrs.get("status", VARIABLES[variable]["status"])


def _slice(variable: str, region: str, start: int, end: int):
    if region not in REGIONS:
        raise AnalysisError(f"Unknown region '{region}'")
    ds, status = _load(variable)
    la0, la1, lo0, lo1 = REGIONS[region]["bbox"]
    da = ds["value"].sel(lat=slice(la0, la1), lon=slice(lo0, lo1))
    da = da.sel(time=slice(f"{start}-01-01", f"{end}-12-31"))
    if da.time.size == 0 or da.lat.size == 0:
        raise AnalysisError("The selected region or period has no data")
    return da, status


def regional_series(da) -> pd.Series:
    w = np.cos(np.deg2rad(da.lat)).broadcast_like(da).where(da.notnull())
    m = (da * w).sum(("lat", "lon")) / w.sum(("lat", "lon"))
    return pd.Series(m.values, index=pd.DatetimeIndex(da.time.values))


@lru_cache(maxsize=8)
def _cube(variable: str):
    """The whole variable as one in-memory array, so 600+ states do not each re-read the store."""
    ds, status = _load(variable)
    return ds["value"].values, ds["lat"].values, pd.DatetimeIndex(ds["time"].values), status


def state_series(variable: str, state_id: str, start: int, end: int) -> tuple[pd.Series, str]:
    arr, lats, times, status = _cube(variable)
    mem = st.membership()
    if state_id not in mem:
        raise AnalysisError(f"Unknown state '{state_id}'")
    ii, jj = mem[state_id]
    keep = (times.year >= start) & (times.year <= end)
    vals = arr[keep][:, ii, jj]
    w = np.cos(np.deg2rad(lats[ii]))[None, :] * np.isfinite(vals)
    mean = np.nansum(np.nan_to_num(vals) * w, axis=1) / np.where(w.sum(axis=1) == 0, np.nan, w.sum(axis=1))
    return pd.Series(mean, index=times[keep]), status


@lru_cache(maxsize=256)
def trends(variable: str, region: str, start: int, end: int, resolution: str) -> dict:
    da, status = _slice(variable, region, start, end)
    summary = ts.analyze_series(regional_series(da), resolution)
    names, countries = st.names(), st.countries_of()
    results = {sid: ts.analyze_series(state_series(variable, sid, start, end)[0], resolution) for sid in names}
    ts.fdr_classify(results)
    rows = [{
        "id": sid, "name": names[sid], "cc": countries[sid], "state": r.state, "n_cells": len(st.membership()[sid][0]),
        "slope": None if r.sen_slope_per_decade is None else round(r.sen_slope_per_decade, 5),
        "pct": None if r.pct_per_decade is None else round(r.pct_per_decade, 3),
        "p": None if r.p_value is None else round(r.p_value, 5),
    } for sid, r in results.items()]
    return {
        "variable": variable, "region": region, "start": start, "end": end, "resolution": resolution,
        "unit": VARIABLES[variable]["unit"], "source": VARIABLES[variable]["source"], "data_status": status,
        "n_cells": int(da.lat.size * da.lon.size), "summary": summary.to_dict(), "states": rows,
        "fdr_significant": sum(r["state"] in ("rising", "falling") for r in rows),
    }


def series(variable: str, region: str, start: int, end: int, resolution: str, deseasonalize: bool,
           lat: float | None = None, lon: float | None = None, state: str | None = None) -> dict:
    da, status = _slice(variable, "americas" if (lat is not None or state) else region, start, end)
    place = None
    if state:
        s, _ = state_series(variable, state, start, end)
        place = {"state": state, "name": st.names().get(state, state), "cc": st.countries_of().get(state)}
    elif lat is not None and lon is not None:
        pt = da.sel(lat=lat, lon=lon, method="nearest")
        s = pd.Series(pt.values, index=pd.DatetimeIndex(pt.time.values))
        place = {"lat": float(pt.lat), "lon": float(pt.lon)}
    else:
        s = regional_series(da)
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
        lr = stats.linregress(x, y.values)
        tc = stats.t.ppf(0.975, len(y) - 2)
        yhat = lr.intercept + lr.slope * x
        resid = np.sum((y.values - yhat) ** 2) / (len(y) - 2)
        half = tc * np.sqrt(lr.stderr**2 * (x - x.mean()) ** 2 + resid / len(y))
        fit = {"trend": [round(float(v), 5) for v in yhat],
               "ci_low": [round(float(v), 5) for v in yhat - half],
               "ci_high": [round(float(v), 5) for v in yhat + half]}
    return {
        "variable": variable, "unit": VARIABLES[variable]["unit"], "source": VARIABLES[variable]["source"],
        "data_status": status, "point": place, "resolution": resolution, "deseasonalized": deseasonalize,
        "mean": round(float(np.nanmean(s.values)), 5),
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
    ranked = sorted([o for o in out if o["stats"]["pct_per_decade"] is not None],
                    key=lambda o: o["stats"]["pct_per_decade"])
    return {"variable": variable, "regions": out, "opposite": [ranked[0], ranked[-1]] if len(ranked) >= 2 else ranked}
