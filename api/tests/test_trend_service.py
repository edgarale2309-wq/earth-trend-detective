import numpy as np
import pandas as pd

from app.services import trend_service as ts


def make(n_years=30, slope_per_year=0.0, noise=1.0, seasonal=5.0, seed=0):
    rng = np.random.default_rng(seed)
    idx = pd.date_range("1990-01-01", periods=n_years * 12, freq="MS")
    t = np.arange(len(idx))
    v = 10 + seasonal * np.sin(2 * np.pi * t / 12) + slope_per_year * t / 12 + rng.normal(0, noise, len(t))
    return pd.Series(v, index=idx)


def test_detects_rising_trend():
    r = ts.analyze_series(make(slope_per_year=0.2))
    assert r.state == "rising"
    assert abs(r.sen_slope_per_decade - 2.0) < 0.5
    assert r.p_value < 0.05 and r.methods_agree


def test_detects_falling_trend():
    assert ts.analyze_series(make(slope_per_year=-0.2)).state == "falling"


def test_no_trend_is_not_no_change():
    r = ts.analyze_series(make(slope_per_year=0.0, noise=3.0, seed=3))
    assert r.state == "no_trend"


def test_seasonality_does_not_fake_a_trend():
    assert ts.analyze_series(make(seasonal=20.0, slope_per_year=0.0, noise=0.5, seed=5)).state == "no_trend"


def test_short_series_is_insufficient():
    assert ts.analyze_series(make(n_years=6, slope_per_year=1)).state == "insufficient"


def test_missing_data_is_insufficient():
    s = make(slope_per_year=0.3)
    s.iloc[: int(len(s) * 0.4)] = np.nan
    assert ts.analyze_series(s).state == "insufficient"


def test_monthly_resolution_runs():
    assert ts.analyze_series(make(slope_per_year=0.3), "monthly").n > 300
