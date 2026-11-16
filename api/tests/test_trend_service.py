import numpy as np
import pandas as pd
from scipy import stats

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


# ---- statistical validation -------------------------------------------------------------------------------------

def _annual_noise(seed: int, n: int = 30, phi: float = 0.0) -> np.ndarray:
    rng = np.random.default_rng(seed)
    e = rng.normal(0, 1, n)
    out = np.zeros(n)
    for i in range(n):
        out[i] = e[i] + (phi * out[i - 1] if i else 0.0)
    return out


def test_false_positive_rate_is_close_to_alpha():
    """On pure noise, about 5% of series may look significant. Far more would mean the test is over-confident."""
    hits = sum(ts._fit(_annual_noise(s), 10.0, 1.0).p_value < 0.05 for s in range(400))
    assert hits / 400 < 0.10


def test_power_to_find_a_real_trend():
    y = lambda s: _annual_noise(s) + 0.08 * np.arange(30)  # noqa: E731 - 0.08 sd per year over 30 years is a clear trend
    assert sum(ts._fit(y(s), 10.0, 1.0).state == "rising" for s in range(100)) >= 85


def test_autocorrelation_correction_cuts_false_positives():
    """Persistent (AR1) noise fools the classic test; trend-free pre-whitening must cut the false alarms."""
    import pymannkendall as mk

    series = [_annual_noise(s, n=40, phi=0.7) for s in range(300)]
    classic = sum(mk.original_test(y).p < 0.05 for y in series)
    corrected = sum(ts._fit(y, 10.0, 1.0).p_value < 0.05 for y in series)
    assert classic / 300 > 0.20  # the problem is real: the classic test is badly over-confident here
    assert corrected / 300 < 0.10


def test_matches_scipy_reference_implementations():
    y = _annual_noise(7) + 0.05 * np.arange(30)
    r = ts._fit(y, 10.0, 1.0)
    ref = stats.theilslopes(y, np.arange(30))
    assert abs(r.sen_slope_per_decade - ref[0] * 10) < 1e-9
    tau_p = stats.kendalltau(np.arange(30), y).pvalue
    assert abs(r.p_value - tau_p) < 0.03 or r.test == "pre_whitening"


def test_sen_confidence_interval_brackets_the_estimate():
    r = ts._fit(_annual_noise(1) + 0.05 * np.arange(30), 10.0, 1.0)
    assert r.sen_ci_low <= r.sen_slope_per_decade <= r.sen_ci_high
