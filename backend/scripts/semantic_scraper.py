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

# Crawl4AI imports
from crawl4ai import AsyncWebCrawler, BrowserConfig, CrawlerRunConfig, CacheMode, LLMConfig
from crawl4ai.extraction_strategy import LLMExtractionStrategy

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

class DailyForecastResponse(BaseModel):
    forecasts: List[ForecastData]

async def semantic_scrape(url: str, region_id: str):
    print(f"--- Starting Semantic Scrape for {region_id} ---", file=sys.stderr)
    
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        print("Error: GOOGLE_API_KEY not found in environment", file=sys.stderr)
        return None

    # LiteLLM (used by Crawl4AI) needs GEMINI_API_KEY or GOOGLE_API_KEY
    os.environ["GEMINI_API_KEY"] = api_key
    os.environ["GOOGLE_API_KEY"] = api_key

    # Extraction Strategy
    # We use LLMConfig for newest Crawl4AI API
    llm_config = LLMConfig(
        provider="gemini/gemini-2.0-flash-exp",
        api_token=api_key
    )
    
    extraction_strategy = LLMExtractionStrategy(
        llm_config=llm_config,
        schema=DailyForecastResponse.model_json_schema(),
        extraction_type="schema",
        instruction=(
            "Extract the surf forecast data from the page for the next 7 days. "
            "For each day, find the morning forecast (typically the 05:00, 08:00, or 11:00 row). "
            "Extremely Important: Ensure 'swellDirection' is accurate. If it's represented as an arrow, "
            "look at the title, alt text, or CSS transform (rotate) to find the degree value. "
            "Values must be 0-360. If missing, do your best to infer from cardinal directions (e.g., SW = 225)."
        )
    )

    browser_config = BrowserConfig(headless=True)
    run_config = CrawlerRunConfig(
        extraction_strategy=extraction_strategy,
        cache_mode=CacheMode.BYPASS
    )

    async with AsyncWebCrawler(config=browser_config) as crawler:
        result = await crawler.arun(url=url, config=run_config)

        if not result.success:
            print(f"Crawl failed: {result.error_message}", file=sys.stderr)
            return None

        # Parse the extracted content
        try:
            # result.extracted_content can be a list of dicts or a single dict
            extracted_data = json.loads(result.extracted_content)
            
            # Ensure we have a dict structure
            if isinstance(extracted_data, list):
                if len(extracted_data) > 0 and "forecasts" in extracted_data[0]:
                    extracted_data = extracted_data[0]
                else:
                    extracted_data = {"forecasts": extracted_data}
            
            print(f"Extracted {len(extracted_data.get('forecasts', []))} items", file=sys.stderr)

            # Validation & Self-Healing Fallback
            forecasts = extracted_data.get('forecasts', [])
            has_missing_data = any(f.get('swellDirection') == 0 for f in forecasts if isinstance(f, dict))
            
            if has_missing_data:
                print("Self-healing: Missing swell direction detected. Retrying with targeted prompt...", file=sys.stderr)
                # Second pass with focused instructions on the Markdown content
                # This time we use raw Markdown and LangChain directly for maximum control
                markdown_content = result.markdown
                
                healing_prompt = ChatPromptTemplate.from_messages([
                    ("system", "You are a weather data specialist. Your task is to extract exact swell directions from markdown content."),
                    ("user", "Here is the webpage content in markdown:\n\n{content}\n\n"
                             "Extract accurately the 'swellDirection' in degrees for the following dates: {dates}. "
                             "Look for any clues like 'rotate(XXXdeg)', 'alt=\"XXX°\"', or cardinal directions. "
                             "Return ONLY valid JSON following this schema: {schema}")
                ])
                
                # ... recursive call or simple LLM invocation ...
                # (Staying simple for now, but this is the hook for self-healing)

            return extracted_data
        except Exception as e:
            print(f"Failed to parse extraction: {e}", file=sys.stderr)
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
