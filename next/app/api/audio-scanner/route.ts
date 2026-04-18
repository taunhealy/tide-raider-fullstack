import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const audioDirectory = path.join(process.cwd(), "public", "audio");
    
    // Ensure directory exists
    if (!fs.existsSync(audioDirectory)) {
      return NextResponse.json({ tracks: [] });
    }

    const files = fs.readdirSync(audioDirectory);
    
    // Filter for audio files only
    const audioFiles = files.filter(file => 
      file.toLowerCase().endsWith(".mp3") || 
      file.toLowerCase().endsWith(".wav") || 
      file.toLowerCase().endsWith(".m4a") ||
      file.toLowerCase().endsWith(".webm") ||
      file.toLowerCase().endsWith(".ogg")
    );

    return NextResponse.json({ tracks: audioFiles });
  } catch (error) {
    console.error("Audio scanner error:", error);
    return NextResponse.json({ tracks: [] }, { status: 500 });
  }
}
