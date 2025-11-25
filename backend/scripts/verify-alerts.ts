
import { PrismaClient } from '@prisma/client';
import { AlertService } from '../src/services/alertService';

const prisma = new PrismaClient();

async function main() {
  console.log('Verifying Alerts Setup...');

  // 1. Find a user to test with
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log('No user found to test with.');
    return;
  }

  console.log(`Testing with user: ${user.email} (${user.id})`);

  // 2. Find a region
  const region = await prisma.region.findFirst();
  if (!region) {
    console.log('No region found.');
    return;
  }

  try {
    console.log('Creating test alert with sources [WINDFINDER, WINDGURU]...');
    
    // Create alert using the service
    const alert = await AlertService.createAlert(user.id, {
      name: 'Test Alert Sources',
      regionId: region.id,
      notificationMethod: 'email',
      contactInfo: 'test@example.com',
      sources: ['WINDFINDER', 'WINDGURU'], // This is the new field
      properties: [
        { property: 'windSpeed', optimalValue: 10, range: 5 }
      ]
    });

    console.log('Alert created successfully.');
    console.log('Alert Sources:', (alert as any).sources);

    // Verify sources are saved
    if ((alert as any).sources && (alert as any).sources.includes('WINDFINDER') && (alert as any).sources.includes('WINDGURU')) {
      console.log('✅ Success: Alert has sources field saved correctly.');
    } else {
      console.error('❌ Error: Alert sources not saved or returned correctly.');
      console.log('Actual alert object:', alert);
    }

    // Clean up
    await AlertService.deleteAlert(alert.id, user.id);
    console.log('Test alert deleted.');

  } catch (error) {
    console.error('❌ Failed to create alert with sources:', error);
    if (error instanceof Error) {
        console.error('Error message:', error.message);
    }
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
