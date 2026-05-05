
import { chromium, Browser } from "playwright";
import { join } from "path";
import { readdirSync, existsSync } from "fs";

/**
 * Robustly finds the chromium executable path in a Playwright browsers directory.
 */
function findExecutablePath(): string | undefined {
  const browsersPath = process.env.PLAYWRIGHT_BROWSERS_PATH;
  if (!browsersPath || !existsSync(browsersPath)) {
    return undefined;
  }

  try {
    // Look for a directory starting with "chromium-"
    const dirs = readdirSync(browsersPath);
    const chromiumDir = dirs.find(d => d.startsWith("chromium-"));
    
    if (chromiumDir) {
      // Common path structure: chromium-XXXX/chrome-linux/chrome
      const linuxPath = join(browsersPath, chromiumDir, "chrome-linux", "chrome");
      if (existsSync(linuxPath)) return linuxPath;
      
      // Windows structure: chromium-XXXX/chrome-win/chrome.exe
      const winPath = join(browsersPath, chromiumDir, "chrome-win", "chrome.exe");
      if (existsSync(winPath)) return winPath;
    }
  } catch (err) {
    console.error("[BrowserUtils] Error finding executable path:", err);
  }

  return undefined;
}

export async function getBrowser(): Promise<Browser> {
  const executablePath = findExecutablePath();
  
  if (executablePath) {
    console.log(`[getBrowser] Launching with explicit path: ${executablePath}`);
  } else {
    console.log(`[getBrowser] Launching with default Playwright discovery`);
  }

  return await chromium.launch({
    headless: true,
    executablePath,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu"
    ],
  });
}
