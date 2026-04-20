import puppeteer from 'puppeteer-core';
import { readFileSync } from 'fs';
import { join } from 'path';

async function debugWindguru() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  });
  const page = await browser.newPage();
  const url = 'https://www.windguru.cz/95115'; // Muizenberg
  
  console.log(`Navigating to ${url}...`);
  await page.goto(url, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 3000));
  
  const evalCode = readFileSync(join(__dirname, '../src/lib/scrapers/windguru-eval.js'), 'utf-8');
  
  const hours = await page.evaluate(`
    ${evalCode}
    // Override the extraction for debugging
    function debugExtract() {
      const table = document.querySelector(".tabulka");
      if (!table) return "Table not found";
      const datesRow = table.querySelector("tr.tr_dates");
      if (!datesRow) return "Dates row not found";
      const dateCells = Array.from(datesRow.querySelectorAll("td.tcell"));
      return dateCells.map(cell => {
        const dataX = cell.getAttribute("data-x");
        if (!dataX) return "no-data-x";
        const data = JSON.parse(dataX);
        const date = new Date(data.unixtime * 1000);
        return date.getUTCHours();
      });
    }
    debugExtract();
  `);
  
  console.log('Extracted UTC hours:', hours);
  await browser.close();
}

debugWindguru().catch(console.error);
