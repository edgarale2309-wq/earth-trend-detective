# Data sources

## Variables

| Variable | Status | Origin | Period | Notes |
|---|---|---|---|---|
| Precipitation (mm/day) | Real | NASA POWER, MERRA-2 `PRECTOTCORR` | 1984–2025 | Bias-corrected precipitation from the reanalysis |
| Solar radiation (kWh/m²/day) | Real | NASA POWER, CERES SYN1deg `ALLSKY_SFC_SW_DWN` | 1984–2025 | All-sky shortwave at the surface |
| Soil moisture (0–1) | Real, **proxy** | NASA POWER, MERRA-2 `GWETTOP` | 1984–2025 | Surface wetness; the plan named GLDAS Noah |
| Total ozone (DU) | Real, **proxy** | NASA POWER, MERRA-2 `TO3` | 1984–2025 | Total column ozone; the plan named OMI |
| Surface runoff (mm/day) | **Demo** | `api/scripts/make_demo_data.py` | 1984–2025 | Invented but plausible; flagged "Demo data" |
| NO₂ column | **Demo** | `api/scripts/make_demo_data.py` | 1984–2025 | Invented; city hotspots across the continent |

Demo layers use the same land mask as the real data and carry `status = synthetic_demo`, which makes the interface show a badge. They are **not** measurements and must not be cited as results.

Demo variables are left out of the detective game's data cases so that no "fact" in the game is invented.

## Geography

- State, province and department polygons: **Natural Earth** 1:10m admin-1 (public domain), 669 areas in 49 countries of the Americas, clipped to latitudes −57° to 84° and simplified. Rebuilt by `api/scripts/build_states.py`.
- Country outlines are dissolved from those states so borders line up exactly.
- Basemap land: `world-atlas` (Natural Earth 1:50m).

## Getting the real data

`python scripts/fetch_power.py` requests NASA POWER's monthly point API for every land grid cell that falls inside a state (4,475 points). No account is needed. POWER throttles parallel requests, so the script uses 3 threads, short timeouts and backs off; it resumes from `api/data/_cache`.

## Replacing the demo layers with real records

1. Create a free **NASA Earthdata** account: <https://urs.earthdata.nasa.gov/users/new> (the same login works for Giovanni).
2. Put `EARTHDATA_USERNAME` and `EARTHDATA_PASSWORD` in `api/.env` (git ignores it). **Never** put them in `api/.env.example`, which is tracked.
3. `pip install earthaccess h5py`.

**Surface runoff (GLDAS Noah 2.1)**: `python scripts/fetch_gldas_runoff.py` reads the `Qs_acc` variable of the 312 monthly granules (2000–2025), averages 0.25° to the 1° grid and writes `data/surface_runoff.zarr` with `status = nasa`. Login and reading were verified. The server delivers about 1 MB/s (24 MB per month), so the full run takes roughly **1.5 to 2 hours**; it caches each month in `data/_cache` and resumes if interrupted. When it finishes:
- in `api/app/domain/catalog.py` set `surface_runoff` to `"start_year": 2000` and `"status": "nasa"`;
- in `web/src/core/variables.ts` set `VARIABLE_START = { surface_runoff: 2000 }` so the year slider starts in 2000;
- remove `surface_runoff` from `DEMO` in `web/src/features/detective/DetectivePage.tsx`.
Do not re-run `make_demo_data.py` afterwards: it would overwrite the real file.

**NO₂ (OMI)**: OMNO2d is a daily product (about 7,500 granules of 13 MB for 2005–2025, on the order of 100 GB). Use Giovanni's monthly OMNO2d time series for chosen regions, or run `scripts/preprocess_earthdata.py omi` on a machine with a fast connection. Until then NO₂ stays a labelled demo layer.

## Licences and credit

NASA data are open. Natural Earth is public domain. Libraries: MapLibre GL, Plotly, React, FastAPI, xarray, pymannkendall, scipy, statsmodels, shapely, i18next, TanStack Query, Zustand, zod, Tailwind CSS. The home video was generated with an AI tool and is declared as such at submission.
