
// require('dotenv').config({ path: '.env.local' });

// Hardcode the credentials you provided to test them specifically
// (We normally use env vars, but let's be explicit for this test)
const CLIENT_ID = "AQB7ECPXxz6yj3zxF4-6T_lTqzbIsYm-sE5ygpEcbZ7BG_dUvdt9Hbg_XBGbszwr3JfPk0abxdcoPuVC";
const SECRET = "EGkJqsDOPDnLndplJrKPEA35p0UI6rYvhmR5CiiC7JX8w1gyqAKr5u4iC3TRfdv_w2D6f1H_GKEDH5sR";

// Test both modes
async function testAuth(mode) {
  console.log(`Testing ${mode} mode...`);
  const baseUrl = mode === 'live' 
    ? "https://api-m.paypal.com" 
    : "https://api-m.sandbox.paypal.com";

  const auth = Buffer.from(`${CLIENT_ID}:${SECRET}`).toString("base64");

  try {
    const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${auth}`,
      },
      body: "grant_type=client_credentials",
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ SUCCESS in ${mode} mode!`);
      console.log(`   Access Token: ${data.access_token.substring(0, 10)}...`);
      return true;
    } else {
      const text = await response.text();
      console.log(`❌ FAILED in ${mode} mode.`);
      console.log(`   Status: ${response.status}`);
      console.log(`   Response: ${text}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ ERROR in ${mode} mode:`, error.message);
    return false;
  }
}

async function main() {
  console.log("🔍 Testing PayPal Credentials...");
  console.log("--------------------------------");
  
  // Test Live first (since you said it's Live)
  const liveSuccess = await testAuth('live');
  
  console.log("--------------------------------");
  
  // Test Sandbox just in case
  const sandboxSuccess = await testAuth('sandbox');
  
  console.log("--------------------------------");
  console.log("Summary:");
  if (liveSuccess) console.log("✅ Credentials are valid for LIVE mode.");
  if (sandboxSuccess) console.log("✅ Credentials are valid for SANDBOX mode.");
  if (!liveSuccess && !sandboxSuccess) console.log("❌ Credentials are invalid for BOTH modes.");
}

main();
