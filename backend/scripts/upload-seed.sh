#!/bin/bash
# Script to upload seed files to Fly.io container and run seed

echo "📤 Uploading seed files to Fly.io container..."

# Upload the frontend seed script
flyctl ssh sftp --app tide-raider-backend <<EOF
put ../next/prisma/seed.ts /app/prisma/seed-frontend.ts
put ../next/app/data/beachData.ts /app/src/data/beachData.ts
put ../next/app/lib/location/countries/constants.ts /app/src/lib/location/countries/constants.ts
quit
EOF

echo "✅ Files uploaded. Now run the seed script via SSH:"
echo "flyctl ssh console --app tide-raider-backend --command 'npx tsx prisma/seed-frontend.ts'"

