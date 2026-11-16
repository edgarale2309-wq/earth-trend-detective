"""Build the Americas admin-1 (state/province/department) polygons from Natural Earth (public domain).

Run from api/:  python scripts/build_states.py
Downloads ~40 MB once (kept in data/_cache). Writes
  data/americas_states.geojson     one feature per state: id, name, name_es, cc (ISO country), country
  data/americas_countries.geojson  one outline per country, dissolved from the states so borders line up exactly
Geometry is clipped to the analysed window and simplified so the browser can draw ~700 states smoothly.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

import requests
from shapely.geometry import box, mapping, shape
from shapely.ops import unary_union

ROOT = Path(__file__).resolve().parents[1]
URL = "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson"
SRC = ROOT / "data" / "_cache" / "ne_10m_admin_1.geojson"

# ISO 3166-1 alpha-2 codes of the independent countries and territories of the Americas (Greenland excluded: no ice-sheet focus).
AMERICAS = set("""CA US MX BZ CR SV GT HN NI PA AG BS BB CU DM DO GD HT JM KN LC VC TT PR VI VG AI KY TC BM AW CW SX BQ MS
AR BO BR CL CO EC GY PY PE SR UY VE FK""".split())
WINDOW = box(-170, -57, -30, 84)  # clip: drops Antarctic claims and the far-west Aleutians


def rnd(c):
    return [rnd(x) for x in c] if isinstance(c[0], list) else [round(c[0], 2), round(c[1], 2)]


def clean(geom, tol):
    g = geom.intersection(WINDOW)
    if g.is_empty:
        return None
    g = g.simplify(tol, preserve_topology=True)
    out = mapping(g)
    out["coordinates"] = rnd(json.loads(json.dumps(out["coordinates"])))
    return out


def main() -> None:
    SRC.parent.mkdir(parents=True, exist_ok=True)
    if not SRC.exists():
        SRC.write_bytes(requests.get(URL, timeout=300).content)
    feats, seen, by_cc = [], set(), {}
    for f in json.loads(SRC.read_text(encoding="utf-8"))["features"]:
        p = f["properties"]
        cc = p.get("iso_a2")
        g = shape(f["geometry"])
        c = g.representative_point()
        if cc == "FR" and not (-65 < c.x < -50 and 1 < c.y < 18):  # French Guiana, Guadeloupe, Martinique only
            continue
        if cc == "FR":
            cc = "GF" if c.y < 8 else "FR"
        elif cc not in AMERICAS:
            continue
        geom = clean(g, 0.03)
        if geom is None:
            continue
        sid = p.get("iso_3166_2") or ""
        if not re.fullmatch(r"[A-Z]{2}-[A-Z0-9]+", sid) or sid in seen:
            sid = p["adm1_code"]
        seen.add(sid)
        name = p.get("name") or p.get("name_en") or p.get("woe_name") or sid
        feats.append({"type": "Feature", "id": sid, "geometry": geom, "properties": {
            "id": sid, "name": name, "name_es": p.get("name_es") or name, "cc": cc, "country": p.get("admin")}})
        by_cc.setdefault(cc, []).append(g.intersection(WINDOW))
    out = ROOT / "data" / "americas_states.geojson"
    out.write_text(json.dumps({"type": "FeatureCollection", "features": feats}, separators=(",", ":")), encoding="utf-8")
    print(len(feats), "states in", len(by_cc), "countries,", round(out.stat().st_size / 1024), "KB")

    outlines = []
    for cc, parts in sorted(by_cc.items()):
        geom = clean(unary_union(parts), 0.05)
        if geom:
            outlines.append({"type": "Feature", "geometry": geom, "properties": {"cc": cc}})
    out = ROOT / "data" / "americas_countries.geojson"
    out.write_text(json.dumps({"type": "FeatureCollection", "features": outlines}, separators=(",", ":")), encoding="utf-8")
    print(len(outlines), "country outlines", round(out.stat().st_size / 1024), "KB")


if __name__ == "__main__":
    main()
