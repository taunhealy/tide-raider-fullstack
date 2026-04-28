
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
      
      const columns = Array.from(day.querySelectorAll('.fc-table-horizon, .forecast-column, [class*="column"], [class*="col"], td'))
        .filter(el => {
           const t = el.textContent || "";
           // Support 3-hour intervals (02h) AND peak tide times (05:42)
           return /(\d{2}h|\d{2}:\d{2})/.test(t) && t.length < 50; 
        });

      // Optimize: Index rows by label once per day
      const rowEls = Array.from(day.querySelectorAll('.forecast-row, [class*="row"], [class*="_row_"]'));
      const rowMap = {};
      rowEls.forEach(r => {
        const labelEl = r.querySelector('._label-cell, .row-label, [class*="label"], [class*="tide"]');
        const label = labelEl?.textContent.toLowerCase().trim() || "";
        const name = r.getAttribute('data-row-name') || "";
        const rowClasses = r.className.toLowerCase();
        
        if (name) rowMap[name] = r;
        if ((label.includes('wind speed') || label.includes('speed')) && !label.includes('wave')) rowMap['wind-speed'] = r;
        if ((label.includes('wave height') || label.includes('swell height') || label.includes('height')) && !label.includes('tide')) rowMap['wave-height'] = r;
        if (label.includes('wave period') || label.includes('swell period') || (label.includes('period') && !label.includes('tide'))) rowMap['wave-period'] = r;
        if ((label.includes('tide height') || label.includes('tide (m)')) && !label.includes('period') && !label.includes('wave')) rowMap['tide-height'] = r;
        if (label.includes('tide') || label.includes('maritime') || rowClasses.includes('tide')) rowMap['tide-type'] = r;
      });

      const rows = columns.map(col => {
        const timeEl = col.querySelector('.cell-ts, .forecast-hour, [class*="time"]') || col;
        const timeStr = timeEl.textContent.trim().match(/(\d{2}h|\d{2}:\d{2})/)?.[0] || "";
        if (!timeStr) return null;

        const colIdx = columns.indexOf(col);

        const getVal = (cls, rowKey) => {
          let el = col.querySelector('.' + cls) || col.querySelector(`[class*="${cls}"]`);
          if (!el && rowKey && rowMap[rowKey]) {
             const cells = Array.from(rowMap[rowKey].querySelectorAll('._cell, .cell, [class*="cell"]'));
             el = cells[colIdx];
          }
          if (!el) return "";
          return el.textContent.trim().replace(",", ".").replace(/[^0-9.]/g, "");
        };

        const windDirEl = col.querySelector('.cell-wd img, [class*="wind"] img, [class*="wd"] img, [title*="wind direction" i]');
        const waveDirEl = col.querySelector('.cell-wad img, .cell-waves-wrapper img, [class*="waves"] img, .cell-wh [title], [title*="swell direction" i], [title*="wave direction" i]') || 
                          col.querySelector('img[src*="pointer-outline"]');

        const wDir = getDirFromEl(windDirEl);
        const sDir = getDirFromEl(waveDirEl);

        // Find Tide trend by checking ALL SVGs in this column
        let tideState = "";
        const svgs = Array.from(col.querySelectorAll('svg title'));
        for (const title of svgs) {
          const t = title.textContent || "";
          if (t.includes('Rising')) tideState = "Rising";
          else if (t.includes('Falling')) tideState = "Falling";
          else if (t.includes('High tide')) tideState = "High";
          else if (t.includes('Low tide')) tideState = "Low";
        }

        // Fallback: Check icons or titles with more specific patterns
        if (!tideState) {
           const tideIcon = col.querySelector('svg, img[src*="tide"], img[src*="wave"], [class*="icon-tide"]');
           const alt = tideIcon?.getAttribute('alt')?.toLowerCase() || "";
           const titleText = col.querySelector('[title]')?.getAttribute('title')?.toLowerCase() || "";
           const classes = tideIcon?.className?.toLowerCase() || "";

           if (alt.includes('rising') || titleText.includes('rising') || classes.includes('rising')) tideState = "Rising";
           else if (alt.includes('falling') || titleText.includes('falling') || classes.includes('falling')) tideState = "Falling";
           else if (alt.includes('high') || titleText.includes('high') || classes.includes('high')) tideState = "High";
           else if (alt.includes('low') || titleText.includes('low') || classes.includes('low')) tideState = "Low";
        }

        // Tide height: only read from the explicit tide-height row.
        // DO NOT fall back to 'cell-wp' — that class is shared with wave period
        // and causes the swell period (e.g. 10s) to be stored as "10m" tide height.
        let tideHeight = "";
        if (rowMap['tide-height']) {
          const cells = Array.from(rowMap['tide-height'].querySelectorAll('._cell, .cell, [class*="cell"]'));
          const el = cells[colIdx];
          if (el) tideHeight = el.textContent.trim().replace(",", ".").replace(/[^0-9.]/g, "");
        }

        return {
          time: timeStr,
          windSpeed: getVal('cell-ws', 'wind-speed'),
          windDir: wDir,
          waveHeight: getVal('cell-wh', 'wave-height'),
          wavePeriod: getVal('cell-wp', 'wave-period'),
          swellDir: sDir,
          tide: tideState,
          tideHeight: tideHeight
        };
      }).filter(r => r !== null);
      
      // Post-process: Propagate tide trends (Rising/Falling) to fill gaps
      for (let i = 0; i < rows.length; i++) {
        if (!rows[i].tide && rows[i].time.includes('h')) {
          // Look for nearest trend or peak
          let prev = rows[i-1];
          let next = rows[i+1];
          
          if (prev && next) {
             const hPrev = parseFloat(prev.tideHeight);
             const hNext = parseFloat(next.tideHeight);
             const hCurr = parseFloat(rows[i].tideHeight);
             
             if (!isNaN(hCurr) && !isNaN(hPrev) && !isNaN(hNext)) {
                if (hCurr > hPrev && hCurr < hNext) rows[i].tide = "Rising";
                else if (hCurr < hPrev && hCurr > hNext) rows[i].tide = "Falling";
                else if (hCurr > hPrev && hCurr > hNext) rows[i].tide = "High";
                else if (hCurr < hPrev && hCurr < hNext) rows[i].tide = "Low";
             }
          }

          if (!rows[i].tide) {
            let prevTrend = "";
            for (let j = i - 1; j >= 0; j--) {
              if (rows[j].tide) {
                prevTrend = rows[j].tide;
                break;
              }
            }
            let nextTrend = "";
            for (let j = i + 1; j < rows.length; j++) {
              if (rows[j].tide) {
                nextTrend = rows[j].tide;
                break;
              }
            }
            if (prevTrend && prevTrend === nextTrend) {
              rows[i].tide = prevTrend;
            } else if (prevTrend && !nextTrend) {
              rows[i].tide = prevTrend;
            } else if (nextTrend && !prevTrend) {
              rows[i].tide = nextTrend;
            }
          }
        }
      }

      return { dateText, rows };
    }).filter(d => d && d.rows.length > 0);
}
