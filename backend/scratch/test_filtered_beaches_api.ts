import { prisma } from "../src/lib/prisma";

async function testApiLogic() {
  try {
    // Simulate req.query for filtered-beaches when ignoreRegion=true in proximity mode
    const query = {
      regionId: "western-cape",
      ignoreRegion: "true",
      isRegular: undefined, // Or check how it defaults
      isHiddenGem: undefined,
      source: "WINDY",
      timeSlot: "MORNING"
    };

    const showHiddenGems = String(query.isHiddenGem) === "true";
    const showRegular = String(query.isRegular) === "true" || query.isRegular === undefined;

    console.log("Filters determined:", { showHiddenGems, showRegular });

    const typeFilters: any[] = [];
    if (showHiddenGems) {
      typeFilters.push({ isHiddenGem: true });
    }
    if (showRegular) {
      typeFilters.push({ 
        OR: [
          { isHiddenGem: false },
          { isHiddenGem: null }
        ]
      });
    }

    const whereClause: any = {};
    if (typeFilters.length > 0) {
      whereClause.AND = [
        { OR: typeFilters }
      ];
    } else {
      whereClause.id = "force-zero-results";
    }

    console.log("whereClause constructed:", JSON.stringify(whereClause, null, 2));

    const beaches = await prisma.beach.findMany({
      where: whereClause,
      select: { id: true, name: true }
    });

    console.log(`Beaches found: ${beaches.length}`);
  } catch (err: any) {
    console.error("Error:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

testApiLogic();
