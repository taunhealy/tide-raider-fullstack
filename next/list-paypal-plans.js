// list-paypal-plans.js
const fetch = require('node-fetch');

async function listPlans() {
  // Replace with your actual credentials
  const clientId = 'AR4CxAn0rM602Tn-AnZuB-O_mbvhucTdTWTPxuNuKOhfrC1cfqiZXXTNjQoBeb3vqipueojmzo7Yxugr';
  const clientSecret = 'EI0NGf7DOycuhVr2JDq5KGvHaMmOtBjSmIYG1lfxH2ilwPCwwVK-SXv-hO94vxeCa4eyS2U0u2pBbxO5';
  
  // Get access token
  const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  console.log('Getting access token...');
  const tokenRes = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  
  const tokenData = await tokenRes.json();
  const access_token = tokenData.access_token;
  console.log('Access token obtained');
  
  // List products
  console.log('Listing products...');
  const productsRes = await fetch('https://api-m.sandbox.paypal.com/v1/catalogs/products?page_size=20', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const products = await productsRes.json();
  console.log('Products:', products);
  
  // List plans
  console.log('Listing plans...');
  const plansRes = await fetch('https://api-m.sandbox.paypal.com/v1/billing/plans?page_size=20', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    }
  });
  
  const plans = await plansRes.json();
  console.log('Plans:', plans);
  
  if (plans.plans && plans.plans.length > 0) {
    console.log('\nExisting Plan IDs:');
    plans.plans.forEach(plan => {
      console.log(`- ${plan.id} (${plan.name}): ${plan.description}`);
    });
    console.log('\nYou can use any of these Plan IDs in your .env.local file');
  } else {
    console.log('No existing plans found. You need to create one.');
  }
}

listPlans().catch(console.error);