
import 'dotenv/config';
import { spawn } from 'child_process';

const secretName = 'RESEND_API_KEY';
const secretValue = process.env.RESEND_API_KEY;

if (!secretValue) {
  console.error(`❌ ${secretName} not found in .env`);
  process.exit(1);
}

console.log(`Pushing ${secretName} to Secret Manager...`);

const gcloud = spawn('gcloud', [
  'secrets', 'versions', 'add', secretName, '--data-file=-', '--project=surf-445620'
], { stdio: ['pipe', 'inherit', 'inherit'], shell: true });

gcloud.stdin.write(secretValue);
gcloud.stdin.end();

gcloud.on('close', (code) => {
  if (code === 0) {
    console.log(`✅ Successfully updated ${secretName}`);
  } else {
    console.error(`❌ Failed to update ${secretName} (exit code ${code})`);
  }
});
