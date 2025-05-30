// create-paypal-plan.js
const fetch = require('node-fetch');

async function createPlan() {
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
  
  // Create product
  console.log('Creating product...');
  const productRes = await fetch('https://api-m.sandbox.paypal.com/v1/catalogs/products', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: 'Tide Raider Premium',
      description: 'Premium subscription for Tide Raider',
      type: 'SERVICE',
      category: 'SOFTWARE'
    })
  });
  
  const product = await productRes.json();
  console.log('Product created:', product);
  
  // Create plan
  console.log('Creating plan...');
  const planRes = await fetch('https://api-m.sandbox.paypal.com/v1/billing/plans', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${access_token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      product_id: product.id,
      name: 'Tide Raider Monthly',
      description: 'Monthly subscription plan',
      billing_cycles: [
        {
          frequency: {
            interval_unit: 'MONTH',
            interval_count: 1
          },
          tenure_type: 'REGULAR',
          sequence: 1,
          total_cycles: 0,
          pricing_scheme: {
            fixed_price: {
              value: '9.99',
              currency_code: 'USD'
            }
          }
        }
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee: {
          value: '0',
          currency_code: 'USD'
        },
        setup_fee_failure_action: 'CONTINUE',
        payment_failure_threshold: 3
      }
    })
  });
  
  const plan = await planRes.json();
  console.log('Plan created:', plan);
  console.log('PLAN ID:', plan.id);
  console.log('Add this to your .env.local file as PAYPAL_PLAN_ID');
}

createPlan().catch(console.error);