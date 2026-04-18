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

async def generate_report(beach_name: str, wind_speed: float, wind_dir: str, swell_height: float, swell_period: float, swell_dir: str, score: float, persona: str, trend: Optional[str] = None):
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        print("Error: GOOGLE_API_KEY not found", file=sys.stderr)
        return None

    llm = ChatGoogleGenerativeAI(
        model="models/gemini-3.1-flash-lite-preview",
        google_api_key=api_key,
        temperature=0.8
    )
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", (
            "You are an expert surf intelligence analyst. Your goal is to provide a situational report for a specific beach. "
            "The tone MUST be educational and professionally analytical, but with a distinct, engaging personality flair. "
            "Substantiate every claim with the specific facts provided (e.g., wind speed, swell direction interaction). "
            "Persona Styles:\n"
            "- PIRATE (Cap'n Flint): A seasoned maritime navigator. Use salty, authoritative phrasing; reference the 'maritime archive', 'currents', or 'ocean lore' while maintaining naval precision.\n"
            "- MC (The Lyricist): A rhythmic technical observer. Use sharper, metered beats and rhythmic terminology (e.g., 'pulse', 'frequency', 'system flow') to break down the technical structure of the waves.\n"
            "- BRO (Kai): An enthusiastic surfer-scientist. Use 'bro/dude' naturally while geeking out on 'energy displacement', 'fluid dynamics', and the 'pure physics' of the lineup.\n\n"
            "Explain exactly WHY the conditions are good or bad based on the interaction between wind and swell. "
            "IMPORTANT: Use the EXACT numerical score provided (e.g., if provided 1/10, say '1/10' or '1.0 rating'). "
            "Keep it to 2-3 sentences. No placeholders. No markdown. Just the plain text report."
        )),
        ("user", (
            f"Generate a {persona} report for {beach_name}.\n"
            f"Current Conditions:\n"
            f"- Wind: {wind_speed}kts from {wind_dir}\n"
            f"- Swell: {swell_height}m @ {swell_period}s from {swell_dir}\n"
            f"- Overall Rating: {score}/10\n"
            f"- Daily Trend: {trend or 'Stable conditions expected through the day.'}"
        ))
    ])
    
    chain = prompt | llm
    
    try:
        response = await chain.ainvoke({})
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
    args = parser.parse_args()

    result = asyncio.run(generate_report(args.beach, args.wind_speed, args.wind_dir, args.swell_height, args.swell_period, args.swell_dir, args.score, args.persona, args.trend))
    if result:
        print(json.dumps(result, ensure_ascii=False))
        sys.stdout.flush()
    else:
        sys.exit(1)
