
console.log("!!! WIND-EVAL INJECTED !!!");
/**
 * Windfinder extraction script - Greediest Version
 */
function extractWindfinderData() {
  const getDirFromEl = (el) => {
    if (!el) return "0";
    const title = el.getAttribute('title') || el.parentElement?.getAttribute('title') || el.querySelector('[title]')?.getAttribute('title') || "";
    if (title) {
      const match = title.match(/(\d+)\u00B0/);
      if (match) return match[1];
    }
    const text = el.textContent.trim();
    const numeric = text.replace(/[^0-9]/g, "");
    if (numeric && (numeric.length >= 1 && numeric.length <= 3)) return numeric;
    
    const cardinalMap = {
      'N': 0, 'NNE': 22.5, 'NE': 45, 'ENE': 67.5, 'E': 90, 'ESE': 112.5, 'SE': 135, 'SSE': 157.5,
      'S': 180, 'SSW': 202.5, 'SW': 225, 'WSW': 247.5, 'W': 270, 'WNW': 292.5, 'NW': 315, 'NNW': 337.5
    };
    const combined = (title + ' ' + text).toUpperCase();
    for (const [key, val] of Object.entries(cardinalMap)) {
      const regex = new RegExp(`(?:\\s|\\(|^)${key}(?:\\s|\\)|$)`);
      if (regex.test(combined)) return val.toString();
    }
    return "0";
  };

  const daySections = Array.from(document.querySelectorAll('.fc-day, [class*="_day_"]'));
  
  return daySections.map(day => {
    const headerEl = day.querySelector('.fc-day-header, [class*="header"], [class*="daylabel"]');
    if (!headerEl) return null;
    const dateText = headerEl.textContent.trim();
    
    const columns = Array.from(day.querySelectorAll('.fc-table-horizon, .forecast-column, [class*="column"], [class*="col"]'))
      .filter(el => /\d{2}h/.test(el.textContent));

    const rows = columns.map(col => {
      const timeEl = col.querySelector('.cell-ts, .forecast-hour, [class*="time"]') || col;
      const timeStr = timeEl.textContent.trim().match(/\d{2}h/)?.[0] || "";
      if (!timeStr) return null;

      const getVal = (cls) => {
        const el = col.querySelector('.' + cls) || col.querySelector(`[class*="${cls}"]`);
        if (!el) return "0";
        return el.textContent.trim().replace(",", ".").replace(/[^0-9.]/g, "");
      };

      const windDirEl = col.querySelector('.cell-wd, [class*="wind"] [title], [class*="wd"], [title*="wind direction" i]');
      const waveDirEl = col.querySelector('.cell-waves-wrapper, [class*="waves"] [title], .cell-wh [title], [title*="swell direction" i], [title*="wave direction" i]');

      return {
        time: timeStr,
        windSpeed: getVal('cell-ws') || getVal('speed'),
        windDir: getDirFromEl(windDirEl),
        waveHeight: getVal('cell-wh') || getVal('height'),
        wavePeriod: getVal('cell-wp') || getVal('period'),
        swellDir: getDirFromEl(waveDirEl)
      };
    }).filter(r => r !== null);

    return { dateText, rows };
  }).filter(d => d && d.rows.length > 0);
}
