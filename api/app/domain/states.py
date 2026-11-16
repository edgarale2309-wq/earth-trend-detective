"""Americas state polygons (admin-1) and which grid cells belong to each state."""
from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path

import numpy as np
from shapely.geometry import Point, shape
from shapely.prepared import prep

from app.domain.catalog import GRID

PATH = Path(__file__).resolve().parents[2] / "data" / "americas_states.geojson"


@lru_cache(maxsize=1)
def geojson() -> dict:
    return json.loads(PATH.read_text(encoding="utf-8"))


@lru_cache(maxsize=1)
def membership() -> dict[str, tuple[np.ndarray, np.ndarray]]:
    """state id -> (lat indices, lon indices) of grid cells whose centre lies inside the state.

    States smaller than one grid cell get the nearest cell so every state has data."""
    lats = np.arange(GRID["lat_min"], GRID["lat_max"] + 0.01, GRID["step"])
    lons = np.arange(GRID["lon_min"], GRID["lon_max"] + 0.01, GRID["step"])
    out: dict[str, tuple[np.ndarray, np.ndarray]] = {}
    for f in geojson()["features"]:
        g = shape(f["geometry"])
        pg = prep(g)
        ii, jj = [], []
        x0, y0, x1, y1 = g.bounds  # only test the cells inside the polygon's bounding box
        for i in np.where((lats >= y0) & (lats <= y1))[0]:
            for j in np.where((lons >= x0) & (lons <= x1))[0]:
                if pg.contains(Point(lons[j], lats[i])):
                    ii.append(int(i))
                    jj.append(int(j))
        if not ii:
            c = g.representative_point()
            ii, jj = [int(np.abs(lats - c.y).argmin())], [int(np.abs(lons - c.x).argmin())]
        out[f["properties"]["id"]] = (np.array(ii), np.array(jj))
    return out


def names() -> dict[str, str]:
    return {f["properties"]["id"]: f["properties"]["name"] for f in geojson()["features"]}


def countries_of() -> dict[str, str]:
    """state id -> ISO country code."""
    return {f["properties"]["id"]: f["properties"]["cc"] for f in geojson()["features"]}


@lru_cache(maxsize=1)
def country_outlines() -> dict:
    return json.loads(PATH.with_name("americas_countries.geojson").read_text(encoding="utf-8"))


def land_cells() -> set[tuple[int, int]]:
    """Every grid cell that some state (or a preset region) uses; only these are downloaded."""
    return {(int(i), int(j)) for ii, jj in membership().values() for i, j in zip(ii, jj, strict=True)}
