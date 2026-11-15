"""Real ingestion for GLDAS (soil moisture, runoff) and OMI (NO2, ozone) through NASA Earthdata.

STATUS: written but NOT yet run (needs credentials in api/.env). Until it runs, `make_demo_data.py` provides
clearly flagged synthetic data for surface_runoff and no2, and POWER (MERRA-2) provides soil_moisture and ozone.

Usage (from api/):
    pip install earthaccess
    python scripts/preprocess_earthdata.py gldas      # -> data/soil_moisture_gldas.zarr, data/surface_runoff.zarr
    python scripts/preprocess_earthdata.py omi        # -> data/no2.zarr, data/ozone_omi.zarr
Set EARTHDATA_USERNAME / EARTHDATA_PASSWORD (or EARTHDATA_TOKEN) in api/.env. Use 2-3 accounts, one per person.
"""
from __future__ import annotations

import sys
from pathlib import Path

import numpy as np
import xarray as xr
from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
from app.domain.catalog import GRID  # noqa: E402

load_dotenv(ROOT / ".env")
BBOX = (GRID["lon_min"], GRID["lat_min"], GRID["lon_max"], GRID["lat_max"])  # west, south, east, north
STEP = GRID["step"]


def _regrid(da: xr.DataArray) -> xr.DataArray:
    lats = np.arange(GRID["lat_min"], GRID["lat_max"] + 0.01, STEP)
    lons = np.arange(GRID["lon_min"], GRID["lon_max"] + 0.01, STEP)
    return da.interp(lat=lats, lon=lons, method="linear")


def gldas() -> None:
    import earthaccess

    earthaccess.login(strategy="environment")
    files = earthaccess.open(earthaccess.search_data(
        short_name="GLDAS_NOAH025_M", version="2.1", temporal=("2000-01", "2025-12"), bounding_box=BBOX))
    ds = xr.open_mfdataset(files, engine="h5netcdf", combine="by_coords")
    box = dict(lat=slice(BBOX[1], BBOX[3]), lon=slice(BBOX[0], BBOX[2]))
    for var, name in (("SoilMoi0_10cm_inst", "soil_moisture_gldas"), ("Qs_acc", "surface_runoff")):
        da = _regrid(ds[var].sel(**box)).rename("value")  # Qs_acc is kg m-2 per 3 h -> x8 = mm/day
        da = da * 8 if var == "Qs_acc" else da
        out = da.to_dataset()
        out.attrs.update(variable=name, status="nasa")
        out.to_zarr(ROOT / "data" / f"{name}.zarr", mode="w")
        print("wrote", name)


def omi() -> None:
    import earthaccess

    earthaccess.login(strategy="environment")
    for short, var, name in (("OMNO2d", "ColumnAmountNO2TroposphericCloudScreened", "no2"),
                             ("OMTO3d", "ColumnAmountO3", "ozone_omi")):
        files = earthaccess.open(earthaccess.search_data(
            short_name=short, temporal=("2004-10-01", "2025-12-31"), bounding_box=BBOX))
        ds = xr.open_mfdataset(files, group="HDFEOS/GRIDS/ColumnAmountNO2/Data Fields" if short == "OMNO2d"
                               else "HDFEOS/GRIDS/OMI Column Amount O3/Data Fields", engine="h5netcdf", combine="nested",
                               concat_dim="time")
        da = ds[var].resample(time="MS").mean()  # daily grids -> monthly means
        da = _regrid(da).rename("value")
        out = da.to_dataset()
        out.attrs.update(variable=name, status="nasa")
        out.to_zarr(ROOT / "data" / f"{name}.zarr", mode="w")
        print("wrote", name)


if __name__ == "__main__":
    {"gldas": gldas, "omi": omi}[sys.argv[1]]()
