import { chromium } from "playwright";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import ffmpegInstaller from "@ffmpeg-installer/ffmpeg";

// Load environment variables from absolute path
const envPath = path.resolve(process.cwd(), ".env");
dotenv.config({ path: envPath });

const ffmpegPath = ffmpegInstaller.path;

async function startStream() {
  const STREAM_URL = process.env.STREAM_SOURCE_URL || "http://localhost:3000/stream";
  const YOUTUBE_STREAM_KEY = process.env.YOUTUBE_STREAM_KEY;
  
  if (!YOUTUBE_STREAM_KEY || YOUTUBE_STREAM_KEY.includes("xxxx")) {
    console.error("❌ ERROR: YOUTUBE_STREAM_KEY is missing or invalid in .env");
    process.exit(1);
  }

  // Masked key verification
  console.log(`🔑 Using Stream Key starting with: ${YOUTUBE_STREAM_KEY.substring(0, 4)}****`);

  const RTMP_URL = `rtmp://a.rtmp.youtube.com/live2/${YOUTUBE_STREAM_KEY}`;

  console.log("🚀 Launching Tide Raider VIRTUAL Capture Engine...");
  console.log(`📡 Using FFmpeg from: ${ffmpegPath}`);

  const browser = await chromium.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--force-device-scale-factor=1",
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 } 
  });

  const page = await context.newPage();
  
  console.log(`🌐 Navigating to Dashboard: ${STREAM_URL}`);
  
  try {
     await page.goto(STREAM_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
     console.log("✅ Virtual Dashboard Loaded.");
  } catch (e) {
     console.log("⚠️ Virtual load timed out, attempting stream anyway...");
  }
  
  await new Promise(r => setTimeout(r, 8000)); // Give dash time to fully settle

  console.log("🎬 Visuals ready. Initializing Stable-Sentinel 720p Pipeline...");

  const ffmpegParams = [
    "-thread_queue_size", "1024",
    "-f", "image2pipe",
    "-vcodec", "mjpeg",
    "-framerate", "15", // Stabilize at 15fps (solid for dashboards)
    "-i", "-", 
    "-f", "lavfi",
    "-i", "anullsrc=channel_layout=stereo:sample_rate=44100", 
    "-c:v", "libx264",
    "-preset", "ultrafast",
    "-tune", "zerolatency", 
    "-pix_fmt", "yuv420p",
    "-b:v", "2000k", 
    "-g", "30",
    "-c:a", "aac",
    "-b:a", "128k",
    "-f", "flv",
    RTMP_URL
  ];

  console.log("🔥 INITIATING STABLE-SENTINEL HANDSHAKE...");
  const ffmpegProcess = spawn(ffmpegPath, ffmpegParams);

  // STABLE FRAME PUMP: Recursive loop for maximum reliability
  const pipeFrames = async () => {
    try {
      if (ffmpegProcess.stdin.writable) {
        const start = Date.now();
        const screenshot = await page.screenshot({ 
           type: "jpeg", 
           quality: 40, // Lean for high-speed pipe
           clip: { x: 0, y: 0, width: 1280, height: 720 } 
        });
        ffmpegProcess.stdin.write(screenshot);
        
        // Calculate dynamic delay to hit ~15fps
        const elapsed = Date.now() - start;
        const delay = Math.max(1, 66 - elapsed); 
        setTimeout(pipeFrames, delay);
      }
    } catch (e) {
      // Silence intermittent write errors
    }
  };

  pipeFrames();

  ffmpegProcess.stderr.on("data", (data) => {
    const output = data.toString();
    if (output.includes("frame=")) {
       process.stdout.write(`\r📡 [VIRTUAL STREAM LIVE] ${output.split("fps=")[0].trim()}`);
    } else {
       // Log all other FFmpeg output for debugging
       console.log(`\n[FFmpeg Debug] ${output.trim()}`);
    }
  });

  ffmpegProcess.on("close", (code) => {
    console.log(`\n🛑 Virtual pipeline closed (Code ${code})`);
    browser.close();
    process.exit(code || 0);
  });
}

startStream().catch(console.error);
