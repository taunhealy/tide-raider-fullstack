// Plain JavaScript evaluation code for Windy.app scraper
// This file is loaded as a string to avoid TypeScript helper injection
function extractWindyData() {
  console.log("[scraperC] [page.evaluate] Starting data extraction...");

  // First, let's find all tables and rows to debug
  const allTables = document.querySelectorAll("table");
  console.log("[scraperC] [page.evaluate] Found " + allTables.length + " table(s) on page");
  
  // Try to find the table containing the windy widget
  let targetTable = null;
  let targetTbody = null;
  for (let i = 0; i < allTables.length; i++) {
    const table = allTables[i];
    // First try to find the row directly in the table
    let daysRow = table.querySelector("tr.windywidgetdays, tr#windyWidgetDays");
    if (daysRow) {
      targetTable = table;
      console.log("[scraperC] [page.evaluate] Found target table " + i + " containing windy widget (direct)");
      break;
    }
    // Also check inside tbody
    const tbody = table.querySelector("tbody");
    if (tbody) {
      daysRow = tbody.querySelector("tr.windywidgetdays, tr#windyWidgetDays");
      if (daysRow) {
        targetTable = table;
        targetTbody = tbody;
        console.log("[scraperC] [page.evaluate] Found target table " + i + " containing windy widget (in tbody)");
        break;
      }
    }
  }
  
  // If we found a target tbody, search within it; otherwise search within the table; otherwise search globally
  let searchContext = targetTbody || targetTable || document;
  
  // If we found a table but no tbody, try to find the tbody within the table
  if (targetTable && !targetTbody) {
    const tbody = targetTable.querySelector("tbody");
    if (tbody) {
      searchContext = tbody;
      targetTbody = tbody;
      console.log("[scraperC] [page.evaluate] Found tbody within target table");
    }
  }
  
  const allRows = searchContext.querySelectorAll("tr");
  const contextType = targetTbody ? "target tbody" : (targetTable ? "target table" : "document");
  console.log("[scraperC] [page.evaluate] Found " + allRows.length + " row(s) in " + contextType);
  
  // Log all rows for debugging
  console.log("[scraperC] [page.evaluate] All rows in context:");
  Array.from(allRows).forEach(function(row, idx) {
    const className = row.className || "";
    const id = row.id || "none";
    const cells = Array.from(row.querySelectorAll("td, th"));
    const firstCellText = cells.length > 0 ? (cells[0].textContent || "").trim().substring(0, 20) : "no cells";
    console.log("[scraperC] [page.evaluate] Row " + idx + ": class='" + className + "', id='" + id + "', cells=" + cells.length + ", firstCell='" + firstCellText + "'");
  });
  
  // Try to find rows with windy-related classes
  const windyRows = Array.from(allRows).filter(function(row) {
    const className = row.className || "";
    return className.indexOf("windy") !== -1 || className.indexOf("wind") !== -1;
  });
  console.log("[scraperC] [page.evaluate] Found " + windyRows.length + " row(s) with 'windy' or 'wind' in class");
  
  if (windyRows.length > 0) {
    console.log("[scraperC] [page.evaluate] Sample row classes:", windyRows.slice(0, 5).map(function(r) { return r.className + " (id:" + (r.id || "none") + ")"; }));
  }

  // Find the days row to map columns to dates
  // Priority 1: Find row with id="windyWidgetDays" (this is the actual data row)
  // Try in searchContext first, then in document if not found
  let daysRow = searchContext.querySelector("tr#windyWidgetDays");
  if (!daysRow && searchContext !== document) {
    // If not found in tbody/table, try searching in document
    daysRow = document.querySelector("tr#windyWidgetDays");
    if (daysRow) {
      console.log("[scraperC] [page.evaluate] Found days row by id in document (not in searchContext)");
    }
  }
  if (daysRow) {
    const cells = Array.from(daysRow.querySelectorAll("td, th"));
    console.log("[scraperC] [page.evaluate] ✅ Found days row by id (cells=" + cells.length + ", id=" + daysRow.id + ")");
    // Verify it has multiple cells
    if (cells.length <= 1) {
      console.error("[scraperC] [page.evaluate] ⚠️ Row with id has only " + cells.length + " cell(s), this might be wrong!");
      daysRow = null; // Don't use this row if it only has 1 cell
    }
  } else {
    console.log("[scraperC] [page.evaluate] ❌ Could not find row with id='windyWidgetDays' in searchContext or document");
  }
  
  // Priority 2: If not found, try finding by class and select the one with most cells
  if (!daysRow) {
    // Search in searchContext first, then in document if needed
    let allDaysRows = Array.from(searchContext.querySelectorAll("tr.windywidgetdays"));
    if (allDaysRows.length === 0 && searchContext !== document) {
      allDaysRows = Array.from(document.querySelectorAll("tr.windywidgetdays"));
      console.log("[scraperC] [page.evaluate] Searching in document for days rows...");
    }
    console.log("[scraperC] [page.evaluate] Found " + allDaysRows.length + " row(s) with class windywidgetdays");
    
    if (allDaysRows.length > 0) {
      // Find the row with the most cells (the actual data row should have many cells)
      let maxCells = 0;
      let bestRow = null;
      for (let i = 0; i < allDaysRows.length; i++) {
        const row = allDaysRows[i];
        const cells = Array.from(row.querySelectorAll("td, th"));
        const rowId = row.id || "none";
        console.log("[scraperC] [page.evaluate] Days row candidate " + i + ": id=" + rowId + ", cells=" + cells.length);
        if (cells.length > maxCells) {
          maxCells = cells.length;
          bestRow = row;
        }
      }
      if (bestRow && maxCells > 5) {
        daysRow = bestRow;
        console.log("[scraperC] [page.evaluate] ✅ Selected days row with most cells (cells=" + maxCells + ", id=" + (bestRow.id || "none") + ")");
      } else if (bestRow) {
        console.log("[scraperC] [page.evaluate] ⚠️ Best row only has " + maxCells + " cell(s), skipping (need > 5)");
      } else {
        console.log("[scraperC] [page.evaluate] ⚠️ No suitable days row found (all have <= 5 cells)");
      }
    }
  }
  
  // Priority 3: Fallback - find by class containing "day" and "windy"
  if (!daysRow) {
    const rowsWithDays = Array.from(allRows).filter(function(row) {
      const className = (row.className || "").toLowerCase();
      return className.indexOf("day") !== -1 && className.indexOf("windy") !== -1;
    });
    if (rowsWithDays.length > 0) {
      // Prefer the row with the most cells
      rowsWithDays.sort(function(a, b) {
        const aCells = Array.from(a.querySelectorAll("td, th")).length;
        const bCells = Array.from(b.querySelectorAll("td, th")).length;
        return bCells - aCells;
      });
      daysRow = rowsWithDays[0];
      const cellCount = Array.from(daysRow.querySelectorAll("td, th")).length;
      console.log("[scraperC] [page.evaluate] Found days row using fallback selector (cells=" + cellCount + ")");
    }
  }
  
  if (!daysRow) {
    console.error("[scraperC] [page.evaluate] Could not find days row");
    console.error("[scraperC] [page.evaluate] Tried selectors: tr.windywidgetdays, tr#windyWidgetDays, tr[id='windyWidgetDays']");
    // Log all row classes for debugging
    console.error("[scraperC] [page.evaluate] All row classes:", Array.from(allRows).slice(0, 10).map(function(r) { return r.className + " (id: " + (r.id || "none") + ")"; }));
    // Return debug info instead of null
    return { error: "Could not find days row", debug: { foundDays: 0, foundTimeColumns: 0, windDirectionsCount: 0, windSpeedsCount: 0 } };
  }

  console.log("[scraperC] [page.evaluate] Found days row, class: " + daysRow.className + ", id: " + (daysRow.id || "none"));
  
  // Check if this row is inside a thead or tbody
  const parent = daysRow.parentElement;
  const parentTag = parent ? parent.tagName : "none";
  console.log("[scraperC] [page.evaluate] Days row parent: " + parentTag);
  
  // Try to find all cells - both th and td
  const allDayCells = Array.from(daysRow.querySelectorAll("td, th"));
  console.log("[scraperC] [page.evaluate] Found " + allDayCells.length + " day cell(s) (td+th)");
  
  // Also try direct children
  const directChildren = Array.from(daysRow.children);
  console.log("[scraperC] [page.evaluate] Days row has " + directChildren.length + " direct children");
  directChildren.forEach(function(child, idx) {
    console.log("[scraperC] [page.evaluate] Child " + idx + ": tag=" + child.tagName + ", class=" + (child.className || "none"));
  });
  
  // Use both td and th elements
  const dayCells = Array.from(daysRow.querySelectorAll("td, th"));
  console.log("[scraperC] [page.evaluate] Found " + dayCells.length + " day cell(s) (td+th)");
  
  // Log first few cells for debugging
  if (dayCells.length > 0) {
    console.log("[scraperC] [page.evaluate] First day cell text: '" + (dayCells[0].textContent || "").trim() + "'");
    console.log("[scraperC] [page.evaluate] First day cell colspan: " + (dayCells[0].getAttribute("colspan") || "1"));
    const firstDiv = dayCells[0].querySelector("div");
    if (firstDiv) {
      console.log("[scraperC] [page.evaluate] First day cell div text: '" + (firstDiv.textContent || "").trim() + "'");
    }
    // Log first 10 cells for debugging
    for (let i = 0; i < Math.min(10, dayCells.length); i++) {
      const cell = dayCells[i];
      const cellText = (cell.textContent || "").trim();
      const innerDiv = cell.querySelector("div");
      const divText = (innerDiv && innerDiv.textContent && innerDiv.textContent.trim()) || "";
      const finalText = cellText || divText;
      const colspan = cell.getAttribute("colspan") || "1";
      console.log("[scraperC] [page.evaluate] Day cell " + i + ": text='" + finalText + "', colspan=" + colspan);
    }
  } else {
    console.error("[scraperC] [page.evaluate] ⚠️ No day cells found in days row!");
    console.error("[scraperC] [page.evaluate] Days row innerHTML length: " + (daysRow.innerHTML ? daysRow.innerHTML.length : 0));
    console.error("[scraperC] [page.evaluate] Days row HTML (first 1000 chars):", daysRow.innerHTML ? daysRow.innerHTML.substring(0, 1000) : "null");
  }
  
  const dayMapping = [];
  let currentCol = 0;

  dayCells.forEach(function (cell, index) {
    const colspan = parseInt(cell.getAttribute("colspan") || "1", 10);
    const dayText = (cell.textContent && cell.textContent.trim()) || "";
    // Also check inner div text content
    const innerDiv = cell.querySelector("div");
    const divText = (innerDiv && innerDiv.textContent && innerDiv.textContent.trim()) || "";
    const finalDayText = dayText || divText;
    
    // Filter out header cells and unit cells
    const upperText = finalDayText.toUpperCase();
    const isHeaderCell = upperText === "M/S" || upperText === "KM/H" || upperText === "TIME" || 
                         upperText === "WIND" || upperText === "SWELL" || upperText === "M" ||
                         upperText === "" || upperText.length === 0;
    
    if (!isHeaderCell && finalDayText && finalDayText.length > 0) {
      dayMapping.push({
        startCol: currentCol,
        endCol: currentCol + colspan - 1,
        dayText: finalDayText,
      });
      console.log("[scraperC] [page.evaluate] Day " + index + ": '" + finalDayText + "' (cols " + currentCol + "-" + (currentCol + colspan - 1) + ")");
    } else if (index < 5) {
      console.log("[scraperC] [page.evaluate] Skipping day cell " + index + ": text='" + finalDayText + "', colspan=" + colspan);
    }
    currentCol += colspan;
  });

  console.log(
    "[scraperC] [page.evaluate] Found " + dayMapping.length + " day(s):",
    dayMapping
  );

  // Find the hours row to get time columns - try multiple selectors
  // Data rows are in document, not in tbody (tbody only has header rows)
  // Search in document first, and verify it has multiple cells
  let hoursRow = document.querySelector("tr.windywidgethours");
  if (hoursRow) {
    const cells = Array.from(hoursRow.querySelectorAll("td, th"));
    if (cells.length <= 1) {
      // This is a header row, not the data row - search for one with more cells
      console.log("[scraperC] [page.evaluate] Found hours row but only has " + cells.length + " cell(s), searching for data row...");
      hoursRow = null;
    } else {
      console.log("[scraperC] [page.evaluate] Found hours row in document (cells=" + cells.length + ")");
    }
  }
  if (!hoursRow) {
    // Try finding by class containing "hour" - search in document
    const allDocRows = document.querySelectorAll("tr");
    const rowsWithHours = Array.from(allDocRows).filter(function(row) {
      const className = (row.className || "").toLowerCase();
      return className.indexOf("hour") !== -1 && className.indexOf("windy") !== -1;
    });
    if (rowsWithHours.length > 0) {
      // Find the row with the most cells (the actual data row)
      let maxCells = 0;
      let bestRow = null;
      for (let i = 0; i < rowsWithHours.length; i++) {
        const row = rowsWithHours[i];
        const cells = Array.from(row.querySelectorAll("td, th"));
        if (cells.length > maxCells) {
          maxCells = cells.length;
          bestRow = row;
        }
      }
      if (bestRow && maxCells > 5) {
        hoursRow = bestRow;
        console.log("[scraperC] [page.evaluate] Found hours row using fallback selector (cells=" + maxCells + ")");
      }
    }
  }
  
  if (!hoursRow) {
    console.error("[scraperC] [page.evaluate] Could not find hours row");
    // Return debug info instead of null
    return { error: "Could not find hours row", debug: { foundDays: dayMapping.length, foundTimeColumns: 0, windDirectionsCount: 0, windSpeedsCount: 0 } };
  }

  console.log("[scraperC] [page.evaluate] Found hours row, class: " + hoursRow.className + ", id: " + (hoursRow.id || "none"));
  const hourCells = Array.from(hoursRow.querySelectorAll("td, th"));
  console.log("[scraperC] [page.evaluate] Found " + hourCells.length + " hour cell(s) (td+th)");
  
  // Log first few cells for debugging
  if (hourCells.length > 0) {
    console.log("[scraperC] [page.evaluate] First hour cell text: '" + (hourCells[0].textContent || "").trim() + "'");
    if (hourCells.length > 1) {
      console.log("[scraperC] [page.evaluate] Second hour cell text: '" + (hourCells[1].textContent || "").trim() + "'");
    }
  }
  
  const timeColumns = [];

  hourCells.forEach(function (cell, index) {
    const hourText = (cell.textContent && cell.textContent.trim()) || "";
    const hour = parseInt(hourText, 10);
    if (!isNaN(hour) && hour >= 0 && hour <= 23) {
      // Find which day this column belongs to
      let dayIndex = -1;
      for (let i = 0; i < dayMapping.length; i++) {
        if (
          index >= dayMapping[i].startCol &&
          index <= dayMapping[i].endCol
        ) {
          dayIndex = i;
          break;
        }
      }
      timeColumns.push({ index: index, hour: hour, dayIndex: dayIndex });
    } else if (index < 5) {
      console.log("[scraperC] [page.evaluate] Skipping hour cell " + index + ": text='" + hourText + "'");
    }
  });
  
  console.log("[scraperC] [page.evaluate] Created " + timeColumns.length + " time column(s)");

  console.log(
    "[scraperC] [page.evaluate] Found " + timeColumns.length + " time columns"
  );

  // Find wind direction row (contains rotation degrees in transform) - try multiple selectors
  // Data rows are in document, not in tbody (tbody only has header rows)
  // Search in document first, and verify it has multiple cells
  let windDirRow = document.querySelector("tr.windywidgetwindDirection.id-wind-direction");
  if (windDirRow) {
    const cells = Array.from(windDirRow.querySelectorAll("td, th"));
    if (cells.length <= 1) {
      console.log("[scraperC] [page.evaluate] Found wind direction row but only has " + cells.length + " cell(s), searching for data row...");
      windDirRow = null;
    } else {
      console.log("[scraperC] [page.evaluate] Found wind direction row in document (cells=" + cells.length + ")");
    }
  }
  if (!windDirRow) {
    windDirRow = document.querySelector("tr.windywidgetwindDirection");
    if (windDirRow) {
      const cells = Array.from(windDirRow.querySelectorAll("td, th"));
      if (cells.length <= 1) {
        windDirRow = null;
      }
    }
  }
  if (!windDirRow) {
    windDirRow = document.querySelector("tr.id-wind-direction");
    if (windDirRow) {
      const cells = Array.from(windDirRow.querySelectorAll("td, th"));
      if (cells.length <= 1) {
        windDirRow = null;
      }
    }
  }
  if (!windDirRow) {
    // Try finding by class containing "wind" and "direction" or "dir" - search in document
    const allDocRows = document.querySelectorAll("tr");
    const rowsWithWindDir = Array.from(allDocRows).filter(function(row) {
      const className = (row.className || "").toLowerCase();
      return (className.indexOf("wind") !== -1 || className.indexOf("wdir") !== -1) && 
             (className.indexOf("direction") !== -1 || className.indexOf("dir") !== -1);
    });
    if (rowsWithWindDir.length > 0) {
      // Find the row with the most cells (the actual data row)
      let maxCells = 0;
      let bestRow = null;
      for (let i = 0; i < rowsWithWindDir.length; i++) {
        const row = rowsWithWindDir[i];
        const cells = Array.from(row.querySelectorAll("td, th"));
        if (cells.length > maxCells) {
          maxCells = cells.length;
          bestRow = row;
        }
      }
      if (bestRow && maxCells > 5) {
        windDirRow = bestRow;
        console.log("[scraperC] [page.evaluate] Found wind direction row using fallback selector (cells=" + maxCells + ")");
      }
    }
  }
  
  if (!windDirRow) {
    console.error(
      "[scraperC] [page.evaluate] Could not find wind direction row"
    );
    // Return debug info instead of null
    return { error: "Could not find wind direction row", debug: { foundDays: dayMapping.length, foundTimeColumns: timeColumns.length, windDirectionsCount: 0, windSpeedsCount: 0 } };
  }

  function extractRotation(cell) {
    if (!cell) return null;
    // 1. Check cell itself
    const cellStyle = cell.getAttribute("style") || "";
    let match = cellStyle.match(/rotate\((\d+(?:\.\d+)?)deg\)/);
    if (match) return parseFloat(match[1]);
    
    // 2. Check all children for style attribute containing rotate
    const allChildren = cell.querySelectorAll("*");
    for (let i = 0; i < allChildren.length; i++) {
      const style = allChildren[i].getAttribute("style") || "";
      match = style.match(/rotate\((\d+(?:\.\d+)?)deg\)/);
      if (match) return parseFloat(match[1]);
    }
    return null;
  }

  const windDirCells = Array.from(windDirRow.querySelectorAll("td, th"));
  console.log("[scraperC] [page.evaluate] Found " + windDirCells.length + " wind direction cell(s) (td+th)");
  const windDirections = [];

  windDirCells.forEach(function (cell, index) {
    const degrees = extractRotation(cell);
    if (degrees !== null) {
      windDirections.push(degrees);
      if (index < 3) {
        console.log("[scraperC] [page.evaluate] Wind dir cell " + index + ": extracted " + degrees + " degrees");
      }
    } else {
      windDirections.push(null); // Use null instead of 0 for missing data
      if (index < 5) {
        console.log("[scraperC] [page.evaluate] Wind dir cell " + index + " has no rotation found");
      }
    }
  });
  
  console.log("[scraperC] [page.evaluate] Extracted " + windDirections.length + " wind direction(s)");

  // Find wind speed row - try multiple selectors
  // Data rows are in document, not in tbody (tbody only has header rows)
  // Search in document first, and verify it has multiple cells
  let windSpeedRow = document.querySelector("tr.windywidgetwindSpeed.id-wind-speed");
  if (windSpeedRow) {
    const cells = Array.from(windSpeedRow.querySelectorAll("td, th"));
    if (cells.length <= 1) {
      console.log("[scraperC] [page.evaluate] Found wind speed row but only has " + cells.length + " cell(s), searching for data row...");
      windSpeedRow = null;
    } else {
      console.log("[scraperC] [page.evaluate] Found wind speed row in document (cells=" + cells.length + ")");
    }
  }
  if (!windSpeedRow) {
    windSpeedRow = document.querySelector("tr.windywidgetwindSpeed");
    if (windSpeedRow) {
      const cells = Array.from(windSpeedRow.querySelectorAll("td, th"));
      if (cells.length <= 1) {
        windSpeedRow = null;
      }
    }
  }
  if (!windSpeedRow) {
    windSpeedRow = document.querySelector("tr.id-wind-speed");
    if (windSpeedRow) {
      const cells = Array.from(windSpeedRow.querySelectorAll("td, th"));
      if (cells.length <= 1) {
        windSpeedRow = null;
      }
    }
  }
  if (!windSpeedRow) {
    // Try finding by class containing "wind" and "speed" - search in document
    const allDocRows = document.querySelectorAll("tr");
    const rowsWithWindSpeed = Array.from(allDocRows).filter(function(row) {
      const className = (row.className || "").toLowerCase();
      return (className.indexOf("wind") !== -1 || className.indexOf("wspeed") !== -1) && 
             className.indexOf("speed") !== -1;
    });
    if (rowsWithWindSpeed.length > 0) {
      // Find the row with the most cells (the actual data row)
      let maxCells = 0;
      let bestRow = null;
      for (let i = 0; i < rowsWithWindSpeed.length; i++) {
        const row = rowsWithWindSpeed[i];
        const cells = Array.from(row.querySelectorAll("td, th"));
        if (cells.length > maxCells) {
          maxCells = cells.length;
          bestRow = row;
        }
      }
      if (bestRow && maxCells > 5) {
        windSpeedRow = bestRow;
        console.log("[scraperC] [page.evaluate] Found wind speed row using fallback selector (cells=" + maxCells + ")");
      }
    }
  }
  
  if (!windSpeedRow) {
    console.error(
      "[scraperC] [page.evaluate] Could not find wind speed row"
    );
    // Return debug info instead of null
    return { error: "Could not find wind speed row", debug: { foundDays: dayMapping.length, foundTimeColumns: timeColumns.length, windDirectionsCount: windDirections.length, windSpeedsCount: 0 } };
  }

  const windSpeedCells = Array.from(windSpeedRow.querySelectorAll("td, th"));
  console.log("[scraperC] [page.evaluate] Found " + windSpeedCells.length + " wind speed cell(s) (td+th)");
  const windSpeeds = [];

  windSpeedCells.forEach(function (cell, index) {
    // Try data-value first, then text content
    const dataValue = cell.getAttribute("data-value");
    if (dataValue) {
      windSpeeds.push(parseFloat(dataValue));
    } else {
      const text = (cell.textContent && cell.textContent.trim()) || "";
      const value = parseFloat(text);
      windSpeeds.push(isNaN(value) ? 0 : value);
      if (index < 5 && isNaN(value)) {
        console.log("[scraperC] [page.evaluate] Wind speed cell " + index + " has no value, text: '" + text + "'");
      }
    }
  });
  
  console.log("[scraperC] [page.evaluate] Extracted " + windSpeeds.length + " wind speed(s)");

  // Find wave/swell data - Initialize arrays based on the number of cells in data rows
  // We'll use the wind speed row as reference since it should have all data cells
  const maxCells = windSpeeds.length > 0 ? windSpeeds.length : (windDirections.length > 0 ? windDirections.length : 100);
  const swellHeights = [];
  const swellPeriods = [];
  const swellDirections = [];
  for (let i = 0; i < maxCells; i++) {
    swellHeights.push(0);
    swellPeriods.push(0);
    swellDirections.push(0);
  }

  // Try to find wave/swell direction row (contains rotation degrees in transform)
  // Data rows are in document, not in tbody (tbody only has header rows)
  // Search in document first, and verify it has multiple cells
  let waveDirRow = document.querySelector("tr.windywidgetwaves.id-waves-direction");
  if (waveDirRow) {
    const cells = Array.from(waveDirRow.querySelectorAll("td, th"));
    if (cells.length <= 1) {
      console.log("[scraperC] [page.evaluate] Found wave direction row but only has " + cells.length + " cell(s), searching for data row...");
      waveDirRow = null;
    } else {
      console.log("[scraperC] [page.evaluate] Found wave direction row in document (cells=" + cells.length + ")");
    }
  }
  if (!waveDirRow) {
    waveDirRow = document.querySelector("tr.windywidgetwaves");
    if (waveDirRow) {
      const cells = Array.from(waveDirRow.querySelectorAll("td, th"));
      if (cells.length <= 1) {
        waveDirRow = null;
      }
    }
  }
  if (!waveDirRow) {
    waveDirRow = document.querySelector("tr.id-waves-direction");
    if (waveDirRow) {
      const cells = Array.from(waveDirRow.querySelectorAll("td, th"));
      if (cells.length <= 1) {
        waveDirRow = null;
      }
    }
  }
  if (!waveDirRow) {
    // Try finding by class containing "wave" or "swell" and "direction" or "dir" - search in document
    const allDocRows = document.querySelectorAll("tr");
    const rowsWithWaveDir = Array.from(allDocRows).filter(function(row) {
      const className = (row.className || "").toLowerCase();
      return (className.indexOf("wave") !== -1 || className.indexOf("swell") !== -1) && 
             (className.indexOf("direction") !== -1 || className.indexOf("dir") !== -1);
    });
    if (rowsWithWaveDir.length > 0) {
      // Find the row with the most cells (the actual data row)
      let maxCells = 0;
      let bestRow = null;
      for (let i = 0; i < rowsWithWaveDir.length; i++) {
        const row = rowsWithWaveDir[i];
        const cells = Array.from(row.querySelectorAll("td, th"));
        if (cells.length > maxCells) {
          maxCells = cells.length;
          bestRow = row;
        }
      }
      if (bestRow && maxCells > 5) {
        waveDirRow = bestRow;
        console.log("[scraperC] [page.evaluate] Found wave direction row using fallback selector (cells=" + maxCells + ")");
      }
    }
  }
  
  if (waveDirRow) {
    console.log("[scraperC] [page.evaluate] Found wave/swell direction row");
    const waveDirCells = Array.from(waveDirRow.querySelectorAll("td, th"));
    console.log("[scraperC] [page.evaluate] Found " + waveDirCells.length + " wave direction cell(s) (td+th)");
    waveDirCells.forEach(function (cell, index) {
      const degrees = extractRotation(cell);
      if (degrees !== null) {
        swellDirections[index] = degrees;
      } else {
        swellDirections[index] = null;
      }
    });
    console.log("[scraperC] [page.evaluate] Extracted " + swellDirections.filter(function(d) { return d !== undefined && d !== null; }).length + " wave directions (including 0° for North)");
  } else {
    console.log("[scraperC] [page.evaluate] No wave direction row found");
  }

  // Try to find wave/swell height row if they exist
  // Note: The actual class is "windywidgetwavesheight" (lowercase h, plural "waves")
  // Data rows are in document, not in tbody (tbody only has header rows)
  // Search in document first, and verify it has multiple cells
  let waveHeightRow = document.querySelector("tr.windywidgetwavesheight.id-waves-height");
  if (waveHeightRow) {
    const cells = Array.from(waveHeightRow.querySelectorAll("td, th"));
    if (cells.length <= 1) {
      console.log("[scraperC] [page.evaluate] Found wave height row but only has " + cells.length + " cell(s), searching for data row...");
      waveHeightRow = null;
    } else {
      console.log("[scraperC] [page.evaluate] Found wave height row in document (cells=" + cells.length + ")");
    }
  }
  if (!waveHeightRow) {
    waveHeightRow = document.querySelector("tr.windywidgetwavesheight");
    if (waveHeightRow) {
      const cells = Array.from(waveHeightRow.querySelectorAll("td, th"));
      if (cells.length <= 1) {
        waveHeightRow = null;
      }
    }
  }
  if (!waveHeightRow) {
    waveHeightRow = document.querySelector("tr.id-waves-height");
    if (waveHeightRow) {
      const cells = Array.from(waveHeightRow.querySelectorAll("td, th"));
      if (cells.length <= 1) {
        waveHeightRow = null;
      }
    }
  }
  if (!waveHeightRow) {
    waveHeightRow = document.querySelector("tr.windywidgetwaveHeight");
    if (waveHeightRow) {
      const cells = Array.from(waveHeightRow.querySelectorAll("td, th"));
      if (cells.length <= 1) {
        waveHeightRow = null;
      }
    }
  }
  if (!waveHeightRow) {
    waveHeightRow = document.querySelector("tr.id-wave-height");
    if (waveHeightRow) {
      const cells = Array.from(waveHeightRow.querySelectorAll("td, th"));
      if (cells.length <= 1) {
        waveHeightRow = null;
      }
    }
  }
  if (!waveHeightRow) {
    // Try finding by class containing "wave" or "swell" and "height" - search in document
    const allDocRows = document.querySelectorAll("tr");
    const rowsWithWaveHeight = Array.from(allDocRows).filter(function(row) {
      const className = (row.className || "").toLowerCase();
      return (className.indexOf("wave") !== -1 || className.indexOf("swell") !== -1) && 
             className.indexOf("height") !== -1;
    });
    if (rowsWithWaveHeight.length > 0) {
      // Find the row with the most cells (the actual data row)
      let maxCells = 0;
      let bestRow = null;
      for (let i = 0; i < rowsWithWaveHeight.length; i++) {
        const row = rowsWithWaveHeight[i];
        const cells = Array.from(row.querySelectorAll("td, th"));
        if (cells.length > maxCells) {
          maxCells = cells.length;
          bestRow = row;
        }
      }
      if (bestRow && maxCells > 5) {
        waveHeightRow = bestRow;
        console.log("[scraperC] [page.evaluate] Found wave height row using fallback selector (cells=" + maxCells + ")");
      }
    }
  }
  
  if (waveHeightRow) {
    console.log("[scraperC] [page.evaluate] Found wave/swell height row");
    const waveCells = Array.from(waveHeightRow.querySelectorAll("td, th"));
    console.log("[scraperC] [page.evaluate] Found " + waveCells.length + " wave height cell(s) (td+th)");
    waveCells.forEach(function (cell, index) {
      const dataValue = cell.getAttribute("data-value");
      if (dataValue) {
        swellHeights[index] = parseFloat(dataValue);
      } else {
        // Fallback: try to parse from text content
        const text = (cell.textContent && cell.textContent.trim()) || "";
        const value = parseFloat(text);
        if (!isNaN(value)) {
          swellHeights[index] = value;
        }
      }
    });
    console.log("[scraperC] [page.evaluate] Extracted " + swellHeights.filter(function(h) { return h > 0; }).length + " non-zero wave heights");
  } else {
    console.log("[scraperC] [page.evaluate] No wave height row found");
  }

  // Try to find wave/swell period row
  // Data rows are in document, not in tbody (tbody only has header rows)
  // Search in document first, and verify it has multiple cells
  let wavePeriodRow = document.querySelector("tr.windywidgetwavesperiod.id-waves-period");
  if (wavePeriodRow) {
    const cells = Array.from(wavePeriodRow.querySelectorAll("td, th"));
    if (cells.length <= 1) {
      console.log("[scraperC] [page.evaluate] Found wave period row but only has " + cells.length + " cell(s), searching for data row...");
      wavePeriodRow = null;
    } else {
      console.log("[scraperC] [page.evaluate] Found wave period row in document (cells=" + cells.length + ")");
    }
  }
  if (!wavePeriodRow) {
    wavePeriodRow = document.querySelector("tr.windywidgetwavesperiod");
    if (wavePeriodRow) {
      const cells = Array.from(wavePeriodRow.querySelectorAll("td, th"));
      if (cells.length <= 1) {
        wavePeriodRow = null;
      }
    }
  }
  if (!wavePeriodRow) {
    wavePeriodRow = document.querySelector("tr.id-waves-period");
    if (wavePeriodRow) {
      const cells = Array.from(wavePeriodRow.querySelectorAll("td, th"));
      if (cells.length <= 1) {
        wavePeriodRow = null;
      }
    }
  }
  if (!wavePeriodRow) {
    // Try finding by class containing "wave" or "swell" and "period" - search in document
    const allDocRows = document.querySelectorAll("tr");
    const rowsWithWavePeriod = Array.from(allDocRows).filter(function(row) {
      const className = (row.className || "").toLowerCase();
      return (className.indexOf("wave") !== -1 || className.indexOf("swell") !== -1) && 
             className.indexOf("period") !== -1;
    });
    if (rowsWithWavePeriod.length > 0) {
      // Find the row with the most cells (the actual data row)
      let maxCells = 0;
      let bestRow = null;
      for (let i = 0; i < rowsWithWavePeriod.length; i++) {
        const row = rowsWithWavePeriod[i];
        const cells = Array.from(row.querySelectorAll("td, th"));
        if (cells.length > maxCells) {
          maxCells = cells.length;
          bestRow = row;
        }
      }
      if (bestRow && maxCells > 5) {
        wavePeriodRow = bestRow;
        console.log("[scraperC] [page.evaluate] Found wave period row using fallback selector (cells=" + maxCells + ")");
      }
    }
  }
  
  if (wavePeriodRow) {
    console.log("[scraperC] [page.evaluate] Found wave/swell period row");
    const wavePeriodCells = Array.from(wavePeriodRow.querySelectorAll("td, th"));
    console.log("[scraperC] [page.evaluate] Found " + wavePeriodCells.length + " wave period cell(s) (td+th)");
    wavePeriodCells.forEach(function (cell, index) {
      const dataValue = cell.getAttribute("data-value");
      if (dataValue) {
        swellPeriods[index] = parseFloat(dataValue);
      } else {
        // Fallback: try to parse from text content
        const text = (cell.textContent && cell.textContent.trim()) || "";
        const value = parseFloat(text);
        if (!isNaN(value)) {
          swellPeriods[index] = value;
        }
      }
    });
    console.log("[scraperC] [page.evaluate] Extracted " + swellPeriods.filter(function(p) { return p > 0; }).length + " non-zero wave periods");
  } else {
    console.log("[scraperC] [page.evaluate] No wave period row found");
  }

  // Get today's date
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // Parse day text to determine date offset
  function parseDayOffset(dayText) {
    const upper = dayText.toUpperCase();
    if (upper.indexOf("TODAY") !== -1) return 0;
    if (upper.indexOf("TOMORROW") !== -1) return 1;

    // Try to parse date from text like "FRI, NOV 21"
    const dateMatch = dayText.match(/(\w+),\s*(\w+)\s+(\d+)/);
    if (dateMatch) {
      const dayNum = parseInt(dateMatch[3], 10);
      const now = new Date();
      const currentDay = now.getUTCDate();
      const currentMonth = now.getUTCMonth();

      // Simple heuristic: if day number is less than current day, it's next month
      // Otherwise it's this month
      if (dayNum >= currentDay) {
        return Math.floor((dayNum - currentDay) / 1); // Approximate days ahead
      } else {
        return Math.floor((dayNum + 30 - currentDay) / 1); // Next month
      }
    }

    // Default: assume it's a future day, estimate based on position
    return -1; // Will be calculated from dayIndex
  }

  // Return all forecasts for all available time columns
  const result = [];

  timeColumns.forEach(function (timeCol) {
    if (timeCol.dayIndex >= 0) {
      const dayInfo = dayMapping[timeCol.dayIndex];
      let dayOffset = parseDayOffset(dayInfo.dayText);

      // If parsing failed, use dayIndex as offset
      if (dayOffset < 0) {
        dayOffset = timeCol.dayIndex;
      }

      const forecastDate = new Date(today);
      forecastDate.setUTCDate(forecastDate.getUTCDate() + dayOffset);
      
      // Use timeCol.index which is the actual column index in the table
      const colIndex = timeCol.index;
      const windSpeed = windSpeeds[colIndex] || 0;
      const windDirection = windDirections[colIndex] || 0;
      const swellHeight = swellHeights[colIndex] || 0;
      const swellPeriod = swellPeriods[colIndex] || 0;
      const swellDirection = swellDirections[colIndex] || 0;

      result.push({
        date: forecastDate.toISOString(), // Convert to ISO string for serialization
        hour: timeCol.hour,
        windSpeed: windSpeed,
        windDirection: windDirection,
        swellHeight: swellHeight,
        swellPeriod: swellPeriod,
        swellDirection: swellDirection,
      });
    }
  });

  console.log(
    "[scraperC] [page.evaluate] ✅ Extracted " +
      result.length +
      " hourly forecast(s)"
  );
  
  // Return debug info if no forecasts found
  if (result.length === 0) {
    const debugInfo = {
      foundDays: dayMapping.length,
      foundTimeColumns: timeColumns.length,
      windDirectionsCount: windDirections.length,
      windSpeedsCount: windSpeeds.length,
      sampleTimeColumns: timeColumns.slice(0, 10),
      sampleDayMapping: dayMapping.slice(0, 5)
    };
    console.log("[scraperC] [page.evaluate] ⚠️ Debug info:", JSON.stringify(debugInfo));
    return { error: "No forecasts found", debug: debugInfo };
  }
  
  return result;
}

