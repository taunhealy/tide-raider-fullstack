function extractWindyComData() {
  const table = document.querySelector('.main-table__data-table');
  if (!table) return { error: "Table not found" };

  const hoursRow = table.querySelector('tr[data-t="hours"]');
  const daysRow = table.querySelector('tr[data-t="day"]');
  const windRow = table.querySelector('tr[data-t="wind"]');
  const wavesRow = table.querySelector('tr[data-t="waves"]');
  const swell1Row = table.querySelector('tr[data-t="swell1"], tr[data-t="swell"]');
  const swell2Row = table.querySelector('tr[data-t="swell2"]');
  const swell3Row = table.querySelector('tr[data-t="swell3"]');
  const period1Row = table.querySelector('tr[data-t="swellPeriod1"], tr[data-t="swellPeriod"], tr[data-t="period"]');
  const period2Row = table.querySelector('tr[data-t="swellPeriod2"], tr[data-t="period2"]');
  const period3Row = table.querySelector('tr[data-t="swellPeriod3"], tr[data-t="period3"]');
  const energyRow = table.querySelector('tr[data-t="swellEnergy"], tr[data-t="energy"], tr[data-t="power"]');
  const tideRow = table.querySelector('tr[data-t="tides"]');

  if (!hoursRow || !windRow) return { error: "Required rows not found" };

  const hourCells = Array.from(hoursRow.querySelectorAll('td'));
  const dayCells = daysRow ? Array.from(daysRow.querySelectorAll('td')) : [];
  const results = [];

  // Map each hour index to a day string
  const indexToDay = new Array(hourCells.length);
  let hourCounter = 0;

  if (dayCells.length > 0) {
      dayCells.forEach(dayCell => {
          const colspan = parseInt(dayCell.getAttribute('colspan') || '1');
          const dayText = dayCell.textContent.trim();
          for (let j = 0; j < colspan; j++) {
              if (hourCounter + j < indexToDay.length) {
                  indexToDay[hourCounter + j] = dayText;
              }
          }
          hourCounter += colspan;
      });
  }

  hourCells.forEach((cell, i) => {
    const hourText = cell.textContent.trim();
    const hourMatch = hourText.match(/(\d+)/);
    if (!hourMatch) return;

    const hour = parseInt(hourMatch[1]);
    const dayName = indexToDay[i] || "Today";

    const windCell = windRow.querySelectorAll('td')[i];
    const wavesCell = wavesRow ? wavesRow.querySelectorAll('td')[i] : null;
    
    const swell1Cell = swell1Row ? swell1Row.querySelectorAll('td')[i] : null;
    const swell2Cell = swell2Row ? swell2Row.querySelectorAll('td')[i] : null;
    const swell3Cell = swell3Row ? swell3Row.querySelectorAll('td')[i] : null;
    
    const period1Cell = period1Row ? period1Row.querySelectorAll('td')[i] : null;
    const period2Cell = period2Row ? period2Row.querySelectorAll('td')[i] : null;
    const period3Cell = period3Row ? period3Row.querySelectorAll('td')[i] : null;
    
    const energyCell = energyRow ? energyRow.querySelectorAll('td')[i] : null;
    const tideCell = tideRow ? tideRow.querySelectorAll('td')[i] : null;

    const extractVal = (cell) => {
      if (!cell) return 0;
      const text = cell.textContent.replace(/[^\d.]/g, '').trim();
      return parseFloat(text) || 0;
    };

    const extractDir = (cell) => {
      if (!cell) return 0;
      const div = cell.querySelector('div[style*="transform"]');
      if (!div) return 0;
      const match = div.style.transform.match(/rotate\((\d+)deg\)/);
      return match ? parseInt(match[1]) : 0;
    };

    results.push({
      hour: hour,
      day: dayName,
      windSpeed: extractVal(windCell),
      windDirection: extractDir(windCell), 
      waveHeight: extractVal(wavesCell),
      waveDirection: extractDir(wavesCell),
      
      swellHeight: extractVal(swell1Cell),
      swellPeriod: extractVal(period1Cell),
      swellDirection: extractDir(swell1Cell),
      
      swellHeight2: extractVal(swell2Cell),
      swellPeriod2: extractVal(period2Cell),
      swellDirection2: extractDir(swell2Cell),
      
      swellHeight3: extractVal(swell3Cell),
      swellPeriod3: extractVal(period3Cell),
      swellDirection3: extractDir(swell3Cell),
      
      swellEnergy: extractVal(energyCell),
      tide: tideCell ? tideCell.textContent.trim() : ""
    });
  });

  return results;
}
