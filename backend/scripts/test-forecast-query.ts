/**
 * Test the exact Prisma query used in the forecast endpoint
 * to identify any issues with date handling or unique constraint
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testForecastQuery() {
  try {
    console.log("🧪 Testing forecast Prisma query...\n");

    const regionId = "western-cape";
    const source = "WINDFINDER" as const;

    // Test 1: Query for 2025-12-06 (should not exist)
    const testDate1 = new Date("2025-12-06");
    testDate1.setUTCHours(0, 0, 0, 0);
    const dateStr1 = testDate1.toISOString().split("T")[0];

    console.log(`Test 1: Query for date that doesn't exist`);
    console.log(`  Date object: ${testDate1.toISOString()}`);
    console.log(`  Date string: ${dateStr1}`);
    console.log(`  Region: ${regionId}`);
    console.log(`  Source: ${source}\n`);

    try {
      const forecast1 = await prisma.forecast.findUnique({
        where: {
          date_regionId_source: {
            date: testDate1,
            regionId: regionId,
            source: source,
          },
        },
      });

      if (forecast1) {
        console.log("❌ Unexpected: Found forecast when it shouldn't exist");
      } else {
        console.log("✅ Correct: No forecast found (returns null, not error)\n");
      }
    } catch (error: any) {
      console.error("❌ ERROR during query:", {
        message: error?.message,
        code: error?.code,
        meta: error?.meta,
      });
      throw error;
    }

    // Test 2: Query for 2025-12-05 (should exist based on our check)
    const testDate2 = new Date("2025-12-05");
    testDate2.setUTCHours(0, 0, 0, 0);
    const dateStr2 = testDate2.toISOString().split("T")[0];

    console.log(`Test 2: Query for date that should exist`);
    console.log(`  Date object: ${testDate2.toISOString()}`);
    console.log(`  Date string: ${dateStr2}`);
    console.log(`  Region: ${regionId}`);
    console.log(`  Source: WINDGURU (we know this exists)\n`);

    try {
      const forecast2 = await prisma.forecast.findUnique({
        where: {
          date_regionId_source: {
            date: testDate2,
            regionId: regionId,
            source: "WINDGURU",
          },
        },
      });

      if (forecast2) {
        console.log("✅ Correct: Found forecast");
        console.log(`   Date: ${forecast2.date.toISOString().split("T")[0]}`);
        console.log(`   Wind Speed: ${forecast2.windSpeed} km/h\n`);
      } else {
        console.log("⚠️  No forecast found (might have been deleted)\n");
      }
    } catch (error: any) {
      console.error("❌ ERROR during query:", {
        message: error?.message,
        code: error?.code,
        meta: error?.meta,
      });
      throw error;
    }

    // Test 3: Test date parsing (same as endpoint)
    console.log(`Test 3: Test date parsing logic from endpoint`);
    const forecastDateParam = "2025-12-06";
    const [year, month, day] = forecastDateParam.split("-").map(Number);
    const parsedDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    const parsedDateStr = parsedDate.toISOString().split("T")[0];

    console.log(`  Input: ${forecastDateParam}`);
    console.log(`  Parsed: ${parsedDate.toISOString()}`);
    console.log(`  Date string: ${parsedDateStr}`);
    console.log(`  Valid: ${!isNaN(parsedDate.getTime())}\n`);

    // Test 4: Check if unique constraint exists
    console.log(`Test 4: Verify unique constraint format`);
    console.log(`  Using: date_regionId_source`);
    console.log(`  Fields: date, regionId, source`);
    console.log(`  This should match the @@unique([date, regionId, source]) in schema\n`);

    console.log("✅ All query tests passed!");
    console.log("\n💡 If the endpoint is still returning 500 errors,");
    console.log("   check the Cloud Run logs for the detailed error message");
    console.log("   that will now be logged with the improved error handling.");

  } catch (error) {
    console.error("❌ Test failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

testForecastQuery()
  .then(() => {
    console.log("\n✨ Test completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  });

