import { EnsembleService } from '../src/services/ensembleService';
import { prisma } from '../src/lib/prisma';
import { TimeSlot } from '@prisma/client';

async function updateEnsemble() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const slots: TimeSlot[] = ["MORNING", "NOON", "EVENING"];
  
  for (const slot of slots) {
    console.log(`Updating ensemble for ${slot}...`);
    await EnsembleService.updateEnsembleForecast('western-cape', today, slot);
  }
  console.log('✅ Ensemble update complete.');
}

updateEnsemble().catch(console.error).finally(() => prisma.$disconnect());
