import { PrismaClient } from "@prisma/client";
import { randomUUID } from "crypto";

const prisma = new PrismaClient();

async function fetchHistoricalData(lat: number, lon: number, date: string) {
  const dateStr = date.split("T")[0];
  
  // Fetch wind data
  const windRes = await fetch(
    `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${dateStr}&end_date=${dateStr}&hourly=wind_speed_10m,wind_direction_10m`
  );
  const windData = await windRes.json();
  
  // Fetch marine data
  const marineRes = await fetch(
    `https://marine-api.open-meteo.com/v1/marine?latitude=${lat}&longitude=${lon}&start_date=${dateStr}&end_date=${dateStr}&hourly=swell_wave_height,swell_wave_period,swell_wave_direction`
  );
  const marineData = await marineRes.json();
  
  // Use noon data as proxy for the day (index 12)
  const idx = 12;
  
  return {
    windSpeed: Math.round(windData.hourly?.wind_speed_10m?.[idx] / 1.852) || 0, // km/h to kts
    windDirection: windData.hourly?.wind_direction_10m?.[idx] || 0,
    swellHeight: marineData.hourly?.swell_wave_height?.[idx] || 0,
    swellPeriod: Math.round(marineData.hourly?.swell_wave_period?.[idx]) || 0,
    swellDirection: marineData.hourly?.swell_wave_direction?.[idx] || 0,
  };
}

async function main() {
  console.log("🛠️ Starting missing forecast repair process...");
  
  const entries = await prisma.logEntry.findMany({
    where: { 
      forecastId: null
    },
    include: {
      region: true
    }
  });
  
  console.log(`🔍 Found ${entries.length} entries missing forecasts.`);
  
  for (const entry of entries) {
    console.log(`\n📄 Processing: ${entry.beachName} on ${entry.date.toISOString().split('T')[0]}`);
    
    // Check if a forecast already exists for this date/region/source
    const existing = await prisma.forecast.findFirst({
      where: {
        date: entry.date,
        regionId: entry.regionId!,
        source: "WINDFINDER"
      }
    });

    let forecastId = existing?.id;

    if (!existing) {
      try {
        // Approximate coordinates for Western Cape if region is Western Cape
        // Ideally we'd use the beach coordinates, but we can't easily join them if they're JSON
        let lat = -34.05;
        let lon = 18.35;
        
        if (entry.regionId === "kwazulu-natal") {
          lat = -29.85; lon = 31.02;
        } else if (entry.regionId === "eastern-cape") {
          lat = -33.96; lon = 25.60;
        }

        const data = await fetchHistoricalData(lat, lon, entry.date.toISOString());
        
        const newForecast = await prisma.forecast.create({
          data: {
            id: randomUUID(),
            date: entry.date,
            regionId: entry.regionId!,
            source: "WINDFINDER",
            ...data
          }
        });
        forecastId = newForecast.id;
        console.log(`✅ Created historical forecast: ${JSON.stringify(data)}`);
      } catch (err) {
        console.error(`❌ Failed to fetch data for entry ${entry.id}:`, err);
        continue;
      }
    } else {
      console.log(`♻️ Found existing archive forecast.`);
    }

    if (forecastId) {
      await prisma.logEntry.update({
        where: { id: entry.id },
        data: { forecastId }
      });
      console.log(`🔗 Linked entry to forecast.`);
    }
  }
  
  console.log("\n🏁 Repair process complete!");
}

main().catch(console.error);
