// Plain JavaScript evaluation code for Windguru scraper
// This file is loaded as a string to avoid TypeScript helper injection
function extractWindguruData() {
  console.log("[scraperB] [page.evaluate] Starting data extraction...");
  let table = document.querySelector(".tabulka");
  console.log("[scraperB] [page.evaluate] Looking for .tabulka:", !!table);
  if (!table) {
    table = document.querySelector("table[class*='tabulka']");
    console.log(
      "[scraperB] [page.evaluate] Looking for table[class*='tabulka']:",
      !!table
    );
  }
  if (!table) {
    const allTables = document.querySelectorAll("table");
    console.error(
      `[scraperB] [page.evaluate] Could not find Windguru table. Found ${allTables.length} table(s) on page`
    );
    const tablesArray = Array.from(allTables);
    for (let i = 0; i < tablesArray.length; i++) {
      const t = tablesArray[i];
      console.log(
        `[scraperB] [page.evaluate] Table ${i}: classes="${t.className}", id="${t.id}"`
      );
    }
    return null;
  }
  console.log("[scraperB] [page.evaluate] ✅ Table found");

  // Find the dates row to get timestamps and column indices
  let datesRow = table.querySelector("tr.tr_dates");
  console.log(
    "[scraperB] [page.evaluate] Looking for tr.tr_dates:",
    !!datesRow
  );
  if (!datesRow) {
    datesRow = table.querySelector("tr[class*='dates']");
    console.log(
      "[scraperB] [page.evaluate] Looking for tr[class*='dates']:",
      !!datesRow
    );
  }
  if (!datesRow) {
    const allRows = table.querySelectorAll("tr");
    console.error(
      `[scraperB] [page.evaluate] Could not find dates row. Found ${allRows.length} row(s) in table`
    );
    const rowsArray = Array.from(allRows);
    for (let i = 0; i < Math.min(5, rowsArray.length); i++) {
      const r = rowsArray[i];
      console.log(
        `[scraperB] [page.evaluate] Row ${i}: classes="${r.className}", id="${r.id}"`
      );
    }
    return null;
  }
  console.log("[scraperB] [page.evaluate] ✅ Dates row found");

  const dateCells = Array.from(datesRow.querySelectorAll("td.tcell"));
  console.log(
    `[scraperB] [page.evaluate] Found ${dateCells.length} date cells`
  );
  const timeColumns = [];

  dateCells.forEach(function (cell, index) {
    const dataX = cell.getAttribute("data-x");
    if (dataX) {
      try {
        const data = JSON.parse(dataX);
        const unixtime = data.unixtime;
        if (unixtime) {
          const date = new Date(unixtime * 1000);
          const hour = date.getUTCHours();
          timeColumns.push({ index, hour, unixtime, date });
          console.log(
            `[scraperB] [page.evaluate] Time column ${index}: hour=${hour}, unixtime=${unixtime}, date=${date.toISOString()}`
          );
        } else {
          console.log(
            `[scraperB] [page.evaluate] Cell ${index}: data-x found but no unixtime`,
            data
          );
        }
      } catch (e) {
        console.log(
          `[scraperB] [page.evaluate] Cell ${index}: Failed to parse data-x="${dataX}":`,
          e
        );
      }
    } else {
      console.log(
        `[scraperB] [page.evaluate] Cell ${index}: No data-x attribute`
      );
    }
  });

  console.log(
    `[scraperB] [page.evaluate] Extracted ${timeColumns.length} time columns`
  );

  // Find parameter rows
  const getParamRow = function (paramId) {
    let row = null;
    for (let i = 0; i < 5; i++) {
      row = table.querySelector(`tr#tabid_${i}_0_${paramId}`);
      if (row) break;
    }

    if (!row) {
      row = table.querySelector(`tr.param.${paramId}`);
    }
    if (!row) {
      row = table.querySelector(`tr[class*="${paramId}"]`);
    }
    if (!row) {
      const allRows = table.querySelectorAll("tr");
      const rowsArray = Array.from(allRows);
      for (let i = 0; i < rowsArray.length; i++) {
        const r = rowsArray[i];
        if (r.id && r.id.includes(paramId)) {
          row = r;
          break;
        }
      }
    }

    if (!row) {
      console.error(`Could not find row for parameter: ${paramId}`);
      return null;
    }

    const cells = Array.from(row.querySelectorAll("td.tcell"));
    return cells.map(function (cell, cellIndex) {
      // Get all possible value sources
      const text = (cell.textContent && cell.textContent.trim()) || "";
      const innerText = (cell.innerText && cell.innerText.trim()) || "";
      const dataValue = cell.getAttribute("data-value");
      const dataX = cell.getAttribute("data-x");
      const title = cell.getAttribute("title");

      // Log first few cells for debugging
      if (cellIndex < 3) {
        const html = (cell.innerHTML && cell.innerHTML.substring(0, 200)) || "";
        console.log(
          `[scraperB] [page.evaluate] Cell ${cellIndex} for ${paramId}:`,
          {
            text,
            innerText,
            dataValue,
            dataX,
            title,
            html: html.substring(0, 200),
          }
        );
      }

      // Priority 1: Use data-value if it exists and is not JSON metadata
      // For direction parameters, validate that it's a valid degree (0-360) or cardinal direction
      if (dataValue && !dataValue.startsWith("{")) {
        const isDirectionParam =
          paramId === "SMER" ||
          paramId === "DIRPW" ||
          paramId === "WINDDIR" ||
          paramId === "WAVEDIR" ||
          paramId === "WDIR" ||
          paramId === "WAVE_DIR" ||
          paramId === "DIR" ||
          paramId === "SWDIR";

        if (isDirectionParam) {
          // Check if it's a cardinal direction
          const cardinalMatch = dataValue.match(/^[NSEW]+$/);
          if (cardinalMatch) {
            return cardinalMatch[0];
          }
          // Check if it's a valid degree (0-360)
          const degreesMatch = dataValue.match(/^(\d+(?:\.\d+)?)$/);
          if (degreesMatch) {
            const degrees = parseFloat(degreesMatch[1]);
            // Only accept values that are valid degrees (0-360)
            if (!isNaN(degrees) && degrees >= 0 && degrees <= 360) {
              return degreesMatch[1];
            }
            // Invalid numeric value (timestamp, etc.) - skip it
            if (cellIndex < 3) {
              console.log(
                `[scraperB] [page.evaluate] ⚠️ data-value "${dataValue}" is not a valid direction (parsed as ${degrees}), skipping`
              );
            }
            // Fall through to try other extraction methods
          } else {
            // Not a cardinal or numeric, skip it
            if (cellIndex < 3) {
              console.log(
                `[scraperB] [page.evaluate] ⚠️ data-value "${dataValue}" is not a valid direction format, skipping`
              );
            }
            // Fall through to try other extraction methods
          }
        } else {
          // Not a direction parameter, return as-is
          return dataValue;
        }
      }

      // Priority 2: Check for direction data in images (alt text, title, or data attributes)
      const isDirectionParam =
        paramId === "SMER" ||
        paramId === "DIRPW" ||
        paramId === "WINDDIR" ||
        paramId === "WAVEDIR" ||
        paramId === "WDIR" ||
        paramId === "WAVE_DIR" ||
        paramId === "DIR" ||
        paramId === "SWDIR";
      if (isDirectionParam) {
        // Check for images with direction data
        const img = cell.querySelector("img");
        if (img) {
          const imgAlt =
            (img.getAttribute("alt") && img.getAttribute("alt").trim()) || "";
          const imgTitle =
            (img.getAttribute("title") && img.getAttribute("title").trim()) ||
            "";
          const imgSrc =
            (img.getAttribute("src") && img.getAttribute("src")) || "";
          const imgDataDir = img.getAttribute("data-dir");

          // Try to extract direction from image attributes
          if (imgAlt && imgAlt.length > 0) {
            // Check if it's a cardinal direction
            const cardinalMatch = imgAlt.match(/^[NSEW]+$/);
            if (cardinalMatch) {
              return cardinalMatch[0];
            }
            // Check if it's a valid degree (0-360)
            const degreesMatch = imgAlt.match(/^(\d+(?:\.\d+)?)$/);
            if (degreesMatch) {
              const degrees = parseFloat(degreesMatch[1]);
              // Only accept values that are valid degrees (0-360)
              if (!isNaN(degrees) && degrees >= 0 && degrees <= 360) {
                return degreesMatch[1];
              }
            }
          }
          if (imgTitle && imgTitle.length > 0) {
            // Check if it's a cardinal direction
            const cardinalMatch = imgTitle.match(/^[NSEW]+$/);
            if (cardinalMatch) {
              return cardinalMatch[0];
            }
            // Check if it's a valid degree (0-360)
            const degreesMatch = imgTitle.match(/^(\d+(?:\.\d+)?)$/);
            if (degreesMatch) {
              const degrees = parseFloat(degreesMatch[1]);
              // Only accept values that are valid degrees (0-360)
              if (!isNaN(degrees) && degrees >= 0 && degrees <= 360) {
                return degreesMatch[1];
              }
            }
          }
          if (imgDataDir) {
            return imgDataDir;
          }
          // Try to extract from src (sometimes direction is encoded in filename)
          if (imgSrc) {
            // Match cardinal directions (N, NE, NNE, etc.)
            const cardinalMatch = imgSrc.match(/([NSEW]+)/);
            if (cardinalMatch) {
              return cardinalMatch[1];
            }
            // Match degrees (0-360) - validate that numeric value is within valid range
            const dirMatch = imgSrc.match(/(\d+(?:\.\d+)?)/);
            if (dirMatch) {
              const degrees = parseFloat(dirMatch[1]);
              // Only accept values that are valid degrees (0-360)
              if (!isNaN(degrees) && degrees >= 0 && degrees <= 360) {
                return dirMatch[1];
              }
            }
          }
        }

        // Check for title attribute on cell (often contains direction info)
        if (title && title.length > 0) {
          // Match cardinal directions (N, NE, NNE, etc.)
          const cardinalMatch = title.match(/[NSEW]+/);
          if (cardinalMatch) {
            return cardinalMatch[0];
          }
          // Match degrees (0-360) - validate that numeric value is within valid range
          const dirExtract = title.match(/(\d+(?:\.\d+)?)/);
          if (dirExtract) {
            const degrees = parseFloat(dirExtract[1]);
            // Only accept values that are valid degrees (0-360)
            if (!isNaN(degrees) && degrees >= 0 && degrees <= 360) {
              return dirExtract[1];
            }
          }
        }
      }

      // Priority 3: Use text content (most reliable for Windguru)
      const content = innerText || text;
      if (content && content.length > 0) {
        // For directions (wind/wave direction), return as-is if it's a cardinal direction or degrees (0-360)
        if (isDirectionParam) {
          // Match cardinal directions (N, NE, NNE, etc.)
          const cardinalMatch = content.match(/^[NSEW]+$/);
          if (cardinalMatch) {
            return cardinalMatch[0];
          }
          // Match degrees (0-360) - validate that numeric value is within valid range
          const degreesMatch = content.match(/^(\d+(?:\.\d+)?)$/);
          if (degreesMatch) {
            const degrees = parseFloat(degreesMatch[1]);
            // Only accept values that are valid degrees (0-360)
            if (!isNaN(degrees) && degrees >= 0 && degrees <= 360) {
              return degreesMatch[1];
            }
          }
          // Try to extract from text like "N 10" or "270°"
          const dirExtract = content.match(/([NSEW]+|\d+(?:\.\d+)?)/);
          if (dirExtract) {
            const extracted = dirExtract[1];
            // If it's numeric, validate it's a valid degree (0-360)
            const numericValue = parseFloat(extracted);
            if (!isNaN(numericValue)) {
              if (numericValue >= 0 && numericValue <= 360) {
                return extracted;
              }
              // Invalid numeric value (like a timestamp), skip it
            } else {
              // Cardinal direction, return it
              return extracted;
            }
          }
        }
        // For numeric values, clean and return
        const numericMatch = content.match(/[\d.]+/);
        if (numericMatch) {
          return numericMatch[0];
        }
        // Return original if no numeric found (might be a special format)
        return content;
      }

      // Priority 4: Check for nested elements with values
      const valueElement = cell.querySelector(
        ".value, .data-value, [data-value], span, div"
      );
      if (valueElement) {
        const nestedText =
          (valueElement.textContent && valueElement.textContent.trim()) ||
          (valueElement.innerText && valueElement.innerText.trim()) ||
          "";
        const nestedDataValue = valueElement.getAttribute("data-value");
        const nestedTitle = valueElement.getAttribute("title");

        if (nestedText && nestedText.length > 0) {
          if (isDirectionParam) {
            // Match cardinal directions (N, NE, NNE, etc.)
            const cardinalMatch = nestedText.match(/^[NSEW]+$/);
            if (cardinalMatch) return cardinalMatch[0];
            // Match degrees (0-360) - validate that numeric value is within valid range
            const degreesMatch = nestedText.match(/^(\d+(?:\.\d+)?)$/);
            if (degreesMatch) {
              const degrees = parseFloat(degreesMatch[1]);
              // Only accept values that are valid degrees (0-360)
              if (!isNaN(degrees) && degrees >= 0 && degrees <= 360) {
                return degreesMatch[1];
              }
            }
            // Try to extract from text
            const dirExtract = nestedText.match(/([NSEW]+|\d+(?:\.\d+)?)/);
            if (dirExtract) {
              const extracted = dirExtract[1];
              // If it's numeric, validate it's a valid degree (0-360)
              const numericValue = parseFloat(extracted);
              if (!isNaN(numericValue)) {
                if (numericValue >= 0 && numericValue <= 360) {
                  return extracted;
                }
                // Invalid numeric value (like a timestamp), skip it
              } else {
                // Cardinal direction, return it
                return extracted;
              }
            }
          }
          const numericMatch = nestedText.match(/[\d.]+/);
          if (numericMatch) return numericMatch[0];
          return nestedText;
        }
        if (nestedDataValue && !nestedDataValue.startsWith("{")) {
          return nestedDataValue;
        }
        if (nestedTitle && isDirectionParam) {
          // Match cardinal directions (N, NE, NNE, etc.)
          const cardinalMatch = nestedTitle.match(/[NSEW]+/);
          if (cardinalMatch) return cardinalMatch[0];
          // Match degrees (0-360) - validate that numeric value is within valid range
          const dirExtract = nestedTitle.match(/(\d+(?:\.\d+)?)/);
          if (dirExtract) {
            const degrees = parseFloat(dirExtract[1]);
            // Only accept values that are valid degrees (0-360)
            if (!isNaN(degrees) && degrees >= 0 && degrees <= 360) {
              return dirExtract[1];
            }
          }
        }
      }

      // If all else fails, return empty string (will be parsed as 0)
      if (cellIndex < 3) {
        console.log(
          `[scraperB] [page.evaluate] ⚠️ Could not extract value from cell ${cellIndex} for ${paramId}. Returning empty string.`
        );
      }
      return "";
    });
  };

  console.log("[scraperB] [page.evaluate] Extracting parameter rows...");
  const windSpeedRow = getParamRow("WINDSPD");
  console.log(
    `[scraperB] [page.evaluate] WINDSPD row:`,
    windSpeedRow ? `found (${windSpeedRow.length} cells)` : "NOT FOUND"
  );
  if (windSpeedRow && windSpeedRow.length > 0) {
    console.log(
      `[scraperB] [page.evaluate] WINDSPD sample values (first 5):`,
      windSpeedRow.slice(0, 5)
    );
  }

  let windDirRow = getParamRow("SMER");
  console.log(
    `[scraperB] [page.evaluate] SMER row:`,
    windDirRow ? `found (${windDirRow.length} cells)` : "NOT FOUND"
  );
  if (windDirRow && windDirRow.length > 0) {
    console.log(
      `[scraperB] [page.evaluate] SMER sample values (first 5):`,
      windDirRow.slice(0, 5)
    );
  }

  // Try alternative parameter IDs for wind direction
  if (
    !windDirRow ||
    windDirRow.every(function (v) {
      return !v || v === "";
    })
  ) {
    console.log(
      "[scraperB] [page.evaluate] SMER row empty, trying alternative: WINDDIR"
    );
    const windDirRowAlt = getParamRow("WINDDIR");
    if (
      windDirRowAlt &&
      windDirRowAlt.length > 0 &&
      windDirRowAlt.some(function (v) {
        return v && v !== "";
      })
    ) {
      console.log("[scraperB] [page.evaluate] ✅ Found WINDDIR row with data");
      windDirRow = windDirRowAlt;
    } else {
      // Try other common parameter IDs
      const altIds = ["WDIR", "WIND_DIR", "DIR"];
      for (let i = 0; i < altIds.length; i++) {
        const altRow = getParamRow(altIds[i]);
        if (
          altRow &&
          altRow.length > 0 &&
          altRow.some(function (v) {
            return v && v !== "";
          })
        ) {
          console.log(
            `[scraperB] [page.evaluate] ✅ Found ${altIds[i]} row with data`
          );
          windDirRow = altRow;
          break;
        }
      }
    }
  }

  const waveHeightRow = getParamRow("HTSGW");
  console.log(
    `[scraperB] [page.evaluate] HTSGW row:`,
    waveHeightRow ? `found (${waveHeightRow.length} cells)` : "NOT FOUND"
  );
  if (waveHeightRow && waveHeightRow.length > 0) {
    console.log(
      `[scraperB] [page.evaluate] HTSGW sample values (first 5):`,
      waveHeightRow.slice(0, 5)
    );
  }

  const wavePeriodRow = getParamRow("PERPW");
  console.log(
    `[scraperB] [page.evaluate] PERPW row:`,
    wavePeriodRow ? `found (${wavePeriodRow.length} cells)` : "NOT FOUND"
  );
  if (wavePeriodRow && wavePeriodRow.length > 0) {
    console.log(
      `[scraperB] [page.evaluate] PERPW sample values (first 5):`,
      wavePeriodRow.slice(0, 5)
    );
  }

  let waveDirRow = getParamRow("DIRPW");
  console.log(
    `[scraperB] [page.evaluate] DIRPW row:`,
    waveDirRow ? `found (${waveDirRow.length} cells)` : "NOT FOUND"
  );
  if (waveDirRow && waveDirRow.length > 0) {
    console.log(
      `[scraperB] [page.evaluate] DIRPW sample values (first 5):`,
      waveDirRow.slice(0, 5)
    );
  }

  // Try alternative parameter IDs for wave direction
  if (
    !waveDirRow ||
    waveDirRow.every(function (v) {
      return !v || v === "";
    })
  ) {
    console.log(
      "[scraperB] [page.evaluate] DIRPW row empty, trying alternative: WAVEDIR"
    );
    const waveDirRowAlt = getParamRow("WAVEDIR");
    if (
      waveDirRowAlt &&
      waveDirRowAlt.length > 0 &&
      waveDirRowAlt.some(function (v) {
        return v && v !== "";
      })
    ) {
      console.log("[scraperB] [page.evaluate] ✅ Found WAVEDIR row with data");
      waveDirRow = waveDirRowAlt;
    } else {
      // Try other common parameter IDs
      const altIds = ["WDIR", "WAVE_DIR", "SWDIR"];
      for (let i = 0; i < altIds.length; i++) {
        const altRow = getParamRow(altIds[i]);
        if (
          altRow &&
          altRow.length > 0 &&
          altRow.some(function (v) {
            return v && v !== "";
          })
        ) {
          console.log(
            `[scraperB] [page.evaluate] ✅ Found ${altIds[i]} row with data`
          );
          waveDirRow = altRow;
          break;
        }
      }
    }
  }

  if (
    !windSpeedRow ||
    !windDirRow ||
    !waveHeightRow ||
    !wavePeriodRow ||
    !waveDirRow
  ) {
    console.error(
      "[scraperB] [page.evaluate] ❌ Missing required parameter rows"
    );
    return null;
  }

  console.log("[scraperB] [page.evaluate] ✅ All parameter rows found");

  // Group time columns by date and find morning hours for each date
  const forecastsByDate = {};

  console.log(
    `[scraperB] [page.evaluate] Processing ${timeColumns.length} time columns for morning hours (5-11)...`
  );
  for (let i = 0; i < timeColumns.length; i++) {
    const timeCol = timeColumns[i];
    if (timeCol.hour >= 5 && timeCol.hour <= 11) {
      const dateKey = timeCol.date.toISOString().split("T")[0];

      if (!forecastsByDate[dateKey]) {
        const colIndex = timeCol.index;
        const windSpeed = windSpeedRow[colIndex] || "";
        const windDir = windDirRow[colIndex] || "";
        const waveHeight = waveHeightRow[colIndex] || "";
        const wavePeriod = wavePeriodRow[colIndex] || "";
        const waveDir = waveDirRow[colIndex] || "";

        console.log(
          `[scraperB] [page.evaluate] Column ${colIndex} (${dateKey} ${timeCol.hour}:00):`,
          {
            windSpeed,
            windDir,
            waveHeight,
            wavePeriod,
            waveDir,
          }
        );

        forecastsByDate[dateKey] = {
          date: timeCol.date,
          hour: timeCol.hour,
          unixtime: timeCol.unixtime,
          windSpeed,
          windDir,
          waveHeight,
          wavePeriod,
          waveDir,
        };
      }
    } else {
      console.log(
        `[scraperB] [page.evaluate] Skipping column ${timeCol.index} (hour ${timeCol.hour} not in 5-11 range)`
      );
    }
  }

  const result = Object.values(forecastsByDate);
  console.log(
    `[scraperB] [page.evaluate] ✅ Extracted ${result.length} forecast(s) for morning hours`
  );
  return result;
}
