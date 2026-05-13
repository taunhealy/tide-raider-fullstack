import { prisma } from './src/lib/prisma';

async function test() {
  const regionId = 'western-cape';
  const targetDate = new Date('2026-05-13T00:00:00Z');
  const timeSlotParam = 'MORNING';
  const sourceParam = 'WINDFINDER_SUPER';
  const user = { id: 'test-user', isSubscribed: true };

  console.log('Starting test...');
  
  try {
    const whereClause = { regionId };
    const dataMappingSource = sourceParam;

    const beaches = await prisma.beach.findMany({
          where: whereClause,
          include: {
            region: true,
            conditionProfiles: {
              where: {
                category: "GENERAL"
              }
            },
            intelligenceReports: {
              orderBy: { createdAt: 'desc' as any },
              take: 1,
              select: { id: true, createdAt: true }
            },
            beachDailyScores: {
              where: {
                date: targetDate,
                source: dataMappingSource as any,
                timeSlot: timeSlotParam as any,
                category: "GENERAL" as any,
              },
              orderBy: { score: "desc" as any },
              take: 1,
              select: {
                score: true,
                conditions: true,
                date: true,
                timeSlot: true,
              },
            },
            logEntries: {
              orderBy: { date: 'desc' as any },
              take: 5,
              select: {
                id: true,
                date: true,
                userId: true,
                surferRating: true,
                comments: true,
                imageUrl: true,
                videoUrl: true,
                videoPlatform: true,
                videoUrls: true,
                surferName: true,
                forecast: true,
              }
            }
          },
        });

    console.log(`Found ${beaches.length} beaches`);

    const responseData = {
        beaches: beaches.map((beach) => {
          const { beachDailyScores, conditionProfiles, ...beachData } = beach as any;
          const profile = conditionProfiles?.[0] || {};
          
           const isPremiumUser = user?.isSubscribed;
           const isGated = beach.isHiddenGem && !isPremiumUser;

          return {
            ...beachData,
            name: isGated ? "Hidden Gem Break" : beachData.name,
            location: isGated ? "Secret Location" : beachData.location,
            optimalWindDirections: profile.optimalWindDirections || [],
            optimalSwellDirections: profile.optimalSwellDirections || { min: 0, max: 360 },
            swellSize: profile.swellSize || { min: 0, max: 10 },
            idealSwellPeriod: profile.idealSwellPeriod || { min: 0, max: 25 },
            optimalTide: profile.optimalTide || "ALL",
            hasAIReport: beach.intelligenceReports.length > 0,
            hasRecentAIReport: beach.intelligenceReports.some((r: any) => 
              new Date(r.createdAt).getTime() > Date.now() - 24 * 60 * 60 * 1000
            ),
            hasFreshIntel: beach.intelligenceReports.some((r: any) => 
              new Date(r.createdAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
            ),
            ...(isGated && {
              description: "Locked Hidden Gem - Subscribe to unlock full details and surf reports.",
              hazards: [],
              videos: [],
              coffeeShop: [],
              logEntries: (beach.logEntries || []).filter((log: any) => log.userId === user?.id),
            })
          };
        }),
      };

    console.log('Transform completed successfully');
    console.log('Sample beach:', JSON.stringify(responseData.beaches[0], null, 2).substring(0, 500));

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

test();
