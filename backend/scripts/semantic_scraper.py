import os
import json
import asyncio
import sys
import argparse
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, Field
from dotenv import load_dotenv
import io

# Force UTF-8 encoding for stdout and stderr
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Redirect HOME to /tmp before crawl4ai import.
# crawl4ai writes its SQLite DB to $HOME/.crawl4ai on startup.
# In Cloud Run the container's appuser has no writable home dir,
# so we must point it to /tmp (always writable) before the import.
os.environ.setdefault("HOME", "/tmp")

# Crawl4AI imports
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode

# LangChain / Gemini imports
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate

# Load environment variables from .env
load_dotenv()

class ForecastData(BaseModel):
    date: str = Field(..., description="The date of the forecast (ISO format: YYYY-MM-DD)")
    windSpeed: float = Field(..., description="Wind speed in knots or km/h")
    windDirection: float = Field(..., description="Wind direction in degrees (0-360)")
    swellHeight: float = Field(..., description="Swell/Wave height in meters")
    swellPeriod: float = Field(..., description="Swell period in seconds")
    swellDirection: float = Field(..., description="Swell/Wave direction in degrees (0-360)")
    trend: Optional[str] = Field(None, description="A 1-sentence summary of how conditions change through the day (e.g. 'Wind picking up in afternoon')")

class DailyForecastResponse(BaseModel):
    forecasts: List[ForecastData]

async def semantic_scrape(url: str, region_id: str):
    print(f"--- Starting Decoupled Semantic Scrape for {region_id} ---", file=sys.stderr)
    
    api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
    if not api_key:
        print("Error: Neither GOOGLE_API_KEY nor GEMINI_API_KEY found in environment", file=sys.stderr)
        return None

    # Step 1: Crawl the page to get Markdown
    browser_config = BrowserConfig(headless=True)
    run_config = CrawlerRunConfig(cache_mode=CacheMode.BYPASS)
    
    markdown_content = ""
    async with AsyncWebCrawler(config=browser_config) as crawler:
        result = await crawler.arun(url=url, config=run_config)
        if not result.success:
            print(f"Crawl failed: {result.error_message}", file=sys.stderr)
            return None
        markdown_content = result.markdown
        print(f"✅ Page crawled successfully ({len(markdown_content)} bytes)", file=sys.stderr)

    # Step 2: Use LangChain + Gemini to extract structured data
    llm = ChatGoogleGenerativeAI(
        model="gemini-2.5-flash",
        google_api_key=api_key,
        temperature=0
    )
    
    structured_llm = llm.with_structured_output(DailyForecastResponse)
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", (
            "You are an expert surf forecast parser. Your goal is to extract a 7-10 day forecast from the provided markdown content. "
            "For each day, identify the morning forecast (around 05:00 to 11:00). "
            "Focus specifically on accurate degrees for swellDirection and windDirection. "
            "If direction is shown as an arrow, use surrounding text (alt tags, titles, or descriptions) to find the degrees (0-360). "
            "Ensure the output follows the requested JSON schema exactly. "
            "For the 'trend' field, describe how the wind and swell evolve from morning to evening so we can understand the daily progression."
        )),
        ("user", "Extract the forecast from this content:\n\n{content}")
    ])
    
    chain = prompt | structured_llm
    
    try:
        response = await chain.ainvoke({"content": markdown_content})
        print(f"✅ Extraction completed: {len(response.forecasts)} days found", file=sys.stderr)
        return response.model_dump()
    except Exception as e:
        print(f"❌ Extraction failed: {e}", file=sys.stderr)
        return None

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", required=True)
    parser.add_argument("--region", required=True)
    args = parser.parse_args()

    result = asyncio.run(semantic_scrape(args.url, args.region))
    if result:
        try:
            output = json.dumps(result, ensure_ascii=False)
            print(output)
            sys.stdout.flush()
        except Exception as e:
            print(f"Error printing JSON: {e}", file=sys.stderr)
            sys.exit(1)
    else:
        sys.exit(1)
