import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load environment overrides
const envLocalPath = path.join(__dirname, '../.env.local');
const envPath = path.join(__dirname, '../.env');
if (fs.existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
} else {
  dotenv.config({ path: envPath });
}

import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('🚑 Starting Tide Raider data restoration process...');

  const logBackupPath = path.join(__dirname, 'backup_log_entries.json');
  const wcBackupPath = path.join(__dirname, 'backup_western_cape_2_months.json');

  // Verify backup files exist
  if (!fs.existsSync(logBackupPath)) {
    console.error('❌ Log backup file not found at:', logBackupPath);
    return;
  }
  if (!fs.existsSync(wcBackupPath)) {
    console.error('❌ Western Cape backup file not found at:', wcBackupPath);
    return;
  }

  try {
    const logs = JSON.parse(fs.readFileSync(logBackupPath, 'utf8'));
    const wcData = JSON.parse(fs.readFileSync(wcBackupPath, 'utf8'));

    console.log(`📦 Loaded ${logs.length} logs from backup.`);
    console.log(`📦 Loaded ${wcData.forecasts.length} forecasts and ${wcData.scores.length} daily scores from backup.`);

    // 1. Ensure referenced users exist
    console.log('👤 Checking referenced users...');
    const uniqueUserIds = Array.from(new Set(logs.map((log: any) => log.userId).filter(Boolean)));
    
    for (const userId of uniqueUserIds) {
      const userExists = await prisma.user.findUnique({
        where: { id: userId as string }
      });

      if (!userExists) {
        console.log(`👤 Creating placeholder user for ID: ${userId}`);
        await prisma.user.create({
          data: {
            id: userId as string,
            name: 'Recovered User',
            email: `recovered.${userId}@tideraider.com`,
          }
        });
      }
    }
    console.log('✅ All referenced users verified.');

    // 2. Restore Forecasts
    console.log('🌊 Restoring Forecasts...');
    let forecastCount = 0;
    for (const f of wcData.forecasts) {
      try {
        await prisma.forecast.upsert({
          where: { id: f.id },
          update: {},
          create: {
            id: f.id,
            date: new Date(f.date),
            timeSlot: f.timeSlot,
            regionId: f.regionId,
            source: f.source,
            windSpeed: f.windSpeed,
            windDirection: f.windDirection,
            swellHeight: f.swellHeight,
            swellPeriod: f.swellPeriod,
            swellDirection: f.swellDirection,
            swellHeight2: f.swellHeight2,
            swellPeriod2: f.swellPeriod2,
            swellDirection2: f.swellDirection2,
            swellHeight3: f.swellHeight3,
            swellPeriod3: f.swellPeriod3,
            swellDirection3: f.swellDirection3,
            swellEnergy: f.swellEnergy,
            trend: f.trend,
            tide: f.tide,
          }
        });
        forecastCount++;
      } catch (err: any) {
        console.warn(`⚠️ Skipped forecast ${f.id}:`, err.message);
      }
    }
    console.log(`✅ Restored ${forecastCount} forecasts.`);

    // 3. Restore Daily Scores
    console.log('⭐ Restoring Beach Daily Scores...');
    let scoreCount = 0;
    for (const s of wcData.scores) {
      try {
        // Verify beach exists before inserting score to prevent FK failure
        const beachExists = await prisma.beach.findUnique({ where: { id: s.beachId } });
        if (!beachExists) continue;

        await prisma.beachDailyScore.upsert({
          where: {
            beachId_date_source_timeSlot_category: {
              beachId: s.beachId,
              date: new Date(s.date),
              source: s.source,
              timeSlot: s.timeSlot,
              category: s.category,
            }
          },
          update: {},
          create: {
            id: s.id,
            beachId: s.beachId,
            regionId: s.regionId,
            category: s.category,
            score: s.score,
            conditions: s.conditions,
            date: new Date(s.date),
            timeSlot: s.timeSlot,
            starRating: s.starRating,
            source: s.source,
          }
        });
        scoreCount++;
      } catch (err: any) {
        console.warn(`⚠️ Skipped score ${s.id}:`, err.message);
      }
    }
    console.log(`✅ Restored ${scoreCount} daily scores.`);

    // 4. Restore Log Entries
    console.log('📝 Restoring Log Entries...');
    let logCount = 0;
    for (const log of logs) {
      try {
        // Verify beach and region exist
        const beachExists = log.beachId ? await prisma.beach.findUnique({ where: { id: log.beachId } }) : null;
        const regionExists = await prisma.region.findUnique({ where: { id: log.regionId } });

        if (log.beachId && !beachExists) {
          console.warn(`⚠️ Skipped log ${log.id}: Beach ${log.beachId} does not exist in seed`);
          continue;
        }
        if (!regionExists) {
          console.warn(`⚠️ Skipped log ${log.id}: Region ${log.regionId} does not exist in seed`);
          continue;
        }

        // Verify if forecastId exists in DB before linking, otherwise set to null and let recovery heal it
        let linkedForecastId = log.forecastId;
        if (log.forecastId) {
          const forecastExists = await prisma.forecast.findUnique({ where: { id: log.forecastId } });
          if (!forecastExists) {
            linkedForecastId = null;
          }
        }

        await prisma.logEntry.upsert({
          where: { id: log.id },
          update: {},
          create: {
            id: log.id,
            date: new Date(log.date),
            surferName: log.surferName,
            surferEmail: log.surferEmail,
            beachName: log.beachName,
            surferRating: log.surferRating,
            comments: log.comments,
            imageUrl: log.imageUrl,
            videoUrl: log.videoUrl,
            videoPlatform: log.videoPlatform,
            isPrivate: log.isPrivate,
            isAnonymous: log.isAnonymous,
            waveType: log.waveType,
            beachId: log.beachId,
            userId: log.userId,
            regionId: log.regionId,
            category: log.category,
            forecastId: linkedForecastId,
            forecastSnapshot: log.forecastSnapshot,
            videoUrls: log.videoUrls,
            imageUrls: log.imageUrls,
            hiddenGemId: log.hiddenGemId,
            surfTimeSlot: log.surfTimeSlot,
            mostAccurateSource: log.mostAccurateSource,
          }
        });
        logCount++;
      } catch (err: any) {
        console.warn(`⚠️ Skipped log ${log.id}:`, err.message);
      }
    }
    console.log(`✅ Restored ${logCount} log entries.`);

    console.log('🎉 Restoration finished successfully!');
  } catch (error) {
    console.error('❌ Restoration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
