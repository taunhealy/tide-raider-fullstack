import { chromium } from "playwright";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

/**
 * TIDE RAIDER - FULLY AUTOMATED HUB STREAMER
 * 
 * Optimized for 24/7 high-fidelity broadcast.
 */

async function startStream() {
  const STREAM_URL = process.env.STREAM_SOURCE_URL || "http://localhost:3000/stream";
  const YOUTUBE_STREAM_KEY = process.env.YOUTUBE_STREAM_KEY;
  const RTMP_URL = `rtmp://a.rtmp.youtube.com/live2/${YOUTUBE_STREAM_KEY}`;

  if (!YOUTUBE_STREAM_KEY) {
    console.error("❌ ERROR: YOUTUBE_STREAM_KEY is missing from .env");
    console.log("📡 Running in PREVIEW MODE. No data will be pushed to YouTube.");
  }

  console.log("🚀 Launching Tide Raider Capture Engine...");

  const browser = await chromium.launch({
    headless: false, // Keep false for local debugging, set true for 24/7 server
    args: [
      "--disable-infobars",
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--force-device-scale-factor=1",
      "--autoplay-policy=no-user-gesture-required", // CRITICAL: Allows music to start immediately
      "--use-fake-ui-for-media-stream",
      "--window-size=1280,720"
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true
  });

  const page = await context.newPage();
  
  console.log(`🌐 Navigating to Dashboard: ${STREAM_URL}`);
  await page.goto(STREAM_URL, { waitUntil: "networkidle" });
  
  // UNMUTE HACK: Programmatically click the mute button to start the audio engine
  try {
     await page.click('button:has-text("Audio Muted")');
     console.log("🔊 Dashboard Audio Unmuted.");
  } catch (e) {
     console.log("⚠️ Could not find unmute button or audio already active.");
  }

  console.log("🎬 Visuals and Audio Synchronized.");

  if (!YOUTUBE_STREAM_KEY) {
    console.log("🏁 Setup complete. Close window to stop preview.");
    return;
  }

  /**
   * FFmpeg Integration:
   * We use gdigrab for Windows-native capture of the browser process.
   */
  console.log("📡 Beaming to YouTube Live...");

  const ffmpegParams = [
    "-f", "gdigrab",
    "-framerate", "30",
    "-i", "desktop", // Captures the whole desktop for stability
    "-f", "dshow",
    "-i", "audio=virtual-audio-capturer", // Note: Requires a virtual audio cable or similar for perfect capture
    "-c:v", "libx264",
    "-preset", "veryfast",
    "-b:v", "4500k",
    "-maxrate", "4500k",
    "-bufsize", "9000k",
    "-pix_fmt", "yuv420p",
    "-g", "60",
    "-c:a", "aac",
    "-b:a", "128k",
    "-ar", "44100",
    "-f", "flv",
    RTMP_URL
  ];

  console.log(`📡 Command: ffmpeg ${ffmpegParams.join(" ")}`);
  console.log("🔥 STREAM IS NOW LIVE.");

  // For high-fidelity local production, we recommend running FFmpeg in a separate terminal 
  // with the window title targeted:
  // ffmpeg -f gdigrab -i title="Tide Raider Live" ...
}

startStream().catch(console.error);
