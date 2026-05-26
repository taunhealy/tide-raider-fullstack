import { prisma } from "../src/lib/prisma";

// Cape Town coordinates
const userLocation = { lat: -33.9249, lng: 18.4241 };
const maxDistance = 310;

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

async function testProximity() {
  try {
    // 1. Fetch beaches with coordinates
    const beaches = await prisma.beach.findMany({
      select: {
        id: true,
        name: true,
        coordinates: true,
        regionId: true
      }
    });

    console.log(`Total beaches in DB: ${beaches.length}`);

    const processed = beaches.map(b => {
      let coords = b.coordinates;
      if (typeof coords === "string") {
        try {
          coords = JSON.parse(coords);
        } catch {}
      }
      const lat = coords && typeof coords === "object" ? parseFloat((coords as any).lat) : NaN;
      const lng = coords && typeof coords === "object" ? parseFloat((coords as any).lng) : NaN;
      
      let distance: number | null = null;
      if (!isNaN(lat) && !isNaN(lng)) {
        distance = calculateDistance(userLocation.lat, userLocation.lng, lat, lng);
      }
      return { ...b, distance };
    });

    const closeBeaches = processed.filter(b => b.distance !== null && b.distance <= maxDistance);
    console.log(`Beaches within ${maxDistance}km of Cape Town: ${closeBeaches.length}`);
    closeBeaches.slice(0, 10).forEach(b => {
      console.log(` - ${b.name}: ${b.distance?.toFixed(1)}km`);
    });
  } catch (err: any) {
    console.error("Test failed:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

testProximity();
