
import 'dotenv/config';

if (process.env.RESEND_API_KEY) {
  console.log("Local .env has RESEND_API_KEY");
} else {
  console.log("Local .env is MISSING RESEND_API_KEY");
}
