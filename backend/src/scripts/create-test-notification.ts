import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createTestNotification() {
  const userId = 'cmn4owtab0000s60f0dosfbck';
  
  console.log(`🚀 Creating test notification for user ${userId}...`);

  const notification = await prisma.notification.create({
    data: {
      userId: userId,
      type: 'ALERT',
      title: 'Strategic Intel: Inner Kom is Firing!',
      message: 'Sensors detect a massive swell sync at Inner Kom. Strategic window locks in 2 hours.',
      read: false,
    }
  });

  console.log(`✅ Success! Notification created: ${notification.id}`);
}

createTestNotification()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
