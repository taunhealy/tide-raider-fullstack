import fetch from 'node-fetch';

async function checkUrl(url) {
  const response = await fetch(url, { method: 'HEAD' });
  console.log(`[${response.status}] ${url}`);
  if (!response.ok) {
    // Try without encodeURIComponent
    const unencoded = decodeURIComponent(url);
    const unencodedResponse = await fetch(unencoded, { method: 'HEAD' });
    console.log(`  -> Unencoded [${unencodedResponse.status}] ${unencoded}`);
    
    // Try with only spaces encoded
    const spaceEncoded = unencoded.replace(/ /g, '%20');
    const spaceEncodedResponse = await fetch(spaceEncoded, { method: 'HEAD' });
    console.log(`  -> Space encoded [${spaceEncodedResponse.status}] ${spaceEncoded}`);
  }
}

async function main() {
  const f1 = 'Kirra Turns On for A Day _ Pumping Conditions March 13 _ Raw Surf Files 0-13 screenshot.webp';
  const f2 = 'First Swell of the Season! - NIAS, Indonesia - RAWFILES 25-26_JAN_2026 4K 0-17 screenshot.webp';
  const f3 = 'BEST SURF _ OUTERS _ Cape town _ 2025_11_11 #walkonwater #surf #downsouth #westcoast 7-6 screenshot.webp';

  await checkUrl(`https://media.tideraider.com/${encodeURIComponent(f1)}`);
  await checkUrl(`https://media.tideraider.com/${encodeURIComponent(f2)}`);
  await checkUrl(`https://media.tideraider.com/${encodeURIComponent(f3)}`);
}

main();
