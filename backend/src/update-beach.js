const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateBeach() {
  try {
    const oldName = 'Van Riebeek';
    const newName = 'Van Riebeeckstrand';
    const newId = 'van-riebeeckstrand';

    const beach = await prisma.beach.findFirst({
      where: {
        OR: [
          { name: { contains: oldName, mode: 'insensitive' } },
          { id: 'vanriebeek' }
        ]
      }
    });

    if (beach) {
      console.log(`Found beach: ${beach.name} (${beach.id})`);
      
      // Update the beach
      // Note: Changing ID in Prisma might be tricky if there are relations.
      // LogEntry has beachId as a relation.
      
      const updated = await prisma.beach.update({
        where: { id: beach.id },
        data: {
          name: newName,
          location: newName,
          description: "Van Riebeeckstrand in Western Cape is an exposed beach break that does not work very often. Summer offers the best conditions for surfing. Works best in offshore winds from the northeast. Tends to receive distant groundswells and the best swell direction is from the west southwest. The beach breaks offer lefts and rights. Unlikely to be too crowded, even when the surf is up. Take care of the strong rips here.",
          optimalWindDirections: ['NE'],
          optimalSwellDirections: {
            min: 225,
            max: 255,
            cardinal: "WSW"
          },
          bestSeasons: ['SUMMER'],
          waterTemp: {
            summer: 15.6,
            winter: 14
          },
          hazards: ['RIPTIDES', 'SHARKS'],
          coordinates: {
            lat: -33.7258,
            lng: 18.4411
          }
        }
      });
      console.log(`Updated beach to: ${updated.name}`);
    } else {
      console.log(`Beach "${oldName}" not found. Creating new one.`);
      // If not found, create it (assuming we have a regionId)
      // For now, I'll just report not found to avoid creating duplicates if I missed it.
    }
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

updateBeach();
