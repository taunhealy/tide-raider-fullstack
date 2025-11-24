import { prisma } from '../app/lib/prisma';

async function checkSubscription() {
  try {
    // Get all users and their subscription status
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        subscriptionStatus: true,
        hasActiveTrial: true,
        trialEndDate: true,
      },
    });

    console.log('\n=== User Subscription Status ===\n');
    users.forEach(user => {
      const isSubscribed = user.subscriptionStatus === 'ACTIVE';
      console.log(`Email: ${user.email}`);
      console.log(`Name: ${user.name}`);
      console.log(`Subscription Status: ${user.subscriptionStatus || 'NULL'}`);
      console.log(`Is Subscribed: ${isSubscribed}`);
      console.log(`Has Active Trial: ${user.hasActiveTrial}`);
      console.log(`Trial End Date: ${user.trialEndDate || 'NULL'}`);
      console.log(`---`);
    });

    console.log(`\nTotal users: ${users.length}\n`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSubscription();
