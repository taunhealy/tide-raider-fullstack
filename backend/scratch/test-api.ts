async function testHistoricalApi() {
  const regionId = 'western-cape';
  const date = '2026-04-20';
  const url = `http://localhost:3000/api/beach-ratings/historical?regionId=${regionId}&date=${date}`;
  
  console.log(`Calling API: ${url}`);
  
  try {
    const response = await fetch(url);
    console.log(`Status: ${response.status}`);
    const data = await response.json() as any;
    console.log('Result Beach Count:', data.beaches?.length);
    if (data.beaches?.length > 0) {
      console.log('Beaches returned:');
      data.beaches.forEach((b: any) => {
        console.log(`- ${b.name}: ${b.totalScore}`);
      });
    } else {
      console.log('NO BEACHES RETURNED');
    }
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

testHistoricalApi();
