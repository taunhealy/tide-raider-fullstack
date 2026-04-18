import axios from 'axios';

async function testForecast() {
  const regionId = 'western-cape';
  const url = `http://localhost:4001/api/forecast?regionId=${regionId}&forceRefresh=true`;
  
  console.log(`🚀 Testing forecast endpoint (with forceRefresh=true): ${url}`);
  const start = Date.now();
  
  try {
    const response = await axios.get(url, { timeout: 60000 });
    const duration = Date.now() - start;
    console.log(`✅ Success! (took ${duration}ms)`);
    console.log('Response data:', JSON.stringify(response.data, null, 2));
  } catch (error: any) {
    const duration = Date.now() - start;
    console.error(`❌ Failed after ${duration}ms`);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

testForecast();
