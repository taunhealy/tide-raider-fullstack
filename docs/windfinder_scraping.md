# Windfinder Scraping Documentation

This document records the selectors and logic used for extracting forecast data from Windfinder, specifically targeting tide trends and condition data.

## Selectors & Indicators

### Tide Trend Indicators
Windfinder uses SVGs with descriptive titles to indicate tide trends (Rising/Falling).

- **Selector**: `.forecast-tides .tide-trend__icon svg, [class*="tide-trend"] svg`
- **Indicator Values**:
  - `Rising tide`: Indicated by `↗` or specific green wavy icon.
  - `Falling tide`: Indicated by `↘` or specific blue wavy icon.
  - `High tide`: Peak of the tide curve.
  - `Low tide`: Trough of the tide curve.

### Data Rows
Rows are indexed by label text or class names.

- **Wind Speed**: `.cell-ws`, `[class*="wind-speed"]`
- **Wave Height**: `.cell-wh`, `[class*="wave-height"]`
- **Wave Period**: `.cell-wp`, `[class*="wave-period"]`
- **Tide Height**: `[class*="tide-height"]`

### Column Headers (Time/Hour)
- **Selector**: `.cell-ts, .forecast-hour, [class*="time"]`
- **Pattern**: Matches `\d{2}h` (e.g., `08h`) or `\d{2}:\d{2}` (e.g., `15:42`).

## Extraction Logic (windfinder-eval.js)
The extraction logic involves:
1. Identifying day sections (`.fc-day`).
2. Mapping columns to 3-hour intervals.
3. Extracting SVG titles for tide trends.
4. Propagating trends to fill gaps between peak tide times (Rising -> High -> Falling -> Low).

## Common Issues
- **CSS Modules**: Windfinder frequently updates the hash suffix in class names. Use attribute selectors like `[class*="tide-trend"]` for stability.
- **Lazy Loading**: Ensure the page is scrolled to trigger data loading for future dates.
- **Night Hours**: Some data is hidden behind a "Show Night Hours" toggle. The scraper attempts to click this if detected.
