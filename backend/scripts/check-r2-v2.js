import fetch from 'node-fetch';

async function checkUrl(url) {
  try {
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
  } catch (e) {
    console.error(`Error checking ${url}: ${e.message}`);
  }
}

async function main() {
  const f_dunes = 'BEST SURF _ DUNES (P2) _ Session 2026 03 08 #walkonwater #surf #westcoast #capetown #_) 0-18 screenshot.webp';
  const f_outers = 'BEST SURF _ OUTERS _ Cape town _ 2025_11_11 #walkonwater #surf #downsouth #westcoast 7-6 screenshot.webp';

  console.log('--- Checking with media.tideraider.com ---');
  await checkUrl(`https://media.tideraider.com/${encodeURIComponent(f_dunes)}`);
  await checkUrl(`https://media.tideraider.com/${encodeURIComponent(f_outers)}`);

  console.log('--- Checking with assets.blueowlmedia.nz ---');
  await checkUrl(`https://assets.blueowlmedia.nz/${encodeURIComponent(f_dunes)}`);
  await checkUrl(`https://assets.blueowlmedia.nz/${encodeURIComponent(f_outers)}`);
}

main();
