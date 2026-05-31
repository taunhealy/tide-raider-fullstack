import fetch from 'node-fetch';

async function test() {
  const res = await fetch('http://localhost:3000/api/backend/intelligence/weekly', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // We need to bypass auth for this test, or use a valid token
      // But wait, the route has authenticateToken middleware!
    },
    body: JSON.stringify({
      beachId: 'outer-kom',
      date: '2026-05-31',
      persona: 'BRO',
      days: 7,
      category: 'SURFING',
      source: 'WINDFINDER'
    })
  });
  
  const text = await res.text();
  console.log(`Status: ${res.status}`);
  console.log(`Response: ${text}`);
}

test().catch(console.error);
