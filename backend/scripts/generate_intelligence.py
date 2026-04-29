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
    # Debug: Print CWD and check for .env
    cwd = os.getcwd()
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        # 1. Try .env in current directory
        load_dotenv(os.path.join(cwd, ".env"))
        api_key = os.getenv("GOOGLE_API_KEY")
    
    if not api_key:
        # 2. Try .env in parent directory
        parent_env = os.path.join(os.path.dirname(cwd), ".env")
        if os.path.exists(parent_env):
            load_dotenv(parent_env)
            api_key = os.getenv("GOOGLE_API_KEY")

    if not api_key:
        # 3. Try specifically checking 'backend/.env' if we're in a common monorepo structure
        # or checking root if we are in scripts/
        if os.path.basename(cwd) == "scripts":
            load_dotenv(os.path.join(os.path.dirname(cwd), ".env"))
            api_key = os.getenv("GOOGLE_API_KEY")

    if not api_key:
        print(f"Error: GOOGLE_API_KEY not found. Search path: {cwd}. Please ensure it is set in .env", file=sys.stderr)
        return None
    
    print(f"Intelligence Engine: Authenticated (Key Length: {len(api_key)})", file=sys.stderr)

    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=api_key,
        temperature=0.7
    )
    
    if mode in ["weekly", "tactical"]:
        duration_label = "7-Day" if mode == "weekly" else "3-Day"
        system_prompt = (
            "You are a Precision Surf Intelligence AI assigned to a specific maritime asset in the Western Cape. "
            "MISSION CRITICAL: You must only report on the beach break specified in the USER PROMPT. Do not include data for neighboring beaches in the same sector. "
            
            "Tactical Reporting Rules:\n"
            "1. IDENTIFIER: Every report must start with the exact phrase: 'TACTICAL BRIEFING: [BEACH NAME]'.\n"
            "2. ASSET ISOLATION: Focus strictly on the unique topology and requirements of this specific spot. If the Spot DNA says it needs a Mid-Tide, do not suggest Low-Tide even if nearby spots use it.\n"
            "3. VERIFIED RATINGS: You must assign Star Ratings (⭐⭐⭐⭐⭐/5) to the 2-3 best 'Strike Windows'. These MUST correlate with 'ALGO_SCORE': (8-10: ⭐⭐⭐⭐⭐, 6-8: ⭐⭐⭐⭐, 4-6: ⭐⭐⭐, 2-4: ⭐⭐, 0-2: ⭐). Do not invent stars; use the algorithm score provided.\n"
            "4. TEMPORAL INTEGRITY: You must ONLY report on dates and windows provided in the 'Provided Forecast Data'. Do not mention any dates or operational windows that are not present in the context. Do not use external knowledge of the spot's forecast.\n"
            "5. TONE: {persona}. (Pirate = Grit, MC = Flow, Bro = Stoke, Strategist = Tactical).\n\n"
            
            "Format: 3-4 specialized maritime paragraphs. No markdown. No bolding. No hashtags. Absolute precision required."
        )
        user_prompt = (
            f"Generate a {persona} {duration_label} Strategic Outlook EXCLUSIVELY for the following asset:\n"
            f"TARGET ASSET: {beach_name}\n"
            f"Provided Forecast Data:\n{daily_snapshots or 'Data pending'}"
        )
    else:
        system_prompt = (
            "You are a specialized Daily Reconnaissance AI. your goal is a single-spot situational report. "
            "MISSION CRITICAL: Report ONLY on the TARGET ASSET. Do not mention neighboring breaks or general regional trends.\n\n"
            
            "Intelligence Protocols:\n"
            "1. THE GOLDEN WINDOW: Define the best window for THIS SPOT with a Star Rating.\n"
            "2. SPOT DNA SYNC: Explictly cite how the current swell/wind aligns with THIS SPOT's optimal directions.\n"
            "3. TIDE & GEAR: Provide advice for THIS SPOT's specific topography.\n"
            "4. TONE: {persona}.\n\n"

            "Format: 3-4 high-technical sentences. Lead with: 'DAILY RECON: [BEACH NAME]'. No markdown."
        )
        user_prompt = (
            f"Generate a {persona} Daily Outlook EXCLUSIVELY for:\n"
            f"TARGET ASSET: {beach_name}\n"
            f"Swell: {swell_height}m @ {swell_period}s {swell_dir}.\n"
            f"Wind: {wind_speed}kts {wind_dir}.\n"
            f"Snapshots:\n{daily_snapshots or 'Stable'}"
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
    
    if not result:
        print("❌ Intelligence generation returned None", file=sys.stderr)
        sys.exit(1)
        
    print(json.dumps(result, ensure_ascii=False))
    sys.stdout.flush()
