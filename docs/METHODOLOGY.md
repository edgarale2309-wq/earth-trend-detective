# Methodology

Code: `api/app/services/trend_service.py` (statistics) and `api/app/services/analysis.py` (orchestration).

The challenge asks for four things: choose variables, get data for a region, build a time series, and test whether the trend is significant. This is how each is done.

## 1. From grid cells to a series

- Data are monthly values on a 1° latitude-longitude grid, 1984–2025.
- A **state** series is the mean of the grid cells whose centre falls inside the state polygon, weighted by `cos(latitude)` because cells shrink toward the poles. States smaller than a cell use the nearest cell.
- A **region** series (Americas, North America, …) averages all cells in the region's box with the same weights.
- A **point** series is the nearest grid cell.

## 2. Removing the seasonal cycle

The yearly cycle is far larger than any trend, so each value becomes an **anomaly**: the value minus the long-term mean of its calendar month. *Annual* detail then averages the anomalies per year (rate × 10 per decade); *Monthly* detail keeps monthly anomalies (rate × 120 per decade). The "Absolute values" view in the chart is only for display; the test always runs on anomalies.

## 3. The trend test

1. **Mann-Kendall** (`pymannkendall.original_test`): non-parametric, asks whether values tend to rise or fall over time without assuming a straight line or a normal distribution. Gives Z and a p-value.
2. **Sen's slope** (median of all pairwise slopes): the rate of change, robust to outliers, with its own 95% interval (Theil-Sen, `scipy.stats.theilslopes`).
3. **OLS regression** with a t-test and a 95% confidence interval on the slope, as an independent second opinion. If both disagree on direction or significance, the UI says "Methods differ".
4. **Autocorrelation guard.** If the lag-1 autocorrelation of the detrended series is itself significant (|r₁| > 1.96/√n), the classic test is over-confident, so the p-value comes from **trend-free pre-whitening** (Yue et al., 2002; `pymannkendall.pre_whitening_modification_test`). The slope is still Sen's. Scientific mode shows r₁ and which test was used.
5. **Verdict.** p < 0.05 → "rising" or "falling" (sign of Sen's slope). Otherwise **"no clear trend"**, which is never worded as "no change": a longer record may still reveal one.

## 4. Many places at once

A map tests 669 states at once; at the 5% level about 1 in 20 would look significant by chance. The p-values are therefore adjusted with **Benjamini-Hochberg false-discovery-rate** correction across states (`statsmodels.multipletests`), and the adjusted p is what the map and table show. Only FDR-significant states are painted at full strength; the rest are faded.

## 5. When we refuse to answer

- Fewer than **10 years** selected → "Not enough data".
- More than **30% of months missing** → "Not enough data".
- Fewer than 8 usable points or zero variance → "Not enough data".

## 6. Validation

Automated, in `api/tests/test_trend_service.py` (22 tests in the API suite):

| Check | Result required |
|---|---|
| Pure noise, 400 series | fewer than 10% flagged (nominal 5%) |
| Series with a real trend, 100 runs | at least 85% detected |
| Strong seasonal cycle, no trend | not reported as a trend |
| Persistent (AR1, φ = 0.7) noise, 300 series | classic test flags over 20% by chance; the corrected test under 10% |
| Sen slope vs `scipy.stats.theilslopes` | identical |
| Mann-Kendall p vs `scipy.stats.kendalltau` | within 0.03 (or the pre-whitened value is used) |
| Short / gappy series | "insufficient" |

**Pending:** a manual comparison against NASA Giovanni and the KNMI Climate Explorer for one variable and region (the NASA resources list both). Record the Giovanni time-series settings, export the series and compare slope and p with `GET /api/v1/series`.

## 7. Limits to state honestly

- Only **linear** trends are tested; changes that accelerate or reverse can be missed.
- MERRA-2 variables are **reanalysis**: model output constrained by observations.
- A 1° grid (~110 km) blurs small states; neighbours can share a cell and show equal values.
- Statistical significance is not importance: read the rate next to the p-value.
- Real GLDAS and OMI records start in 2000 and 2004, so for those variables the usable period is shorter.
