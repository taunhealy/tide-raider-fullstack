
console.log("!!! WIND-EVAL INJECTED !!!");
/**
 * Windfinder extraction script - Final Production Version
 */
function extractWindfinderData() {
  const getDirFromEl = (el) => {
    if (!el) return "0";
    
    // Check for alt attribute (new discovery from user)
    const img = el.tagName === 'IMG' ? el : el.querySelector('img');
    const alt = img?.getAttribute('alt') || el.getAttribute('alt') || "";
    if (alt) {
      const match = alt.match(/(\d+(?:\.\d+)?)\u00B0/);
      if (match) return Math.round(parseFloat(match[1])).toString();
    }

    // Check for style transform rotate (new discovery from user)
    const style = img?.getAttribute('style') || el.getAttribute('style') || "";
    if (style.includes('rotate')) {
      const match = style.match(/rotate\((\d+(?:\.\d+)?)deg\)/);
      if (match) return Math.round(parseFloat(match[1])).toString();
    }

    // Fallback to title
    const title = el.getAttribute('title') || el.parentElement?.getAttribute('title') || el.querySelector('[title]')?.getAttribute('title') || "";
    if (title) {
      const match = title.match(/(\d+)\u00B0/);
      if (match) return match[1];
    }
    
    // Fallback to cardinal
    const cardinalMap = {
      'N': 0, 'NNE': 22.5, 'NE': 45, 'ENE': 67.5, 'E': 90, 'ESE': 112.5, 'SE': 135, 'SSE': 157.5,
      'S': 180, 'SSW': 202.5, 'SW': 225, 'WSW': 247.5, 'W': 270, 'WNW': 292.5, 'NW': 315, 'NNW': 337.5
    };
    const text = el.textContent.trim();
    const combined = (title + ' ' + alt + ' ' + text).toUpperCase();
    for (const [key, val] of Object.entries(cardinalMap)) {
      const regex = new RegExp(`(?:\\s|\\(|^)${key}(?:\\s|\\)|$)`);
      if (regex.test(combined)) return Math.round(val).toString();
    }
    
    return "0";
  };

  const daySections = Array.from(document.querySelectorAll('.fc-day, [class*="_day_"]'));
  
  return daySections.map(day => {
    const headerEl = day.querySelector('.fc-day-header, [class*="header"], [class*="daylabel"]');
    if (!headerEl) return null;
    const dateText = headerEl.textContent.trim().split('\n')[0];
    
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

      const windDirEl = col.querySelector('.cell-wd, [class*="wind"] img, [class*="wd"] img, [title*="wind direction" i]');
      const waveDirEl = col.querySelector('.cell-waves-wrapper img, [class*="waves"] img, .cell-wh [title], [title*="swell direction" i], [title*="wave direction" i]');

      const wDir = getDirFromEl(windDirEl);
      const sDir = getDirFromEl(waveDirEl);

      return {
        time: timeStr,
        windSpeed: getVal('cell-ws') || getVal('speed'),
        windDir: wDir,
        waveHeight: getVal('cell-wh') || getVal('height'),
        wavePeriod: getVal('cell-wp') || getVal('period'),
        swellDir: sDir
      };
    }).filter(r => r !== null);

    return { dateText, rows };
  }).filter(d => d && d.rows.length > 0);
}
