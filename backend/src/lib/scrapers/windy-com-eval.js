function extractWindyComData() {
  const dataRows = Array.from(document.querySelectorAll('.main-table__data-table tr'));
  if (dataRows.length === 0) return { error: "No data rows found" };

  // Corrected indices based on Wave Forecast view observed in logs:
  // Row 0: Days
  // Row 1: Hours
  // Row 2: Icons
  // Row 3: Temp
  // Row 4: Wind / Gusts (e.g., "15 25")
  // Row 5: Waves
  // Row 6: Swell 1
  // Row 7: Swell Period 1
  // Row 8: Swell Energy / Wave Power
  // Row 9: Tides

  const hoursRow = dataRows[1]; 
  const windRow = dataRows[4];
  const wavesRow = dataRows[5];
  const swell1Row = dataRows[6];
  const period1Row = dataRows[7];
  const energyRow = dataRows[8];
  const tideRow = dataRows[9];

  const hourCells = Array.from(hoursRow.querySelectorAll('td'));
  const results = [];

  const extractVal = (row, index) => {
    if (!row) return 0;
    const cells = row.querySelectorAll('td');
    const cell = cells[index];
    if (!cell) return 0;
    
    // Get all text content and extract the primary numeric value
    const text = cell.innerText || cell.textContent || "";
    const matches = text.match(/[\d.]+/g);
    
    if (!matches || matches.length === 0) return 0;
    
    return parseFloat(matches[0]);
  };

  const extractDir = (row, index) => {
    if (!row) return 0;
    const cells = row.querySelectorAll('td');
    const cell = cells[index];
    if (!cell) return 0;
    const div = cell.querySelector('div[style*="transform"]');
    if (!div) return 0;
    const match = div.style.transform.match(/rotate\((\d+)deg\)/);
    return match ? parseInt(match[1]) : 0;
  };

  hourCells.forEach((cell, i) => {
    const hourText = cell.textContent.trim();
    const hourMatch = hourText.match(/(\d+)/);
    if (!hourMatch) return;

    results.push({
      hour: parseInt(hourMatch[1]),
      day: "Today",
      windSpeed: extractVal(windRow, i),
      windDirection: extractDir(windRow, i), 
      waveHeight: extractVal(wavesRow, i),
      waveDirection: extractDir(wavesRow, i),
      swellHeight: extractVal(swell1Row, i),
      swellPeriod: extractVal(period1Row, i),
      swellDirection: extractDir(swell1Row, i),
      swellEnergy: extractVal(energyRow, i),
      tide: tideRow && tideRow.querySelectorAll('td')[i] ? tideRow.querySelectorAll('td')[i].textContent.trim() : ""
    });
  });

  return results;
}
