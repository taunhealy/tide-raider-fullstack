
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

      // Optimize: Index rows by label once per day
      const rowEls = Array.from(day.querySelectorAll('.forecast-row, [class*="row"], [class*="_row_"]'));
      const rowMap = {};
      rowEls.forEach(r => {
        const label = r.querySelector('._label-cell, .row-label, [class*="label"]')?.textContent.toLowerCase() || "";
        const name = r.getAttribute('data-row-name') || "";
        if (name) rowMap[name] = r;
        if (label) {
           if (label.includes('wind speed') || label.includes('speed')) rowMap['wind-speed'] = r;
           if (label.includes('wave height') || label.includes('swell height') || label.includes('height')) rowMap['wave-height'] = r;
           if (label.includes('wave period') || label.includes('swell period') || label.includes('period')) rowMap['wave-period'] = r;
           if (label.includes('tide type')) rowMap['tide-type'] = r;
           if (label.includes('tide height')) rowMap['tide-height'] = r;
           if (label.includes('time')) rowMap['tide-time'] = r;
        }
      });

      const rows = columns.map(col => {
        const timeEl = col.querySelector('.cell-ts, .forecast-hour, [class*="time"]') || col;
        const timeStr = timeEl.textContent.trim().match(/\d{2}h/)?.[0] || "";
        if (!timeStr) return null;

        const colIdx = columns.indexOf(col);

        const getVal = (cls, rowKey) => {
          let el = col.querySelector('.' + cls) || col.querySelector(`[class*="${cls}"]`);
          if (!el && rowKey && rowMap[rowKey]) {
             const cells = Array.from(rowMap[rowKey].querySelectorAll('._cell, .cell, [class*="cell"]'));
             el = cells[colIdx];
          }
          if (!el) return "0";
          return el.textContent.trim().replace(",", ".").replace(/[^0-9.]/g, "");
        };

        const windDirEl = col.querySelector('.cell-wd img, [class*="wind"] img, [class*="wd"] img, [title*="wind direction" i]');
        const waveDirEl = col.querySelector('.cell-wad img, .cell-waves-wrapper img, [class*="waves"] img, .cell-wh [title], [title*="swell direction" i], [title*="wave direction" i]') || 
                          col.querySelector('img[src*="pointer-outline"]');

        const wDir = getDirFromEl(windDirEl);
        const sDir = getDirFromEl(waveDirEl);

        let tideState = "";
        const typeRow = rowMap['tide-type'];
        if (typeRow) {
          const cells = Array.from(typeRow.querySelectorAll('._cell, .cell, [class*="cell"]'));
          const cell = cells[colIdx];
          const icon = cell?.querySelector('._tide-icon, ._tide-type-icon, img');
          const iconText = icon?.textContent || icon?.getAttribute('title') || "";
          const cellClasses = cell?.className || "";
          if (cellClasses.includes('rising') || iconText.includes('↗')) tideState = "Rising";
          else if (cellClasses.includes('falling') || iconText.includes('↘')) tideState = "Falling";
        }

        return {
          time: timeStr,
          windSpeed: getVal('cell-ws', 'wind-speed'),
          windDir: wDir,
          waveHeight: getVal('cell-wh', 'wave-height'),
          wavePeriod: getVal('cell-wp', 'wave-period'),
          swellDir: sDir,
          tide: tideState || ""
        };
      }).filter(r => r !== null);

      return { dateText, rows };
    }).filter(d => d && d.rows.length > 0);
}
