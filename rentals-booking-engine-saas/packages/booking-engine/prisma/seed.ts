import { PrismaClient, ListingCategory, ListingStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Clean existing data (optional - comment out if you want to preserve data)
  console.log("🗑️  Cleaning existing data...");
  await prisma.auditLog.deleteMany();
  await prisma.review.deleteMany();
  await prisma.webhookEvent.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.pricingRule.deleteMany();
  await prisma.listingImage.deleteMany();
  await prisma.listing.deleteMany();
  await prisma.companySettings.deleteMany();
  await prisma.company.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // Create test users
  console.log("👤 Creating test users...");
  const owner1 = await prisma.user.create({
    data: {
      email: "owner1@example.com",
      name: "John Supercar Owner",
      emailVerified: new Date(),
    },
  });

  const owner2 = await prisma.user.create({
    data: {
      email: "owner2@example.com",
      name: "Sarah Yacht Rentals",
      emailVerified: new Date(),
    },
  });

  const customer1 = await prisma.user.create({
    data: {
      email: "customer@example.com",
      name: "Mike Customer",
      emailVerified: new Date(),
    },
  });

  // Create companies (tenants)
  console.log("🏢 Creating rental companies...");
  const supercarCompany = await prisma.company.create({
    data: {
      name: "Cape Town Supercars",
      slug: "cape-town-supercars",
      description:
        "Premium supercar rentals in Cape Town. Experience the thrill of driving exotic vehicles.",
      email: "info@capetownsupercars.co.za",
      phone: "+27 21 123 4567",
      website: "https://capetownsupercars.co.za",
      city: "Cape Town",
      province: "Western Cape",
      ownerId: owner1.id,
      settings: {
        create: {
          currency: "ZAR",
          taxRate: 0.15,
          depositPercentage: 0.3,
          cancellationPolicyDays: 7,
          autoApproveBookings: false,
          enableDynamicPricing: true,
          paypalMode: "sandbox",
          // Note: PayPal credentials should be encrypted in production
          // This is just for seeding - in real app, use the admin dashboard
        },
      },
    },
    include: {
      settings: true,
    },
  });

  const yachtCompany = await prisma.company.create({
    data: {
      name: "Luxury Yacht Charters SA",
      slug: "luxury-yacht-charters-sa",
      description:
        "Exclusive yacht charters along the South African coastline.",
      email: "bookings@yachtcharters.co.za",
      phone: "+27 21 987 6543",
      city: "Durban",
      province: "KwaZulu-Natal",
      ownerId: owner2.id,
      settings: {
        create: {
          currency: "ZAR",
          taxRate: 0.15,
          depositPercentage: 0.5,
          cancellationPolicyDays: 14,
          autoApproveBookings: true,
        },
      },
    },
  });

  // Create listings
  console.log("🚗 Creating listings...");
  const listing1 = await prisma.listing.create({
    data: {
      companyId: supercarCompany.id,
      title: "Lamborghini Huracán EVO",
      slug: "lamborghini-huracan-evo",
      description:
        "Experience pure adrenaline with this 631hp Italian masterpiece. Perfect for special occasions or unforgettable weekend drives.",
      category: ListingCategory.SUPERCAR,
      status: ListingStatus.ACTIVE,
      basePricePerDay: 8500,
      weeklyDiscount: 0.15,
      monthlyDiscount: 0.25,
      securityDeposit: 50000,
      cleaningFee: 500,
      insurancePerDay: 1200,
      minRentalDays: 1,
      maxRentalDays: 7,
      advanceNoticeDays: 3,

      pickupLocations: {
        create: {
          isPrimary: true,
          location: {
            create: {
              companyId: supercarCompany.id,
              name: "Cape Town CBD",
              address: "123 Main St, Cape Town",
              city: "Cape Town",
              province: "Western Cape",
              latitude: -33.9249,
              longitude: 18.4241,
            }
          }
        }
      },
      latitude: -33.9249,
      longitude: 18.4241,
      specifications: {
        make: "Lamborghini",
        model: "Huracán EVO",
        year: 2023,
        seats: 2,
        transmission: "7-speed dual-clutch",
        horsepower: 631,
        topSpeed: "325 km/h",
        acceleration: "2.9s (0-100km/h)",
      },
      features: [
        "Carbon fiber interior",
        "Launch control",
        "Magnetic ride suspension",
        "Apple CarPlay",
        "Rear camera",
        "Premium sound system",
      ],
      addOns: [
        { name: "Professional photoshoot", price: 2500 },
        { name: "Track day experience", price: 5000 },
        { name: "Extra driver", price: 500 },
      ],
      images: {
        create: [
          {
            url: "https://example.com/lamborghini-1.jpg",
            altText: "Lamborghini Huracán EVO front view",
            order: 1,
          },
          {
            url: "https://example.com/lamborghini-2.jpg",
            altText: "Lamborghini Huracán EVO interior",
            order: 2,
          },
        ],
      },
      pricingRules: {
        create: [
          {
            name: "Sunny Day Premium",
            type: "WEATHER_SUNNY",
            multiplier: 1.15,
            priority: 1,
            isActive: true,
            minTemperature: 20,
          },
        ],
      },
    },
  });

  const listing2 = await prisma.listing.create({
    data: {
      companyId: yachtCompany.id,
      title: "Luxury 60ft Motor Yacht",
      slug: "luxury-60ft-motor-yacht",
      description:
        "Sail the beautiful KwaZulu-Natal coastline in style. Perfect for sunset cruises, corporate events, or romantic getaways.",
      category: ListingCategory.YACHT,
      status: ListingStatus.ACTIVE,
      basePricePerDay: 25000,
      weeklyDiscount: 0.2,
      securityDeposit: 100000,
      cleaningFee: 2000,
      minRentalDays: 1,
      maxRentalDays: 14,
      advanceNoticeDays: 7,

      pickupLocations: {
        create: {
          isPrimary: true,
          location: {
            create: {
              companyId: yachtCompany.id,
              name: "Durban Marina",
              address: "1 Marina Drive, Durban",
              city: "Durban",
              province: "KwaZulu-Natal",
            }
          }
        }
      },
      specifications: {
        length: "60 feet",
        cabins: 3,
        bathrooms: 2,
        capacity: 12,
        crew: "Captain + Deck Hand",
      },
      features: [
        "Full kitchen",
        "BBQ deck",
        "Swim platform",
        "Sound system",
        "Air conditioning",
        "Snorkeling gear",
      ],
      addOns: [
        { name: "Catering package", price: 3000 },
        { name: "Extra crew member", price: 1500 },
        { name: "Fishing equipment", price: 800 },
      ],
    },
  });

  console.log("✅ Database seeded successfully!");
  console.log(`   - Created ${2} companies`);
  console.log(`   - Created ${3} users`);
  console.log(`   - Created ${2} listings`);
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

