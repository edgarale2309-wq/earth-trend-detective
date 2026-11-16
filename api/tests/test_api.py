import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)
pytestmark = pytest.mark.skipif(not (client.get("/api/v1/health").json()["datasets"]), reason="no cached datasets")


def test_health_and_variables():
    assert client.get("/api/v1/health").json()["status"] == "ok"
    body = client.get("/api/v1/variables").json()
    assert len(body["variables"]) == 6 and len(body["regions"]) == 9


def test_trends_has_cells_and_summary():
    r = client.post("/api/v1/trends", json={"variable": "precipitation", "region": "desert", "start": 1990, "end": 2025})
    assert r.status_code == 200
    j = r.json()
    assert j["n_cells"] > 0 and j["summary"]["state"] in {"rising", "falling", "no_trend"}
    assert len(j["states"]) >= 600 and all(r["n_cells"] >= 1 for r in j["states"])
    assert j["data_status"] == "nasa"


def test_short_period_is_insufficient():
    r = client.get("/api/v1/series", params={"var": "precipitation", "region": "desert", "start": 2020, "end": 2025})
    assert r.json()["stats"]["state"] == "insufficient"


def test_bad_variable_is_clear_error():
    r = client.post("/api/v1/trends", json={"variable": "nope", "region": "americas"})
    assert r.status_code == 422 and "Unknown variable" in r.json()["detail"]


def test_end_before_start_rejected():
    r = client.post("/api/v1/trends", json={"variable": "ozone", "start": 2020, "end": 2010})
    assert r.status_code == 422


def test_point_series_and_place_table():
    s = client.get("/api/v1/series", params={"var": "ozone", "lat": 19.4, "lon": -99.1}).json()
    assert s["point"] is not None and len(s["values"]) > 10
    p = client.get("/api/v1/place", params={"lat": 19.4, "lon": -99.1}).json()
    assert len(p["rows"]) == 6


def test_clues_return_regions():
    c = client.get("/api/v1/clues", params={"var": "precipitation"}).json()
    assert len(c["regions"]) >= 2


def test_demo_variables_are_flagged():
    r = client.post("/api/v1/trends", json={"variable": "no2", "region": "city"}).json()
    assert r["data_status"] == "synthetic_demo"


def test_state_series_and_geojson():
    g = client.get("/api/v1/geo/states").json()
    assert len(g["features"]) >= 600 and {"cc", "name_es"} <= set(g["features"][0]["properties"])
    sid = next(f["properties"]["id"] for f in g["features"] if f["properties"]["cc"] == "MX")
    s = client.get("/api/v1/series", params={"var": "precipitation", "state": sid}).json()
    assert s["point"]["state"] == sid and s["mean"] > 0


def test_country_outlines_and_row_country_codes():
    c = client.get("/api/v1/geo/countries").json()
    assert {f["properties"]["cc"] for f in c["features"]} >= {"US", "CA", "MX", "BR", "AR"}
    rows = client.post("/api/v1/trends", json={"variable": "ozone", "region": "americas"}).json()["states"]
    assert all(r["cc"] for r in rows)
