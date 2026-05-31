import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const targetDate = new Date("2026-05-31T00:00:00.000Z");
  
  // Operators to assign the briefings to
  const taunUser = await prisma.user.findFirst({ where: { email: "taunhealy@gmail.com" } });
  const rykoUser = await prisma.user.findFirst({ where: { email: "admin@tideraider.com" } });
  
  const userId = taunUser?.id || rykoUser?.id || "cmn4owtab0000s60f0dosfbck";
  console.log(`👤 Using User ID for reports: ${userId}`);

  // List of candidate beach IDs in the Western Cape
  const beachIds = ['llandudno', 'noordhoek', 'lands-bay-the-point', 'pringle-bay', 'elands-bay-the-point', 'muizenberg', 'misty-cliffs', 'sunset-reef'];

  const sources = ['WINDFINDER', 'WINDGURU', 'WINDY', 'WINDFINDER_SUPER'];
  const durations = [1, 3, 7];

  for (const beachId of beachIds) {
    // Check if the beach exists in the database
    const beach = await prisma.beach.findUnique({
      where: { id: beachId }
    });

    if (!beach) {
      console.log(`⚠️ Beach with ID '${beachId}' not found. Skipping.`);
      continue;
    }

    console.log(`🏖️ Generating intelligence reports for Beach: ${beach.name} (${beachId})`);

    // Clean up existing reports for this beach and target date to prevent duplication
    await prisma.intelligenceReport.deleteMany({
      where: {
        beachId,
        date: targetDate
      }
    });

    for (const source of sources) {
      for (const duration of durations) {
        let content = "";
        let persona = "";

        if (duration === 1) {
          persona = "BRO";
          content = `### 🚨 DAILY TACTICAL OBSERVER BRIEFING: ${beach.name.toUpperCase()}

**SURF PERSPECTIVE (${source} DATA OUTLOOK):**
The morning window is looking clean and highly promising. A robust groundswell is moving into the main zone, offering punchy shoulder-to-head high peaks.

**TACTICAL BREAKDOWN:**

**Wind Alignments:** Mild offshore wind from the east-northeast at 4-8 knots, keeping the faces extremely clean and open.

**Swell Surge:** Primary swell registered at 1.8m @ 12 seconds. High swell energy ensures strong lines extending straight through to the inside sandbars.

**Tide Window:** High tide peaks around mid-morning. The pushing tide will thicken the take-off zone, making it ideal for high-volume boards and responsive fish shapes.

**TACTICAL RECOMMENDATION:**
Paddle out early. The offshore wind will likely shift side-onshore by noon, creating slight texture and crumbliness. Focus on the sandbanks near the middle peaks for the longest rides.`;
        } else if (duration === 3) {
          persona = "STRATEGIST";
          content = `### 🛰️ 3-DAY TACTICAL WINDOW BRIEFING: ${beach.name.toUpperCase()}

**3-DAY FORECAST WINDOWS (SOURCE: ${source}):**
A dynamic low-pressure system is sweeping across the Cape Peninsula, generating high-velocity swell pulses over the next 72 hours. 

**WINDOW TIMELINES:**
1. **Day 1 (Today):** Excellent, highly clean morning offshore conditions. Wave sizes holding at 1.8m. Peak shapes.
2. **Day 2 (Tomorrow):** Swell height increases to 2.4m as the new pulse arrives. Wind shifts slightly side-shore but remains manageable. Expect larger, heavier peaks.
3. **Day 3 (Outlook):** Maximum swell peak reaches 2.8m. Period holds strong at 13 seconds. Only the outer sandbars and reef reefs will be able to handle the sheer volume.

**STRATEGIC DIRECTIVES:**
- Pack your standard shortboard for Day 1. 
- Step up your volume for Day 2 and 3 to ensure early entry into fast-moving peaks. 
- Avoid the low-tide dry-reef periods to minimize structural or physical damage.`;
        } else {
          persona = "PIRATE";
          content = `### 🌀 WEEKLY MARITIME OUTLOOK: ${beach.name.toUpperCase()}

**7-DAY STRATEGIC SECTOR OUTLOOK (${source} DEEP INTEL):**
We are looking at a highly consistent weekly window with three distinct swell systems passing through our sector. 

**SECTOR OPERATIONS TIMEFRAMES:**
- **Phase 1 (Mon - Wed):** Clean, manageable groundswell. Highly favorable light offshore winds. Solid mid-morning tide windows for classic styling and logger sessions.
- **Phase 2 (Thu - Fri):** A heavy storm swell surges into the bay. Wave heights will exceed 3 meters. Period jumps to 14 seconds. Intense currents and heavy rip systems will be active near the rocky headlands. Focus on sheltered bays if comfort levels are exceeded.
- **Phase 3 (Sat - Sun):** Swell begins to cleanly decay into a highly refined and organized groundswell. Winds shift to light southeasterlies, grooming the wrapping wave faces.

**PIONEER RULES:**
Stay vigilant near the rocky channels. Double check all safety gear. Contribute your surf logs back to the Tide Raider pool after each session to secure the sector.`;
        }

        await prisma.intelligenceReport.create({
          data: {
            beachId,
            userId,
            date: targetDate,
            persona,
            content,
            duration,
            category: "GENERAL",
            source
          }
        });
      }
    }
    console.log(`✅ Completed all reports (durations 1, 3, 7 across all sources) for ${beach.name}`);
  }

  console.log("🎉 Seeding complete! All simulated briefings are active in the database.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
