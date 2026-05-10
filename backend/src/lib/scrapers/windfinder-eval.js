
console.log("!!! WIND-EVAL INJECTED - V2 ROBUST !!!");
/**
 * Windfinder extraction script - Final Production Version
 */
function extractWindfinderData() {
  const getDirFromEl = (el) => {
    if (!el) return null;
    
    // Check for alt attribute
    const img = el.tagName === 'IMG' ? el : el.querySelector('img');
    const alt = img?.getAttribute('alt') || el.getAttribute('alt') || "";
    if (alt) {
      const match = alt.match(/(\d+(?:\.\d+)?)\u00B0/);
      if (match) return Math.round(parseFloat(match[1])).toString();
    }

    // Check for style transform rotate
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

  // Day detection: Try class-based sections first, then fallback to header-based splitting
  let daySections = Array.from(document.querySelectorAll('.fc-day, [class*="_day_"], .forecast-day, [class*="day-wrapper"], [class*="day-container"], [class*="day-section"], [class*="DaySection"], [class*="FcTableDay"]'));
  
  if (daySections.length === 0) {
    console.log("⚠️ No class-based day sections found. Falling back to header-based detection...");
    // Find all day headers - updated to match "Friday, May 08" pattern
    const headers = Array.from(document.querySelectorAll('h3, h4, [class*="header"], [class*="daylabel"], [class*="DayHeader"]'))
      .filter(h => h.innerText.match(/\w+, \w+ \d+/) || h.innerText.match(/(?:Today|Tomorrow|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)/i));
    
    if (headers.length > 0) {
      daySections = headers.map((header, idx) => {
        const nextHeader = headers[idx + 1];
        const section = document.createElement('div');
        section.appendChild(header.cloneNode(true));
        
        // Find the nearest common ancestor or just siblings
        let next = header.nextElementSibling || header.parentElement?.nextElementSibling;
        while (next && (!nextHeader || !next.contains(nextHeader)) && next !== nextHeader) {
          section.appendChild(next.cloneNode(true));
          next = next.nextElementSibling;
        }
        section.className = 'pseudo-day-section';
        return section;
      });
    }
  }

  return daySections.map(day => {
    const headerEl = day.querySelector('.fc-day-header, [class*="header"], [class*="daylabel"], .forecast-day__header, [class*="DayHeader"], h3, h4');
    if (!headerEl) return null;
    const dateText = headerEl.textContent.trim().split('\n')[0];
    
    // Find all columns (hour cells)
    const columns = Array.from(day.querySelectorAll('.fc-table-horizon, .forecast-column, [class*="column"], [class*="col"], td, .forecast-row__cell, [class*="Column"], [class*="Cell"], [class*="HourCell"]'))
      .filter(el => {
         const t = el.textContent || "";
         // Match "07h", "08:00", etc.
         return /(\d{1,2}h|\d{2}:\d{2})/.test(t) && t.length < 50; 
      });

    // Row mapping: Search for labels and identify their parent row/container
    const rowMap = {};
    const possibleLabels = Array.from(day.querySelectorAll('[class*="label"], [class*="Label"], [class*="_label_"], span, a, div'));
    
    possibleLabels.forEach(labelEl => {
      const label = labelEl.textContent.toLowerCase().trim();
      const parentRow = labelEl.closest('.forecast-row, [class*="row"], [class*="Row"], [class*="row-wrapper"], [class*="FcTableRow"], [class*="Container"]');
      if (!parentRow || !label) return;

      if ((label === 'wind speed' || label.startsWith('wind speed') || label === 'speed') && !label.includes('wave') && !label.includes('gust')) rowMap['wind-speed'] = parentRow;
      if ((label === 'wave height' || label === 'swell height' || label.startsWith('wave height') || label === 'height') && !label.includes('tide')) rowMap['wave-height'] = parentRow;
      if (label === 'wave period' || label === 'swell period' || label.startsWith('wave period') || (label === 'period' && !label.includes('tide'))) rowMap['wave-period'] = parentRow;
      if ((label === 'tide height' || label.includes('tide (m)')) && !label.includes('period') && !label.includes('wave')) rowMap['tide-height'] = parentRow;
      if (label.includes('tide') || label.includes('maritime') || label.includes('tide height')) rowMap['tide-type'] = parentRow;
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

      // Find Tide trend by checking ALL SVGs and Titles
      let tideState = "";
      const titles = Array.from(col.querySelectorAll('svg title, [title]'));
      for (const title of titles) {
        const t = (title.textContent || title.getAttribute('title') || "").toLowerCase();
        if (t.includes('rising') || t.includes('↗')) tideState = "Rising";
        else if (t.includes('falling') || t.includes('↘')) tideState = "Falling";
        else if (t.includes('high tide')) tideState = "High";
        else if (t.includes('low tide')) tideState = "Low";
      }

      // Check for specific character indicators as mentioned in docs
      const colText = col.innerText;
      if (!tideState) {
        if (colText.includes('↗')) tideState = "Rising";
        else if (colText.includes('↘')) tideState = "Falling";
      }

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
    
    // Post-process: Propagate tide trends (Rising/Falling)
    for (let i = 0; i < rows.length; i++) {
      if (!rows[i].tide && rows[i].time.includes('h')) {
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
        } else if (prevTrend && (prevTrend === "Rising" || prevTrend === "Falling")) {
          rows[i].tide = prevTrend;
        }
      }
    }

    return { dateText, rows };
  }).filter(d => d && d.rows.length > 0);
}
