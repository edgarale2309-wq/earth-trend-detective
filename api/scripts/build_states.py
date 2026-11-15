"""Build data/mexico_states.geojson (32 states) from Natural Earth admin-1 (public domain).

Run from api/:  python scripts/build_states.py
Downloads ~40 MB once (kept in data/_cache), keeps Mexico only, simplifies to ~300 m and rounds coordinates.
"""
from __future__ import annotations

import json
from pathlib import Path

import requests
from shapely.geometry import mapping, shape

ROOT = Path(__file__).resolve().parents[1]
URL = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson"
SRC = ROOT / "data" / "_cache" / "ne_10m_admin_1.geojson"


def rnd(c):
    return [rnd(x) for x in c] if isinstance(c[0], list) else [round(c[0], 3), round(c[1], 3)]


def main() -> None:
    SRC.parent.mkdir(parents=True, exist_ok=True)
    if not SRC.exists():
        SRC.write_bytes(requests.get(URL, timeout=300).content)
    feats = []
    for f in json.loads(SRC.read_text(encoding="utf-8"))["features"]:
        p = f["properties"]
        if p.get("admin") != "Mexico":
            continue
        g = shape(f["geometry"]).simplify(0.003, preserve_topology=True)
        geom = mapping(g)
        geom["coordinates"] = rnd(json.loads(json.dumps(geom["coordinates"])))
        feats.append({"type": "Feature", "id": p["iso_3166_2"],
                      "properties": {"id": p["iso_3166_2"], "name": p["name"] or "Revillagigedo Islands"}, "geometry": geom})
    out = ROOT / "data" / "mexico_states.geojson"
    out.write_text(json.dumps({"type": "FeatureCollection", "features": feats}, separators=(",", ":")), encoding="utf-8")
    print(len(feats), "states", round(out.stat().st_size / 1024), "KB")


if __name__ == "__main__":
    main()
