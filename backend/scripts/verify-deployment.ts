
import { execSync } from 'child_process';

try {
  console.log('Fetching Cloud Run URL...');
  const url = execSync('gcloud run services describe tide-raider-backend --platform managed --region europe-west1 --format="value(status.url)"', { encoding: 'utf8' }).trim();
  console.log(`Found URL: ${url}`);
  
  if (!url) {
      console.error('Could not find Cloud Run URL');
      process.exit(1);
  }

  console.log('Verifying endpoint access...');
  // Just check root or a health endpoint to verify connectivity
  // We don't want to actually trigger the cron unless intended
  
  // We can try to hit the cron endpoint but without a secret or with a dummy one
  // It should return 401 or 400, but NOT "Could not resolve host"
  
  fetch(url)
    .then(res => {
        console.log(`Status: ${res.status}`);
        if(res.ok) {
            console.log('✅ Endpoint is accessible!');
        } else {
            console.log(`⚠️ Endpoint returned status ${res.status} (this is expected if authentication is required)`);
             console.log('✅ Host resolution works!');
        }
    })
    .catch(err => {
        console.error('❌ Connection failed:', err.cause || err);
    });

} catch (e) {
  console.error('Error:', e);
}
