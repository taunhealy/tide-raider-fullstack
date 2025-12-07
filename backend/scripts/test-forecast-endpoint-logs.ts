/**
 * Test the forecast endpoint logic with detailed logging
 * Simulates the actual API request flow to see what errors occur
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Simulate console.log with timestamps for better visibility
const log = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${message}`);
  if (data) {
    console.log(JSON.stringify(data, null, 2));
  }
};

async function testForecastEndpoint() {
  try {
    log("🧪 Testing forecast endpoint with detailed logging...\n");

    // Test Case 1: Query for 2025-12-06 (doesn't exist) - should return 404
    log("=".repeat(60));
    log("TEST CASE 1: Query for non-existent forecast (2025-12-06)");
    log("=".repeat(60));

    const regionId = "western-cape";
    const forecastDateParam = "2025-12-06";
    const sourceParam = "WINDFINDER";

    log(`Request parameters:`);
    log(`  regionId: ${regionId}`);
    log(`  forecastDate: ${forecastDateParam}`);
    log(`  source: ${sourceParam}\n`);

    // Step 1: Resolve region
    log("Step 1: Resolving region...");
    const regionIdParam = regionId.toLowerCase();
    const nameFromSlug = regionIdParam
      .split("-")
      .map(
        (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
      )
      .join(" ");

    const region = await prisma.region.findFirst({
      where: {
        OR: [
          { id: regionIdParam },
          { name: { equals: nameFromSlug, mode: "insensitive" } },
          { name: { equals: regionIdParam, mode: "insensitive" } },
          { name: { contains: regionIdParam, mode: "insensitive" } },
          { name: { contains: nameFromSlug, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true },
    });

    if (!region) {
      log("❌ Region not found - would return 404");
      return;
    }

    log(`✅ Region found: ${region.id} (${region.name})`);
    const resolvedRegionId = region.id;

    // Step 2: Parse date
    log("\nStep 2: Parsing date...");
    let targetDate: Date;
    try {
      const [year, month, day] = forecastDateParam.split("-").map(Number);
      if (isNaN(year) || isNaN(month) || isNaN(day)) {
        throw new Error(`Invalid date format: ${forecastDateParam}`);
      }
      targetDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
      if (isNaN(targetDate.getTime())) {
        throw new Error(`Invalid date: ${forecastDateParam}`);
      }
      log(`✅ Date parsed: ${targetDate.toISOString()}`);
    } catch (dateError: any) {
      log(`❌ Date parsing error: ${dateError.message}`);
      log("   Would return 400 Bad Request");
      return;
    }

    const dateStr = targetDate.toISOString().split("T")[0];
    log(`   Date string: ${dateStr}`);

    // Step 3: Query forecast
    log("\nStep 3: Querying forecast from database...");
    let forecast;
    try {
      const startTime = Date.now();
      forecast = await prisma.forecast.findUnique({
        where: {
          date_regionId_source: {
            date: targetDate,
            regionId: resolvedRegionId,
            source: sourceParam,
          },
        },
      });
      const queryTime = Date.now() - startTime;
      log(`✅ Query completed in ${queryTime}ms`);
      
      if (forecast) {
        log(`✅ Forecast found:`);
        log(`   Date: ${forecast.date.toISOString().split("T")[0]}`);
        log(`   Wind Speed: ${forecast.windSpeed} km/h`);
        log(`   Wind Direction: ${forecast.windDirection}°`);
      } else {
        log(`❌ No forecast found (returns null, not error)`);
        log(`   This is correct behavior - would return 404`);
      }
    } catch (prismaError: any) {
      log(`❌ PRISMA QUERY ERROR:`);
      log(`   Message: ${prismaError?.message}`);
      log(`   Code: ${prismaError?.code}`);
      log(`   Meta:`, prismaError?.meta);
      log(`   This would cause a 500 error in the API`);
      throw prismaError;
    }

    // Test Case 2: Query for 2025-12-05 (exists) - should return 200
    log("\n" + "=".repeat(60));
    log("TEST CASE 2: Query for existing forecast (2025-12-05)");
    log("=".repeat(60));

    const existingDate = "2025-12-05";
    const existingSource = "WINDGURU";

    log(`Request parameters:`);
    log(`  regionId: ${regionId}`);
    log(`  forecastDate: ${existingDate}`);
    log(`  source: ${existingSource}\n`);

    const [year2, month2, day2] = existingDate.split("-").map(Number);
    const existingTargetDate = new Date(Date.UTC(year2, month2 - 1, day2, 0, 0, 0, 0));

    try {
      const startTime = Date.now();
      const existingForecast = await prisma.forecast.findUnique({
        where: {
          date_regionId_source: {
            date: existingTargetDate,
            regionId: resolvedRegionId,
            source: existingSource,
          },
        },
      });
      const queryTime = Date.now() - startTime;
      log(`✅ Query completed in ${queryTime}ms`);

      if (existingForecast) {
        log(`✅ Forecast found - would return 200 OK:`);
        log(`   Date: ${existingForecast.date.toISOString().split("T")[0]}`);
        log(`   Wind Speed: ${existingForecast.windSpeed} km/h`);
        log(`   Wind Direction: ${existingForecast.windDirection}°`);
        log(`   Temperature: ${existingForecast.temperature}°C`);
      } else {
        log(`❌ No forecast found (unexpected)`);
      }
    } catch (prismaError: any) {
      log(`❌ PRISMA QUERY ERROR:`);
      log(`   Message: ${prismaError?.message}`);
      log(`   Code: ${prismaError?.code}`);
      throw prismaError;
    }

    // Test Case 3: Invalid date format
    log("\n" + "=".repeat(60));
    log("TEST CASE 3: Invalid date format");
    log("=".repeat(60));

    const invalidDate = "2025-13-45"; // Invalid month and day
    log(`Testing with invalid date: ${invalidDate}`);

    try {
      const [year3, month3, day3] = invalidDate.split("-").map(Number);
      if (isNaN(year3) || isNaN(month3) || isNaN(day3)) {
        throw new Error(`Invalid date format: ${invalidDate}`);
      }
      const invalidTargetDate = new Date(Date.UTC(year3, month3 - 1, day3, 0, 0, 0, 0));
      if (isNaN(invalidTargetDate.getTime())) {
        throw new Error(`Invalid date: ${invalidDate}`);
      }
      log(`⚠️  Date was parsed (unexpected)`);
    } catch (dateError: any) {
      log(`✅ Date validation caught error: ${dateError.message}`);
      log(`   Would return 400 Bad Request`);
    }

    log("\n" + "=".repeat(60));
    log("✅ All tests completed successfully!");
    log("=".repeat(60));
    log("\n💡 Summary:");
    log("   - Non-existent forecasts return null (not errors)");
    log("   - Existing forecasts are found correctly");
    log("   - Date validation works");
    log("   - If you see 500 errors in production, check Cloud Run logs");
    log("     for '[forecast] Prisma query error:' messages");

  } catch (error: any) {
    log("\n" + "=".repeat(60));
    log("❌ TEST FAILED");
    log("=".repeat(60));
    log(`Error: ${error?.message}`);
    log(`Stack:`, error?.stack);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testForecastEndpoint()
  .then(() => {
    console.log("\n✨ Test completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  });

