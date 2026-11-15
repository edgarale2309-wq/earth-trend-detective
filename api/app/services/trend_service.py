"""Trend statistics: anomalies, Mann-Kendall, Sen slope, OLS + t-test, FDR."""
from __future__ import annotations

from dataclasses import asdict, dataclass

import numpy as np
import pandas as pd
import pymannkendall as mk
from scipy import stats
from statsmodels.stats.multitest import multipletests

MIN_YEARS = 10
MAX_MISSING = 0.30


@dataclass
class TrendResult:
    state: str  # rising | falling | no_trend | insufficient
    n: int
    sen_slope_per_decade: float | None = None
    pct_per_decade: float | None = None
    p_value: float | None = None
    z: float | None = None
    t: float | None = None
    r2: float | None = None
    ci_low: float | None = None  # 95% CI of OLS slope, per decade
    ci_high: float | None = None
    methods_agree: bool | None = None
    reason: str | None = None

    def to_dict(self) -> dict:
        return {k: (None if isinstance(v, float) and not np.isfinite(v) else v) for k, v in asdict(self).items()}


def monthly_anomalies(s: pd.Series) -> pd.Series:
    """Remove the mean seasonal cycle (per calendar month)."""
    clim = s.groupby(s.index.month).transform("mean")
    return s - clim


def to_resolution(s: pd.Series, resolution: str) -> tuple[pd.Series, float]:
    """Return (series, periods_per_decade). annual -> yearly means; monthly -> monthly anomalies."""
    if resolution == "monthly":
        return monthly_anomalies(s), 120.0
    a = monthly_anomalies(s).groupby(s.index.year).mean()
    a.index = pd.to_datetime(a.index.astype(str) + "-07-01")
    return a, 10.0


def insufficient(s: pd.Series, years: int) -> str | None:
    if years < MIN_YEARS:
        return f"Fewer than {MIN_YEARS} years selected"
    if s.isna().mean() > MAX_MISSING:
        return "More than 30% of the data is missing"
    return None


def analyze_series(s: pd.Series, resolution: str = "annual", deseasonalize: bool = True) -> TrendResult:
    """Full test on one series (monthly raw values indexed by month start)."""
    years = s.index.year.nunique()
    reason = insufficient(s, years)
    if reason:
        return TrendResult("insufficient", int(s.notna().sum()), reason=reason)
    y, per_dec = to_resolution(s, resolution)
    y = y.dropna()
    base = float(np.nanmean(s.values))
    return _fit(y.values, per_dec, base)


def _fit(y: np.ndarray, per_dec: float, base: float) -> TrendResult:
    n = len(y)
    if n < 8 or np.nanstd(y) == 0:
        return TrendResult("insufficient", n, reason="Not enough variation or points")
    res = mk.original_test(y)
    x = np.arange(n, dtype=float)
    lr = stats.linregress(x, y)
    tcrit = stats.t.ppf(0.975, n - 2)
    sen = float(res.slope) * per_dec
    ci = (lr.slope - tcrit * lr.stderr) * per_dec, (lr.slope + tcrit * lr.stderr) * per_dec
    sig = res.p < 0.05
    state = ("rising" if sen > 0 else "falling") if sig else "no_trend"
    return TrendResult(
        state=state, n=n, sen_slope_per_decade=sen,
        pct_per_decade=(sen / base * 100.0) if base else None,
        p_value=float(res.p), z=float(res.z), t=float(lr.slope / lr.stderr) if lr.stderr else None,
        r2=float(lr.rvalue**2), ci_low=float(ci[0]), ci_high=float(ci[1]),
        methods_agree=bool((lr.pvalue < 0.05) == sig and np.sign(lr.slope) == np.sign(res.slope)),
    )


def cell_trends(cube: np.ndarray, times: pd.DatetimeIndex, resolution: str = "annual"):
    """cube[time, lat, lon] -> arrays of sen slope/decade, p, p_fdr, state per cell."""
    _, nlat, nlon = cube.shape
    slope = np.full((nlat, nlon), np.nan)
    pct = np.full((nlat, nlon), np.nan)
    p = np.full((nlat, nlon), np.nan)
    state = np.full((nlat, nlon), "nodata", dtype=object)
    years = times.year.nunique()
    for i in range(nlat):
        for j in range(nlon):
            col = pd.Series(cube[:, i, j], index=times)
            if col.isna().all():
                continue
            r = analyze_series(col, resolution) if not insufficient(col, years) else None
            if r is None:
                state[i, j] = "insufficient"
                continue
            if r.state == "insufficient":
                state[i, j] = "insufficient"
                continue
            slope[i, j], p[i, j] = r.sen_slope_per_decade, r.p_value
            pct[i, j] = r.pct_per_decade if r.pct_per_decade is not None else np.nan
    ok = np.isfinite(p)
    p_fdr = np.full_like(p, np.nan)
    if ok.sum() > 0:
        p_fdr[ok] = multipletests(p[ok], alpha=0.05, method="fdr_bh")[1]
    for i, j in zip(*np.where(ok), strict=True):
        sig = p_fdr[i, j] < 0.05
        state[i, j] = ("rising" if slope[i, j] > 0 else "falling") if sig else "no_trend"
    return slope, pct, p, p_fdr, state
