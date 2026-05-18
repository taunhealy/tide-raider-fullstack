
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
  // Disable DBus to avoid connection timeouts and overhead in serverless Docker containers
  process.env.DBUS_SESSION_BUS_ADDRESS = "disabled:";

  const executablePath = findExecutablePath();
  
  if (executablePath) {
    console.log(`[getBrowser] Launching with explicit path: ${executablePath}`);
  } else {
    console.log(`[getBrowser] Launching with default Playwright discovery`);
  }

  const maxRetries = 2;
  let lastError;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      if (i > 0) {
        console.log(`[getBrowser] 🔄 Retry ${i}/${maxRetries}...`);
        // Wait a bit before retry to let resources clear
        await new Promise(r => setTimeout(r, 5000 * i));
      }

      console.log(`[getBrowser] Launching Chromium (timeout: 180s)...`);
      return await chromium.launch({
        headless: true,
        executablePath,
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu", // Prevent hardware acceleration crashes
          "--disable-software-rasterizer", // Reduce CPU/memory overhead
          "--disable-features=IsolateOrigins,site-per-process", // Prevent spawning excess processes
          "--disable-ipc-flooding-protection", // Prevent IPC throttling under CPU load
          "--disable-background-networking", // Turn off background networking
          "--disable-background-timer-throttling", // Keep JS execution steady
          "--disable-backgrounding-occluded-windows",
          "--disable-renderer-backgrounding",
          "--hide-scrollbars",
          "--mute-audio",
          "--disable-breakpad",
          "--no-first-run",
          "--no-zygote",
          "--disable-extensions",
          "--disable-notifications",
          "--disable-default-apps",
          "--font-render-hinting=none",
          "--disable-blink-features=AutomationControlled"
        ],
        timeout: 180000,
      });
    } catch (err: any) {
      lastError = err;
      console.error(`[getBrowser] ⚠️ Attempt ${i + 1} failed:`, err.message);
      
      // If it's a timeout, it might be worth retrying. 
      // If it's a "executable not found", retrying won't help.
      if (err.message && (err.message.includes("executable") || err.message.includes("not found"))) {
        break;
      }
    }
  }

  console.error(`[getBrowser] ❌ FAILED to launch browser after ${maxRetries + 1} attempts`);
  throw lastError;
}
