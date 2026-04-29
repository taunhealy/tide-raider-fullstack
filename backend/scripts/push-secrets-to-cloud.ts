import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
import * as fs from 'fs';

// Load environment variables
dotenv.config({ path: '.env' });

const secrets = [
  'DATABASE_URL',
  'DIRECT_URL',
  'JWT_SECRET',
  'NEXTAUTH_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'FRONTEND_URL',
  'GOOGLE_API_KEY'
];

async function updateSecrets() {
  console.log('🚀 Starting secret update process...');

  for (const secret of secrets) {
    const value = process.env[secret];
    if (!value) {
      console.warn(`⚠️  Skipping ${secret}: Value not found in .env`);
      continue;
    }

    console.log(`Updating ${secret}...`);
    try {
      // Use powershell to pipe the value to gcloud
      // Note: This assumes running in a shell where gcloud is available
      // We use a safe way to pass the secret without exposing it in the command line logs if possible
      // But execSync with input is safer.
      
      // Check if secret exists
      try {
        execSync(`gcloud secrets describe ${secret}`, { stdio: 'ignore', shell: 'powershell.exe' });
        // If successful, it exists. Add new version.
        const cmd = `gcloud secrets versions add ${secret} --data-file=-`;
        execSync(cmd, {
            input: value,
            stdio: ['pipe', 'inherit', 'inherit'],
            shell: 'powershell.exe'
        });
        console.log(`✅ Updated ${secret}`);
      } catch (e) {
        // If describe failed, assume it doesn't exist. Create it.
        console.log(`Secret ${secret} not found. Creating...`);
        const cmd = `gcloud secrets create ${secret} --data-file=- --replication-policy=automatic`;
        execSync(cmd, {
            input: value,
            stdio: ['pipe', 'inherit', 'inherit'],
            shell: 'powershell.exe'
        });
        console.log(`✅ Created ${secret}`);
      }
    } catch (error) {
      console.error(`❌ Failed to update ${secret}:`, error);
    }
  }

  console.log('\n🔄 Redeploying Cloud Run service to pick up new secrets...');
  try {
    // We need to know the service name. Assuming 'tide-raider-backend' based on docs, 
    // but let's try to find it or let the user specify.
    // For now, we'll just update the secrets. The user can redeploy or we can try to guess.
    // Let's try to list services first to be sure.
    const services = execSync('gcloud run services list --format="value(SERVICE)"', { encoding: 'utf8' });
    const serviceName = services.trim().split('\n')[0]; // Take the first one found
    
    if (serviceName) {
        console.log(`Found service: ${serviceName}`);
        
        // Construct the update-secrets flag
        // We need to map env var name to secret name. Assuming 1:1 mapping.
        const secretMappings = secrets
            .filter(s => process.env[s]) // Only include ones we have
            .map(s => `${s}=${s}:latest`)
            .join(',');

        const deployCmd = `gcloud run services update ${serviceName} --region europe-west1 --update-secrets ${secretMappings}`;
        console.log(`Running: ${deployCmd}`);
        execSync(deployCmd, { stdio: 'inherit', shell: 'powershell.exe' });
        console.log('✅ Deployment updated successfully!');
    } else {
        console.log('⚠️  No Cloud Run service found. You may need to deploy manually.');
    }

  } catch (error) {
    console.error('❌ Failed to redeploy:', error);
  }
}

updateSecrets();
