import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join(__dirname, "../.env") });

async function testGemini() {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  console.log("Using API Key:", apiKey ? `${apiKey.substring(0, 5)}...${apiKey.substring(apiKey.length - 5)}` : "MISSING");
  
  if (!apiKey) {
    console.error("No API key found");
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    console.log("Testing gemini-2.0-flash...");
    const result = await model.generateContent("Hello, are you operational?");
    console.log("Response:", result.response.text());
    console.log("✅ gemini-2.0-flash is operational");
  } catch (error: any) {
    console.error("❌ gemini-2.0-flash failed:", error.message);
    
    try {
      console.log("Attempting fallback to gemini-1.5-flash...");
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent("Hello, are you operational?");
      console.log("Response:", result.response.text());
      console.log("✅ gemini-1.5-flash is operational");
    } catch (fallbackError: any) {
      console.error("❌ gemini-1.5-flash also failed:", fallbackError.message);
    }
  }
}

testGemini();
