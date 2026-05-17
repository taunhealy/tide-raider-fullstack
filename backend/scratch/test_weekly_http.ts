import { prisma } from "../src/lib/prisma";
import jwt from "jsonwebtoken";
import axios from "axios";

async function main() {
  console.log("Fetching first beach and user from DB...");
  const beach = await prisma.beach.findFirst();
  const user = await prisma.user.findFirst();
  
  if (!beach || !user) {
    console.error("Could not find beach or user in DB.");
    return;
  }
  
  console.log(`Beach: ${beach.name} (${beach.id})`);
  console.log(`User: ${user.name} (${user.id}), Credits: ${user.credits}`);

  const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "fallback-secret";
  console.log("Using JWT secret length:", secret.length);

  // Generate a valid token
  const payload = {
    id: user.id,
    sub: user.id,
    email: user.email,
    name: user.name
  };
  const token = jwt.sign(payload, secret, { expiresIn: "30d" });
  console.log("Generated token:", token.substring(0, 30) + "...");

  const todayStr = new Date().toISOString().split('T')[0];
  const url = "http://127.0.0.1:4050/api/intelligence/weekly";
  const body = {
    beachId: beach.id,
    date: todayStr,
    persona: "BRO",
    days: 7,
    category: "SURFING"
  };

  console.log(`Sending POST request to ${url}...`);
  try {
    const response = await axios.post(url, body, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    console.log("Success! Status:", response.status);
    console.log("Response data:", response.data);
  } catch (err: any) {
    console.error("Request failed!");
    if (err.response) {
      console.error("Status:", err.response.status);
      console.error("Headers:", err.response.headers);
      console.error("Response body:", err.response.data);
    } else {
      console.error("Error:", err.message);
    }
  }
}

main().catch(console.error);
