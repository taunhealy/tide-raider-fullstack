const { getLatestConditions } = require('../src/services/surfConditionsService');
const { prisma } = require('../src/lib/prisma');

async function testRefresh() {
  try {
    console.log("Triggering manual refresh for Muizenberg (WINDFINDER)...");
    const result = await getLatestConditions('western-cape', true, 'WINDFINDER', 1);
    console.log("Refresh result:");
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Refresh failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testRefresh();
