import { GoogleGenerativeAI } from "@google/generative-ai";

async function testGemini() {
  const apiKey = "AIzaSyD6QXGcLlLFVSPxnOPnuA8mVG4W_KRTwH0";
  console.log("Testing with Gemini API Key from gcloud (Gemini 2.5)...");
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    console.log("Invoking gemini-2.5-flash...");
    const result = await model.generateContent("Hello");
    console.log("Response:", result.response.text());
    console.log("✅ Success!");
  } catch (error: any) {
    console.error("❌ Failed:", error.message);
  }
}

testGemini();
