# NASA Space Apps 2026: submission material

Challenge: **Be An Earth System Trend Detective!** (Earth Science, Software, Advanced)
Deadline: Sunday 15 November 2026, 11:59 p.m. local time of your Local Event.

Checklist from the Judging & Awards Guide
- [ ] All members registered for the same Local Event and listed on the team's *Members* tab (1 to 6 people)
- [ ] All required fields of the project page completed, in English
- [ ] Demo: 7 slides **or** a 30-second video, in English or with English subtitles (already prepared)
- [ ] References field lists every external resource (below), including the AI-generated video
- [ ] Both confirmation boxes ticked (requirements read; original work, no unpermitted material)
- [ ] Project submitted before the deadline (the *Submit* button, not just saved)

## Short description (English)

Earth Trend Detective turns NASA satellite and reanalysis data into plain answers. Pick a variable (precipitation, solar radiation, soil moisture, runoff, nitrogen dioxide or ozone) and see a trend map of the whole Americas, state by state, then a time series with the rate of change per decade and an honest verdict: rising, falling, or no clear trend. Every verdict comes from a Mann-Kendall test and Sen slope with an OLS check, corrected for seasonality, autocorrelation and multiple comparisons. A detective game with random questions and real stories teaches students how to read trends, and everything works in English and Spanish.

## Mapping to the challenge objectives

| Objective in the challenge | Where it is |
|---|---|
| Identify variables of interest | Six variables with plain definitions, what we show, how to read and why it matters |
| Acquire data for a region | Zones (continent, sub-continents, desert, rainforest, estuary, large city), any state, or any point |
| Time series over a long period | 1984–2025, annual or monthly, drag on the chart to choose years |
| Rate of change and significance | Sen slope per decade, Mann-Kendall p-value, OLS t-test and 95% CI, FDR across states |
| Audience: students and public | Detective game, glossary, plain-language verdicts, bilingual, accessible |
| Demonstration examples | Detective game and real-world stories |
| Considerations: seasonality, "interesting even if not significant" | Seasonal cycle removed; "no clear trend" is a first-class result |

## Why it fits the judging criteria

- **Relevance**: built on NASA POWER (MERRA-2, CERES); every result is a NASA-derived time series.
- **Validity**: documented method, statistical validation tests, honest limits ([METHODOLOGY](METHODOLOGY.md)).
- **Creativity**: state-level trend map of 49 countries, detective game with real stories, location-aware map.
- **Impact**: teaching tool for high-school and university students and the public.
- **Presentation**: the demo video and this page's summary (the demo itself is prepared separately).

## References (paste into the References field)

- NASA Prediction Of Worldwide Energy Resources (POWER), monthly point API: https://power.larc.nasa.gov
- MERRA-2 reanalysis (GMAO, NASA): Gelaro et al., 2017, *J. Climate* 30, 5419–5454
- CERES SYN1deg surface radiation (NASA Langley), via NASA POWER
- NASA Giovanni and NASA Earthdata (GES DISC): https://giovanni.gsfc.nasa.gov · https://urs.earthdata.nasa.gov
- Natural Earth admin-1 states and provinces (public domain): https://www.naturalearthdata.com
- world-atlas (Natural Earth, via TopoJSON): https://github.com/topojson/world-atlas
- Mann, H.B. (1945) and Kendall, M.G. (1975), trend test; Sen, P.K. (1968), slope estimator; Theil, H. (1950)
- Yue, S., Pilon, P., Phinney, B., Cavadias, G. (2002), *Hydrological Processes* 16, 1807–1829 (trend-free pre-whitening)
- Benjamini, Y. and Hochberg, Y. (1995), *J. R. Stat. Soc. B* 57, 289–300 (false discovery rate)
- Libraries: React, TypeScript, Vite, Tailwind CSS, MapLibre GL, Plotly.js, TanStack Query, Zustand, zod, i18next, lucide-react, FastAPI, xarray, zarr, pandas, numpy, scipy, statsmodels, shapely, pymannkendall, axe-core
- Home page animation: AI-generated video (declared as AI-generated). Replace this line with the tool name you used.
- Variable illustrations: built-in SVG drawn for this project.

## Limits to mention if asked

Runoff and NO₂ are demonstration layers until real GLDAS and OMI records are loaded; soil moisture and ozone come from MERRA-2 rather than GLDAS and OMI; trends are linear; the grid is 1° (about 110 km).
