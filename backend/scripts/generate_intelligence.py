import os
import json
import asyncio
import sys
import argparse
from typing import List, Optional
from dotenv import load_dotenv
import io

# Force UTF-8 encoding
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# LangChain / Gemini imports
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate

load_dotenv()

async def generate_report(beach_name: str, wind_speed: float, wind_dir: str, swell_height: float, swell_period: float, swell_dir: str, score: float, persona: str, daily_snapshots: Optional[str] = None, mode: str = "daily"):
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        print("Error: GOOGLE_API_KEY not found", file=sys.stderr)
        return None

    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=api_key,
        temperature=0.7
    )
    
    if mode == "weekly":
        system_prompt = (
            "You are a Strategic Surf Intelligence AI for the Western Cape, South Africa. "
            "Your goal is to provide a high-level weekly sector analysis for the Muizenberg/False Bay region. "
            
            "Strategic Context:\n"
            "- Focus on identifying the 2-3 best 'Strike Windows' for the upcoming week based on the forecast trends.\n"
            "- Mention any significant swell events (groundswells vs windswells).\n"
            "- High-level advice on which part of the week looks most promising.\n\n"
            
            "Instructions:\n"
            "1. Synthesize the provided 7-day forecast data.\n"
            "2. Identify the peak performance windows (the 'Golden Windows').\n"
            "3. Tone: {persona}. \n"
            "   - If PIRATE: Speak like an old-school maritime captain (e.g., 'Avast', 'Chart the course').\n"
            "   - If MC: Use rhythmic, lyrical flow and modern street terminology.\n"
            "   - If BRO: Use laid-back chill surf slang (e.g., 'Stoked', 'Charging').\n"
            "   - If STRATEGIST: Practical, high-level tactical reporting.\n"
            "4. Format: 2-3 concise paragraphs. Use professional maritime terminology. No markdown."
        )
        user_prompt = (
            f"Generate a {persona} Weekly Strategic Outlook for {beach_name}.\n"
            f"Upcoming 7-Day Forecast Context:\n{daily_snapshots or 'Data pending'}"
        )
    else:
        system_prompt = (
            "You are a specialized Surf Intelligence AI for Muizenberg, Cape Town. "
            "Your goal is to provide a unified daily situational report that synthesizes the day's progression. "
            
            "Muizenberg Specific Context:\n"
            "- Topology: Open sand-bottom beach break. 'The Corner' provides shelter from NW winds.\n"
            "- Tides: Generally works best on an incoming mid-to-high tide. Low tide can be sectional.\n"
            "- Boards: Prime for high-volume longboards (Logs). Mid-beach works better for shortboards on larger swells.\n\n"
 
            "Instructions:\n"
            "1. Analyze the 'Daily Snapshots' to identify the 'Golden Window' (the best time to surf today).\n"
            "2. Give concrete advice: Tell them which tide window to hit and which board to pack (Log vs Shortboard).\n"
            "3. Tone: {persona}.\n"
            "   - If PIRATE: Heavy maritime grit, nautical terms.\n"
            "   - If MC: Poetic flow, lyrical descriptions of the waves.\n"
            "   - If BRO: Absolute surf stoke, high energy slang.\n"
            "4. Format: 3-4 highly technical but engaging sentences. No markdown. No hashtags."
        )
        user_prompt = (
            f"Generate a {persona} Daily Outlook for {beach_name}.\n"
            f"Current Primary conditions: {swell_height}m @ {swell_period}s, wind {wind_speed}kts {wind_dir}. Score: {score}/10.\n"
            f"Full Day Snapshots (Morning/Noon/Evening):\n{daily_snapshots or 'Stable'}"
        )
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("user", user_prompt)
    ])
    
    chain = prompt | llm
    
    try:
        # Pass the persona and any other dynamic variables to the template
        response = await chain.ainvoke({
            "persona": persona
        })
        # Ensure we get a string back (some models return a list of content blocks)
        content = response.content
        if isinstance(content, list):
            report_text = " ".join([block.get("text", "") for block in content if isinstance(block, dict) and "text" in block])
        else:
            report_text = str(content)
            
        return {"report": report_text}
    except Exception as e:
        print(f"❌ Generation failed: {e}", file=sys.stderr)
        return None

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--beach", required=True)
    parser.add_argument("--wind_speed", type=float, required=True)
    parser.add_argument("--wind_dir", required=True)
    parser.add_argument("--swell_height", type=float, required=True)
    parser.add_argument("--swell_period", type=float, required=True)
    parser.add_argument("--swell_dir", required=True)
    parser.add_argument("--score", type=float, required=True)
    parser.add_argument("--persona", required=True)
    parser.add_argument("--trend", required=False)
    parser.add_argument("--mode", default="daily")
    args = parser.parse_args()

    result = asyncio.run(generate_report(args.beach, args.wind_speed, args.wind_dir, args.swell_height, args.swell_period, args.swell_dir, args.score, args.persona, args.trend, args.mode))
    if result:
        print(json.dumps(result, ensure_ascii=False))
        sys.stdout.flush()
    else:
        sys.exit(1)
