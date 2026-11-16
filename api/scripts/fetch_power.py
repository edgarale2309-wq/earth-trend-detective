"""Download monthly NASA POWER data on a 1-degree grid over the Americas and store one Zarr per variable.

Only land cells inside some state polygon are requested (~4.5k points). Use few threads: POWER throttles parallel requests.

Run from api/:  python scripts/fetch_power.py [--cache-only]
No Earthdata account needed. Raw per-point JSON is cached in data/_cache so reruns resume.
"""
from __future__ import annotations

import json
import sys
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import numpy as np
import requests
import xarray as xr

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from app.domain import states  # noqa: E402
from app.domain.catalog import GRID, POWER_PARAMS  # noqa: E402

CACHE = ROOT / "data" / "_cache"
CACHE.mkdir(parents=True, exist_ok=True)
START, END = 1984, 2025
CACHE_ONLY = "--cache-only" in sys.argv  # rebuild the Zarr stores from what is already downloaded, no network
URL = "https://power.larc.nasa.gov/api/temporal/monthly/point"
PARAMS = ",".join(POWER_PARAMS.values())


def fetch_point(lat: float, lon: float) -> dict | None:
    f = CACHE / f"{lat:.1f}_{lon:.1f}.json"
    if f.exists():
        return json.loads(f.read_text())
    if CACHE_ONLY:
        return None
    q = dict(parameters=PARAMS, community="RE", longitude=lon, latitude=lat,
             start=START, end=END, format="JSON")
    for attempt in range(6):
        try:
            r = requests.get(URL, params=q, timeout=(10, 45))
            if r.status_code == 200:
                data = r.json()["properties"]["parameter"]
                f.write_text(json.dumps(data))
                return data
        except requests.RequestException:
            pass
        time.sleep(2 * (attempt + 1))  # back off: POWER throttles bursts
    return None


def main() -> None:
    lats = np.arange(GRID["lat_min"], GRID["lat_max"] + 0.01, GRID["step"])
    lons = np.arange(GRID["lon_min"], GRID["lon_max"] + 0.01, GRID["step"])
    pts = [(float(lats[i]), float(lons[j])) for i, j in sorted(states.land_cells())]
    print(f"{len(pts)} points", flush=True)
    done = 0

    def job(p):
        nonlocal done
        r = fetch_point(*p)
        done += 1
        if done % 200 == 0:
            print(f"  {done}/{len(pts)}", flush=True)
        return r

    with ThreadPoolExecutor(3) as ex:
        results = list(ex.map(job, pts))
    ok = sum(r is not None for r in results)
    print(f"downloaded {ok}/{len(pts)}", flush=True)

    times = np.array([f"{y}-{m:02d}-01" for y in range(START, END + 1) for m in range(1, 13)],
                     dtype="datetime64[ns]")
    for var, pname in POWER_PARAMS.items():
        arr = np.full((len(times), len(lats), len(lons)), np.nan, dtype="float32")
        for (la, lo), data in zip(pts, results, strict=True):
            if data is None or pname not in data:
                continue
            i, j = int(round((la - lats[0]) / GRID["step"])), int(round((lo - lons[0]) / GRID["step"]))
            series = data[pname]
            for k, t in enumerate(times):
                key = f"{str(t)[:4]}{str(t)[5:7]}"
                v = series.get(key, -999)
                arr[k, i, j] = np.nan if v is None or v <= -990 else v
        ds = xr.Dataset({"value": (("time", "lat", "lon"), arr)},
                        coords={"time": times, "lat": lats, "lon": lons},
                        attrs={"variable": var, "status": "nasa", "power_parameter": pname})
        out = ROOT / "data" / f"{var}.zarr"
        ds.to_zarr(out, mode="w")
        print(f"wrote {out.name}  valid={np.isfinite(arr).mean():.2%}", flush=True)


if __name__ == "__main__":
    main()

