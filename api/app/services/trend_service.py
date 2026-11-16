"""Trend statistics: anomalies, Mann-Kendall (with an autocorrelation correction), Sen slope + its CI, OLS + t-test, FDR."""
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
    sen_ci_low: float | None = None  # 95% CI of the Sen slope (Theil-Sen), per decade
    sen_ci_high: float | None = None
    lag1: float | None = None  # lag-1 autocorrelation of the detrended series
    test: str | None = None  # mann_kendall | pre_whitening (autocorrelation-corrected)
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


def _lag1(y: np.ndarray, slope: float) -> float:
    """Lag-1 autocorrelation of what is left after removing the Sen trend."""
    x = np.arange(len(y), dtype=float)
    resid = y - slope * x
    resid = resid - np.median(resid)
    if np.std(resid[:-1]) == 0 or np.std(resid[1:]) == 0:
        return 0.0
    return float(np.corrcoef(resid[:-1], resid[1:])[0, 1])


def _fit(y: np.ndarray, per_dec: float, base: float) -> TrendResult:
    n = len(y)
    if n < 8 or np.nanstd(y) == 0:
        return TrendResult("insufficient", n, reason="Not enough variation or points")
    res = mk.original_test(y)
    p, z, test = float(res.p), float(res.z), "mann_kendall"
    # Positive autocorrelation makes the classic test over-confident (it finds trends in noise). When the lag-1
    # autocorrelation is itself significant we use trend-free pre-whitening (Yue et al. 2002), which in our
    # simulations keeps the false-alarm rate near 5% where the classic test reaches ~30% (see tests).
    lag1 = _lag1(y, float(res.slope))
    if abs(lag1) > 1.96 / np.sqrt(n):
        try:
            pw = mk.pre_whitening_modification_test(y)
            if np.isfinite(pw.p) and np.isfinite(pw.z):
                p, z, test = float(pw.p), float(pw.z), "pre_whitening"
        except Exception:  # noqa: BLE001 - keep the classic result if the correction cannot be computed
            pass
    x = np.arange(n, dtype=float)
    lr = stats.linregress(x, y)
    tcrit = stats.t.ppf(0.975, n - 2)
    sen = float(res.slope) * per_dec
    ci = (lr.slope - tcrit * lr.stderr) * per_dec, (lr.slope + tcrit * lr.stderr) * per_dec
    _, _, lo, hi = stats.theilslopes(y, x, 0.95)
    sig = p < 0.05
    state = ("rising" if sen > 0 else "falling") if sig else "no_trend"
    return TrendResult(
        state=state, n=n, sen_slope_per_decade=sen,
        pct_per_decade=(sen / base * 100.0) if base else None,
        p_value=p, z=z, t=float(lr.slope / lr.stderr) if lr.stderr else None,
        r2=float(lr.rvalue**2), ci_low=float(ci[0]), ci_high=float(ci[1]),
        methods_agree=bool((lr.pvalue < 0.05) == sig and np.sign(lr.slope) == np.sign(res.slope)),
        sen_ci_low=float(lo * per_dec), sen_ci_high=float(hi * per_dec), lag1=lag1, test=test,
    )


def fdr_classify(results: dict[str, TrendResult]) -> None:
    """Benjamini-Hochberg FDR over many regions: only FDR-significant ones keep a rising/falling label.
    p_value is replaced by the adjusted value so the UI never shows an unadjusted p on a map."""
    ids = [k for k, r in results.items() if r.p_value is not None and r.state != "insufficient"]
    if not ids:
        return
    adj = multipletests([results[k].p_value for k in ids], alpha=0.05, method="fdr_bh")[1]
    for k, p in zip(ids, adj, strict=True):
        r = results[k]
        r.p_value = float(p)
        r.state = ("rising" if (r.sen_slope_per_decade or 0) > 0 else "falling") if p < 0.05 else "no_trend"
