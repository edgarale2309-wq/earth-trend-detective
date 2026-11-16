"""Real surface runoff from NASA GLDAS Noah 2.1 (monthly, 0.25 degree) averaged onto the app's 1-degree grid.

Run from api/:  python scripts/fetch_gldas_runoff.py
Needs EARTHDATA_USERNAME and EARTHDATA_PASSWORD in api/.env (free account: https://urs.earthdata.nasa.gov/users/new).
Reads only the Qs_acc variable of each monthly granule (about 11 s each, 312 granules), keeps one small .npy per month in
data/_cache so reruns resume, and writes data/surface_runoff.zarr with status=nasa. GLDAS 2.1 starts in 2000, so earlier
months stay empty and the app limits this variable to 2000 onward.

Units: Qs_acc is the mean 3-hourly accumulation in kg m-2, so mm/day = value * 8.
"""
from __future__ import annotations

import sys
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import numpy as np
import xarray as xr
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from app.domain.catalog import GRID  # noqa: E402

load_dotenv(ROOT / ".env")
CACHE = ROOT / "data" / "_cache"
CACHE.mkdir(parents=True, exist_ok=True)
LATS = np.arange(GRID["lat_min"], GRID["lat_max"] + 0.01, GRID["step"])
LONS = np.arange(GRID["lon_min"], GRID["lon_max"] + 0.01, GRID["step"])
FIRST, LAST = (2000, 1), (2025, 12)


def month_file(y: int, m: int) -> Path:
    return CACHE / f"gldas_runoff_{y}{m:02d}.npy"


def one_month(granule, y: int, m: int) -> bool:
    import earthaccess

    for attempt in range(4):
        try:
            f = earthaccess.open([granule])[0]
            da = xr.open_dataset(f, engine="h5netcdf")["Qs_acc"].isel(time=0)
            # 0.25-degree cell centres sit at x.125, x.375...: four per axis fall inside each 1-degree cell
            box = da.sel(lat=slice(LATS[0] - 0.5, LATS[-1] + 0.5), lon=slice(LONS[0] - 0.5, LONS[-1] + 0.5)).load()
            one = box.coarsen(lat=4, lon=4, boundary="trim").mean()
            arr = (one.values * 8.0).astype("float32")  # mm/day
            if arr.shape != (len(LATS), len(LONS)):
                raise ValueError(f"unexpected shape {arr.shape}")
            np.save(month_file(y, m), arr)
            return True
        except Exception as e:  # noqa: BLE001
            print(f"  {y}-{m:02d} attempt {attempt + 1}: {type(e).__name__}", flush=True)
            time.sleep(3 * (attempt + 1))
    return False


def main() -> None:
    import earthaccess

    earthaccess.login(strategy="environment")
    found = earthaccess.search_data(short_name="GLDAS_NOAH025_M", version="2.1",
                                    temporal=(f"{FIRST[0]}-{FIRST[1]:02d}", f"{LAST[0]}-{LAST[1]:02d}"))
    by_month: dict[tuple[int, int], object] = {}
    for g in found:
        t = g["umm"]["TemporalExtent"]["RangeDateTime"]["BeginningDateTime"]
        by_month[(int(t[:4]), int(t[5:7]))] = g
    todo = [k for k in sorted(by_month) if not month_file(*k).exists()]
    print(f"{len(by_month)} monthly granules, {len(todo)} still to read", flush=True)
    done = 0

    def job(k):
        nonlocal done
        ok = one_month(by_month[k], *k)
        done += 1
        if done % 20 == 0:
            print(f"  {done}/{len(todo)}", flush=True)
        return ok

    with ThreadPoolExecutor(4) as ex:
        results = list(ex.map(job, todo))
    print("failed months:", sum(not r for r in results), flush=True)

    times = np.array([f"{y}-{m:02d}-01" for y in range(1984, 2026) for m in range(1, 13)], dtype="datetime64[ns]")
    arr = np.full((len(times), len(LATS), len(LONS)), np.nan, dtype="float32")
    have = 0
    for i, t in enumerate(times):
        y, m = int(str(t)[:4]), int(str(t)[5:7])
        f = month_file(y, m)
        if f.exists():
            arr[i] = np.load(f)
            have += 1
    ds = xr.Dataset({"value": (("time", "lat", "lon"), arr)}, coords={"time": times, "lat": LATS, "lon": LONS},
                    attrs={"variable": "surface_runoff", "status": "nasa", "source": "GLDAS Noah 2.1 Qs_acc",
                           "start_year": FIRST[0]})
    ds.to_zarr(ROOT / "data" / "surface_runoff.zarr", mode="w")
    print(f"wrote surface_runoff.zarr with {have} real months, valid={np.isfinite(arr).mean():.2%}", flush=True)


if __name__ == "__main__":
    main()
