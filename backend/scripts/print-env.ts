import { PrismaClient } from "@prisma/client";
import * as dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

console.log("DATABASE_URL=" + process.env.DATABASE_URL);
console.log("DIRECT_URL=" + process.env.DIRECT_URL);
console.log("JWT_SECRET=" + process.env.JWT_SECRET);
console.log("NEXTAUTH_SECRET=" + process.env.NEXTAUTH_SECRET);
console.log("GOOGLE_CLIENT_ID=" + process.env.GOOGLE_CLIENT_ID);
console.log("GOOGLE_CLIENT_SECRET=" + process.env.GOOGLE_CLIENT_SECRET);
console.log("FRONTEND_URL=" + process.env.FRONTEND_URL);
