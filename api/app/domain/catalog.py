"""Static catalog of the six variables and preset regions."""
from __future__ import annotations

GRID = {"lat_min": 15.0, "lat_max": 32.0, "lon_min": -117.0, "lon_max": -87.0, "step": 1.0}

# variable id -> NASA POWER parameter (real data pulled by scripts/fetch_power.py)
POWER_PARAMS = {
    "precipitation": "PRECTOTCORR",
    "solar_radiation": "ALLSKY_SFC_SW_DWN",
    "soil_moisture": "GWETTOP",
    "ozone": "TO3",
}

VARIABLES = {
    "precipitation": {
        "unit": "mm/day", "map": "BrBG", "sensor": "MERRA-2 (via NASA POWER)",
        "source": "NASA POWER · MERRA-2", "start_year": 1984, "status": "nasa",
    },
    "solar_radiation": {
        "unit": "kWh/m²/day", "map": "PuOr_r", "sensor": "CERES SYN1deg (via NASA POWER)",
        "source": "NASA POWER · CERES", "start_year": 1984, "status": "nasa",
    },
    "soil_moisture": {
        "unit": "fraction (0–1)", "map": "BrBG", "sensor": "MERRA-2 surface wetness (via NASA POWER)",
        "source": "NASA POWER · MERRA-2 GWETTOP", "start_year": 1984, "status": "nasa",
    },
    "surface_runoff": {
        "unit": "mm/day", "map": "BrBG", "sensor": "GLDAS Noah",
        "source": "GLDAS Noah (demo data)", "start_year": 1984, "status": "synthetic_demo",
    },
    "no2": {
        "unit": "10¹⁵ molec/cm²", "map": "RdBu_r", "sensor": "OMI · Aura",
        "source": "OMI (demo data)", "start_year": 1984, "status": "synthetic_demo",
    },
    "ozone": {
        "unit": "Dobson units", "map": "RdBu_r", "sensor": "MERRA-2 total column ozone (via NASA POWER)",
        "source": "NASA POWER · MERRA-2 TO3", "start_year": 1984, "status": "nasa",
    },
}

# bbox = (lat_min, lat_max, lon_min, lon_max)
REGIONS = {
    "mexico": {"bbox": (15, 32, -117, -87), "point": (23.6, -102.5)},
    "desert": {"bbox": (28, 32, -115, -108), "point": (30.0, -111.0)},
    "rainforest": {"bbox": (16, 19, -94, -89), "point": (17.5, -91.5)},
    "estuary": {"bbox": (18, 22, -98, -95), "point": (20.0, -96.5)},
    "city": {"bbox": (18, 21, -101, -97), "point": (19.4, -99.1)},
}
