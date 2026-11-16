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


CITIES = [(40.7, -74.0), (34.0, -118.2), (41.9, -87.6), (29.8, -95.4), (43.7, -79.4), (19.4, -99.1), (4.7, -74.1), (-12.0, -77.0),
          (-23.5, -46.6), (-34.6, -58.4), (-33.4, -70.7), (10.5, -66.9), (9.0, -79.5), (23.1, -82.4)]


def make(name: str, base: float, season_amp: float, noise: float, trend_pct_dec: float, urban: bool = False) -> None:
    """Invented but plausible: a smooth continent-wide pattern of rising/falling trends (so every country shows
    structure, not just Mexico), plus city hotspots for the pollutant. Marked synthetic_demo everywhere."""
    la, lo = np.meshgrid(lats, lons, indexing="ij")
    if urban:
        spatial = sum(np.exp(-np.hypot(la - c[0], lo - c[1]) / 4.0) for c in CITIES)
        scale = base * (0.25 + 1.6 * np.clip(spatial, 0, 2.5))
    else:
        scale = base * (0.5 + 0.9 * np.clip(np.cos(np.deg2rad(la)) ** 2, 0, 1))  # wetter toward the tropics
    # smooth field in [-1, 1]: where the trend is positive or negative, varying every ~20-30 degrees
    field = 0.6 * np.sin(la / 17 + 1.3) * np.cos(lo / 23 - 0.7) + 0.4 * np.sin((la + 1.7 * lo) / 13)
    field = np.clip(field * 1.4, -1, 1)
    season = season_amp * np.sin(2 * np.pi * (month - 3) / 12)[:, None, None]
    slope = (trend_pct_dec / 100 / 120) * scale[None] * field[None] * t[:, None, None]
    arr = scale[None] + season * scale[None] / base + slope + rng.normal(0, noise, (len(t), *la.shape)) * scale[None] / base
    arr = np.clip(arr, 0, None).astype("float32")
    arr[:, ~LAND] = np.nan
    ds = xr.Dataset({"value": (("time", "lat", "lon"), arr)}, coords={"time": times, "lat": lats, "lon": lons},
                    attrs={"variable": name, "status": "synthetic_demo"})
    ds.to_zarr(ROOT / "data" / f"{name}.zarr", mode="w")
    print("wrote", name)


make("surface_runoff", base=0.6, season_amp=0.4, noise=0.15, trend_pct_dec=14)
make("no2", base=3.0, season_amp=0.8, noise=0.5, trend_pct_dec=22, urban=True)
