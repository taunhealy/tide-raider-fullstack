import re

file_path = "k:/Kea/tide-raider-fullstack/backend/src/lib/scrapers/scrapeSources.ts"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern to find sourceA block with weatherforecast but no forecastUrl
pattern = r'(sourceA:\s*{\s*url:\s*"(https://www.windfinder.com)/weatherforecast/([^"]+)",\s*)(scraper:\s*scraperA,)'

def replacement(match):
    full_match = match.group(0)
    prefix = match.group(1)
    base_url = match.group(2)
    spot = match.group(3)
    suffix = match.group(4)
    
    # Construct the new block
    # Check if forecastUrl already exists (sanity check)
    if "forecastUrl:" in full_match:
        return full_match
        
    return f'{prefix}forecastUrl: "{base_url}/forecast/{spot}",\n      {suffix}'

new_content = re.sub(pattern, replacement, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Successfully updated Windfinder URLs.")
