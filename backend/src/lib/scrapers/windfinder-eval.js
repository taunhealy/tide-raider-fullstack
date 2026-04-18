
console.log("!!! WIND-EVAL INJECTED !!!");
/**
 * Windfinder extraction script - Final Production Version
 */
function extractWindfinderData() {
  const getDirFromEl = (el) => {
    if (!el) return null;
    
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
    
    return null;
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

      const windDirEl = col.querySelector('.cell-wd img, [class*="wind"] img, [class*="wd"] img, [title*="wind direction" i]');
      const waveDirEl = col.querySelector('.cell-wad img, .cell-waves-wrapper img, [class*="waves"] img, .cell-wh [title], [title*="swell direction" i], [title*="wave direction" i]') || 
                        col.querySelector('img[src*="pointer-outline"]');

      const wDir = getDirFromEl(windDirEl);
      const sDir = getDirFromEl(waveDirEl);

      // Extract Tide Info
      let tideState = "";
      let tideHeight = "";
      let tidePeak = "";

      const rowEls = Array.from(day.querySelectorAll('.forecast-row, [class*="row"]'));
      
      // Helper to find row by label or data-row-name
      const findRow = (name, labelText) => {
        return rowEls.find(r => 
          r.getAttribute('data-row-name') === name || 
          r.querySelector('._label-cell, .row-label')?.textContent.toLowerCase().includes(labelText)
        );
      };

      const typeRow = findRow('tide-type', 'tide type');
      const heightRow = findRow('tide-height', 'tide height');
      const peakRow = findRow('tide-time', 'time'); // Peak time row

      const colIdx = columns.indexOf(col);

      if (typeRow) {
        const dataCells = Array.from(typeRow.querySelectorAll('._cell, .cell, [class*="cell"]'));
        const cell = dataCells[colIdx];
        const icon = cell?.querySelector('._tide-icon, ._tide-type-icon, img');
        const iconText = icon?.textContent || icon?.getAttribute('title') || "";
        const cellClasses = cell?.className || "";
        
        if (cellClasses.includes('rising') || iconText.includes('↗') || iconText.includes('rising')) tideState = "Rising";
        else if (cellClasses.includes('falling') || iconText.includes('↘') || iconText.includes('falling')) tideState = "Falling";
        else if (cellClasses.includes('high') || iconText.includes('┍┑')) tideState = "High";
        else if (cellClasses.includes('low') || iconText.includes('┕┙')) tideState = "Low";
      }

      if (heightRow) {
        const dataCells = Array.from(heightRow.querySelectorAll('._cell, .cell, [class*="cell"]'));
        tideHeight = dataCells[colIdx]?.textContent.trim() || "";
      }

      if (peakRow) {
        const dataCells = Array.from(peakRow.querySelectorAll('._cell, .cell, [class*="cell"]'));
        tidePeak = dataCells[colIdx]?.textContent.trim() || "";
      }

      return {
        time: timeStr,
        windSpeed: getVal('cell-ws') || getVal('speed'),
        windDir: wDir,
        waveHeight: getVal('cell-wh') || getVal('height'),
        wavePeriod: getVal('cell-wp') || getVal('period'),
        swellDir: sDir,
        tide: tideState ? `${tideState}${tideHeight ? ' (' + tideHeight + 'm)' : ''}${tidePeak ? ' Peak: ' + tidePeak : ''}` : ""
      };
    }).filter(r => r !== null);

    return { dateText, rows };
  }).filter(d => d && d.rows.length > 0);
}
