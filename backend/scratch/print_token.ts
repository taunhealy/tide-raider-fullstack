import { prisma } from "../src/lib/prisma";
import jwt from "jsonwebtoken";

async function main() {
  const user = await prisma.user.findFirst({
    where: {
      name: {
        contains: "Laurent"
      }
    }
  }) || await prisma.user.findFirst();
  
  if (!user) {
    console.error("No user found.");
    return;
  }

  const secret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || "fallback-secret";
  
  const payload = {
    id: user.id,
    sub: user.id,
    email: user.email,
    name: user.name
  };
  
  const token = jwt.sign(payload, secret, { expiresIn: "30d" });
  console.log("------------------ TOKEN START ------------------");
  console.log(token);
  console.log("------------------ TOKEN END ------------------");
  console.log(`User details: ID=${user.id}, Name=${user.name}, Email=${user.email}`);
}

main().catch(console.error);
