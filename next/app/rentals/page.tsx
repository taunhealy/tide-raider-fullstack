import { Suspense } from "react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/lib/authOptions";
import { prisma } from "@/app/lib/prisma";
import RentalsClient from "./RentalsClient";
import { RentalItemWithRelations } from "@/app/types/rentals";
import Link from "next/link";
import { ITEM_CATEGORIES } from "@/app/lib/rentals/constants";
import { formatItemType } from "@/app/lib/formatters";

export const metadata = {
  title: "Rentals | Tide Raider",
  description:
    "Rent surfboards, motorbikes, and scooters for your surf adventure",
};

async function fetchRentalItems() {
  const rentalItems = await prisma.rentalItem.findMany({
    where: {
      isActive: true,
    },
    include: {
      user: {
        select: {
          name: true,
          image: true,
        },
      },
      availableBeaches: {
        include: {
          beach: {
            select: {
              id: true,
              name: true,
              region: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return rentalItems;
}

async function fetchRegions() {
  const regions = await prisma.region.findMany({
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return regions;
}

interface Region {
  id: string;
  name: string;
}

export default async function RentalsPage() {
  const session = await getServerSession(authOptions);
  const [rentalItems, regions] = await Promise.all([
    fetchRentalItems(),
    fetchRegions(),
  ]);

  // Format item categories for display
  const formattedItemCategories = ITEM_CATEGORIES.map((category) => {
    // Convert SNAKE_CASE to Title Case (e.g., STAND_UP_PADDLE to Stand Up Paddle)
    return {
      value: category,
      label: formatItemType(category),
    };
  });

  return (
    <div className="max-w-7xl mx-auto p-6 font-primary">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Rental Listings</h1>
        {session?.user && (
          <Link href="/rentals/new" className="btn-primary">
            Add New Rental Item
          </Link>
        )}
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <RentalsClient
          initialRentalItems={
            rentalItems as unknown as RentalItemWithRelations[]
          }
          initialRegions={regions as Region[]}
          itemCategories={formattedItemCategories}
          session={session}
        />
      </Suspense>
    </div>
  );
}
