const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

async function main() {
  try {
    // 1. Search in DB
    console.log("=== DB SEARCH ===");
    const dbBeaches = await prisma.beach.findMany({
      where: {
        OR: [
          { name: { contains: 'Glencairn', mode: 'insensitive' } },
          { name: { contains: 'I&J', mode: 'insensitive' } },
          { name: { contains: 'I and J', mode: 'insensitive' } },
          { name: { contains: 'Elands', mode: 'insensitive' } },
          { id: { contains: 'glencairn', mode: 'insensitive' } },
          { id: { contains: 'ij', mode: 'insensitive' } },
          { id: { contains: 'elands', mode: 'insensitive' } }
        ]
      }
    });
    console.log("Found in DB:", dbBeaches.map(b => ({
      id: b.id,
      name: b.name,
      coordinates: b.coordinates,
      isHiddenGem: b.isHiddenGem
    })));

    // 2. Search in africa.json
    console.log("\n=== JSON FILE SEARCH ===");
    const africaPath = path.join(__dirname, '..', 'backend', 'src', 'data', 'continents', 'africa.json');
    if (fs.existsSync(africaPath)) {
      const data = JSON.parse(fs.readFileSync(africaPath, 'utf8'));
      const matches = data.filter(b => 
        b.name.toLowerCase().includes('glencairn') ||
        b.name.toLowerCase().includes('i&j') ||
        b.name.toLowerCase().includes('i and j') ||
        b.name.toLowerCase().includes('elands') ||
        b.id.toLowerCase().includes('glencairn') ||
        b.id.toLowerCase().includes('ij') ||
        b.id.toLowerCase().includes('elands')
      );
      console.log("Found in JSON:", matches.map(b => ({
        id: b.id,
        name: b.name,
        coordinates: b.coordinates,
        isHiddenGem: b.isHiddenGem
      })));
    } else {
      console.log("africa.json not found at path:", africaPath);
    }

  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
