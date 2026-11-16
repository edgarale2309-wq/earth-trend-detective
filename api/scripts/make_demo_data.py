"""Generate clearly-labelled SYNTHETIC demo datasets for variables whose real ingestion needs an
Earthdata token (GLDAS runoff, OMI NO2). Replace with scripts/preprocess_gldas.py / preprocess_omi.py
once credentials are in api/.env. Output attrs status='synthetic_demo' so the UI shows a badge."""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import xarray as xr

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from app.domain.catalog import GRID  # noqa: E402

# Same land mask as the real NASA POWER data, so regional averages cover the same cells.
LAND = np.isfinite(xr.open_zarr(ROOT / "data" / "precipitation.zarr")["value"].notnull().any("time").values)
rng = np.random.default_rng(42)
lats = np.arange(GRID["lat_min"], GRID["lat_max"] + 0.01, GRID["step"])
lons = np.arange(GRID["lon_min"], GRID["lon_max"] + 0.01, GRID["step"])
times = np.array([f"{y}-{m:02d}-01" for y in range(1984, 2026) for m in range(1, 13)], dtype="datetime64[ns]")
t = np.arange(len(times))
month = (t % 12) + 1


def make(name: str, base: float, season_amp: float, noise: float, trend_pct_dec: float, hot=(19.4, -99.1)) -> None:
    la, lo = np.meshgrid(lats, lons, indexing="ij")
    d = np.hypot(la - hot[0], lo - hot[1])
    spatial = np.exp(-d / 6.0)  # stronger signal near the hotspot, opposite sign far away
    scale = base * (0.4 + spatial)
    sign = np.where(d < 5, 1.0, -0.5)
    season = season_amp * np.sin(2 * np.pi * (month - 3) / 12)[:, None, None]
    slope = (trend_pct_dec / 100 / 120) * base * sign[None] * t[:, None, None]
    arr = scale[None] + season * scale[None] / base + slope + rng.normal(0, noise, (len(t), *la.shape)) * scale[None] / base
    arr = np.clip(arr, 0, None).astype("float32")
    arr[:, ~LAND] = np.nan
    ds = xr.Dataset({"value": (("time", "lat", "lon"), arr)}, coords={"time": times, "lat": lats, "lon": lons},
                    attrs={"variable": name, "status": "synthetic_demo"})
    ds.to_zarr(ROOT / "data" / f"{name}.zarr", mode="w")
    print("wrote", name)


make("surface_runoff", base=0.6, season_amp=0.4, noise=0.15, trend_pct_dec=-6)
make("no2", base=3.0, season_amp=0.8, noise=0.5, trend_pct_dec=9)
