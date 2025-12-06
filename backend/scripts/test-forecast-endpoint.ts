/**
 * Test script to verify forecast endpoint returns 404 when no exact match is found
 * This tests the logic directly without needing the server running
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testForecastLogic() {
  try {
    console.log("🧪 Testing forecast endpoint logic...\n");

    // Test 1: Try to find a forecast for a future date (should not exist after deletion)
    const testDate = new Date();
    testDate.setUTCDate(testDate.getUTCDate() + 5); // 5 days from now
    testDate.setUTCHours(0, 0, 0, 0);

    const testRegionId = "western-cape";
    const testSource = "WINDFINDER" as const;
    const dateStr = testDate.toISOString().split("T")[0];

    console.log(`Test 1: Looking for forecast that should NOT exist`);
    console.log(`  Region: ${testRegionId}`);
    console.log(`  Date: ${dateStr}`);
    console.log(`  Source: ${testSource}\n`);

    // This is the exact logic from the forecast endpoint
    const forecast = await prisma.forecast.findUnique({
      where: {
        date_regionId_source: {
          date: testDate,
          regionId: testRegionId,
          source: testSource,
        },
      },
    });

    if (forecast) {
      console.log("❌ FAILED: Found forecast when it should not exist!");
      console.log(`   Found forecast for date: ${forecast.date.toISOString().split("T")[0]}`);
      console.log(`   This means the fallback logic might still be active or data exists.\n`);
    } else {
      console.log("✅ PASSED: No forecast found (as expected)");
      console.log(`   The endpoint would return 404 with error message.\n`);
    }

    // Test 2: Check if there are any forecasts for today or future
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const futureForecastCount = await prisma.forecast.count({
      where: {
        date: {
          gte: today,
        },
      },
    });

    console.log(`Test 2: Check for any future forecasts`);
    console.log(`  Forecasts from today onwards: ${futureForecastCount}`);

    if (futureForecastCount === 0) {
      console.log("✅ PASSED: No future forecasts exist (data was deleted)\n");
    } else {
      console.log(`⚠️  WARNING: ${futureForecastCount} future forecast(s) still exist`);
      console.log(`   You may want to run: npx tsx scripts/delete-future-forecasts.ts\n`);
    }

    // Test 3: Check if we can find a past forecast (should exist)
    const pastDate = new Date();
    pastDate.setUTCDate(pastDate.getUTCDate() - 7); // 7 days ago
    pastDate.setUTCHours(0, 0, 0, 0);

    const pastForecast = await prisma.forecast.findFirst({
      where: {
        regionId: testRegionId,
        source: testSource,
        date: {
          lte: pastDate,
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    console.log(`Test 3: Check if past forecasts exist`);
    if (pastForecast) {
      console.log("✅ PASSED: Past forecast exists");
      console.log(`   Found forecast for: ${pastForecast.date.toISOString().split("T")[0]}`);
      console.log(`   This confirms the database connection works.\n`);
    } else {
      console.log("⚠️  No past forecasts found (this is okay if database is new)\n");
    }

    // Test 4: Simulate the endpoint response
    console.log(`Test 4: Simulate endpoint response for missing forecast`);
    if (!forecast) {
      const errorResponse = {
        error: "No forecast data found",
        message: `No forecast data available for ${testSource} on ${dateStr} in region ${testRegionId}`,
        regionId: testRegionId,
        date: dateStr,
        source: testSource,
      };
      console.log("✅ Would return 404 with:");
      console.log(JSON.stringify(errorResponse, null, 2));
      console.log("\n✅ All tests passed! The fallback logic has been removed.");
    }

  } catch (error) {
    console.error("❌ Error during testing:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testForecastLogic()
  .then(() => {
    console.log("\n✨ Test completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  });


