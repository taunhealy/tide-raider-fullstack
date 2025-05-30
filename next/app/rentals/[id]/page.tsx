import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/lib/authOptions";
import { prisma } from "@/app/lib/prisma";
import { RentalRequestForm } from "@/app/components/rentals/RentalRequestForm";
import { ContactOwnerButton } from "@/app/components/ContactOwnerButton";
import { SubscriptionStatus } from "@/app/types/subscription";
import { Button } from "@/app/components/ui/Button";
import { RentalImagesDisplay } from "@/app/components/rentals/RentalImagesDisplay";
import BeachLocationLinks from "@/app/components/rentals/BeachLocationLinks";
import {
  RENTAL_POLICIES,
  ITEM_CATEGORIES_EMOJI,
} from "@/app/lib/rentals/constants";

function formatItemType(itemType: string) {
  return itemType
    .replace("_", " ")
    .replace(
      /\w+/g,
      (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    );
}

export async function generateMetadata({ params }: { params: { id: string } }) {
  const rentalItem = await prisma.rentalItem.findUnique({
    where: { id: params.id },
    select: { name: true, itemType: true },
  });

  if (!rentalItem) {
    return {
      title: "Item Not Found | Surf Safari",
    };
  }

  return {
    title: `${rentalItem.name} | Surf Safari Rentals`,
    description: `Rent this ${rentalItem.itemType.toLowerCase()} for your next surf adventure`,
  };
}

export default async function RentalItemPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  const isAuthenticated = !!session?.user;

  try {
    const rentalItem = await prisma.rentalItem.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            image: true,
            email: true,
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
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!rentalItem) {
      return notFound();
    }

    // Check if user is subscribed (for rental functionality)
    let isSubscribed = false;
    let user = null;
    if (session?.user?.id) {
      user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { subscriptionStatus: true, hasActiveTrial: true },
      });
      isSubscribed =
        user?.subscriptionStatus === SubscriptionStatus.ACTIVE ||
        user?.hasActiveTrial === true;
    }

    // Format specifications based on item type
    const specs = rentalItem.specifications as any;
    let formattedSpecs: React.ReactNode = null;

    switch (rentalItem.itemType) {
      case "SURFBOARD":
        formattedSpecs = (
          <div className="space-y-2">
            <p>
              <span className="font-medium">Type:</span>{" "}
              {specs.type?.replace("_", " ")}
            </p>
            <p>
              <span className="font-medium">Length:</span> {specs.length}"
              inches
            </p>
            <p>
              <span className="font-medium">Fin Setup:</span>{" "}
              {specs.finSetup?.replace("_", " ")}
            </p>
          </div>
        );
        break;
      case "MOTORBIKE":
        formattedSpecs = (
          <div className="space-y-2">
            <p>
              <span className="font-medium">Make:</span> {specs.make}
            </p>
            <p>
              <span className="font-medium">Model:</span> {specs.model}
            </p>
            <p>
              <span className="font-medium">Year:</span> {specs.year}
            </p>
            <p>
              <span className="font-medium">Engine Size:</span>{" "}
              {specs.engineSize}cc
            </p>
          </div>
        );
        break;
      case "SCOOTER":
        formattedSpecs = (
          <div className="space-y-2">
            <p>
              <span className="font-medium">Make:</span> {specs.make}
            </p>
            <p>
              <span className="font-medium">Model:</span> {specs.model}
            </p>
            <p>
              <span className="font-medium">Year:</span> {specs.year}
            </p>
            <p>
              <span className="font-medium">Max Speed:</span> {specs.maxSpeed}
              km/h
            </p>
          </div>
        );
        break;
      case "JET_SKI":
        formattedSpecs = (
          <div className="space-y-2">
            <p>
              <span className="font-medium">Make:</span> {specs.make}
            </p>
            <p>
              <span className="font-medium">Model:</span> {specs.model}
            </p>
            <p>
              <span className="font-medium">Year:</span> {specs.year}
            </p>
            <p>
              <span className="font-medium">Horsepower:</span>{" "}
              {specs.horsepower} hp
            </p>
            <p>
              <span className="font-medium">Fuel Capacity:</span>{" "}
              {specs.fuelCapacity} L
            </p>
            <p>
              <span className="font-medium">Rider Capacity:</span>{" "}
              {specs.riderCapacity}{" "}
              {specs.riderCapacity === 1 ? "person" : "people"}
            </p>
          </div>
        );
        break;
    }

    return (
      <div className="max-w-7xl mx-auto p-6 font-primary">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Item Details - Left Column */}
          <div className="md:col-span-1 space-y-6">
            <div>
              <div
                className="flex items-center gap-2"
                role="status"
                aria-label="Item status"
              >
                <span className="bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] text-xs font-medium px-2.5 py-0.5 rounded-full">
                  {ITEM_CATEGORIES_EMOJI[
                    rentalItem.itemType as keyof typeof ITEM_CATEGORIES_EMOJI
                  ] || ""}{" "}
                  {formatItemType(rentalItem.itemType)}
                </span>
                {rentalItem.isActive ? (
                  <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    Available
                  </span>
                ) : (
                  <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    Unavailable
                  </span>
                )}
              </div>
              <h1 className="text-3xl font-bold mt-2 text-[var(--color-text-primary)]">
                {rentalItem.name}
              </h1>
              <p className="text-[16px] font-semibold text-[var(--color-secondary)] mt-2">
                ${rentalItem.rentPrice}
              </p>
              <p className="text-[var(--color-text-secondary)] text-sm">
                Per {RENTAL_POLICIES.MIN_RENTAL_WEEKS} weeks rental.
              </p>
            </div>

            {rentalItem.description && (
              <div className="border-t border-[var(--color-border-light)] pt-4">
                <h2 className="text-xl font-semibold mb-2 text-[var(--color-text-primary)]">
                  Description
                </h2>
                <p className="text-[var(--color-text-secondary)]">
                  {rentalItem.description}
                </p>
              </div>
            )}

            <div className="border-t border-[var(--color-border-light)] pt-4">
              <h2 className="text-xl font-semibold mb-2 text-[var(--color-text-primary)]">
                Specifications
              </h2>
              <div role="list" aria-label="Item specifications">
                {formattedSpecs}
              </div>
            </div>

            <div className="border-t border-[var(--color-border-light)] pt-4">
              <h2 className="text-xl font-semibold mb-2 text-[var(--color-text-primary)]">
                Available Pickup/Dropoff Locations
              </h2>
              <BeachLocationLinks
                beaches={rentalItem.availableBeaches.map((connection) => ({
                  id: connection.beach.id,
                  name: connection.beach.name,
                  region: connection.beach.region,
                }))}
              />
            </div>
          </div>

          {/* Image Gallery - Middle Column */}
          <div className="md:col-span-1">
            <RentalImagesDisplay
              thumbnail={rentalItem.thumbnail}
              images={rentalItem.images}
              itemName={rentalItem.name}
            />
          </div>

          {/* Request to Rent Section - Right Column */}
          {isAuthenticated ? (
            session.user.id !== rentalItem.user.id ? (
              isSubscribed ? (
                <div className="md:col-span-1">
                  <details className="bg-[var(--color-bg-primary)] rounded-lg border border-[var(--color-border-light)] overflow-hidden transition-all duration-300 hover:border-[var(--color-border-medium)] hover:shadow-sm">
                    <summary className="px-5 py-4 bg-[var(--color-bg-secondary)] cursor-pointer font-medium text-lg flex items-center justify-between text-[var(--color-text-primary)]">
                      Request to Rent
                      <svg
                        className="h-5 w-5 text-[var(--color-text-secondary)]"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                        role="img"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </summary>
                    <div className="p-5">
                      <RentalRequestForm
                        rentalItemId={rentalItem.id}
                        availableBeaches={rentalItem.availableBeaches.map(
                          (c) => ({
                            id: c.beach.id,
                            name: c.beach.name,
                          })
                        )}
                        itemType={rentalItem.itemType}
                      />
                    </div>
                  </details>

                  {/* Contact Owner Button */}
                  <div className="mt-4">
                    <ContactOwnerButton
                      ownerEmail={rentalItem.user.email}
                      ownerName={rentalItem.user.name}
                      isSignedIn={!!session}
                      isSubscriber={
                        user?.subscriptionStatus === SubscriptionStatus.ACTIVE
                      }
                      isTrialing={user?.hasActiveTrial}
                    />
                  </div>
                </div>
              ) : (
                <div className="md:col-span-1">
                  <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-100">
                    <p className="font-medium text-yellow-800 mb-2">
                      Subscription Required
                    </p>
                    <p className="text-sm mb-4 text-yellow-700">
                      You need an active subscription to request rentals.
                    </p>
                    <Link
                      href="/pricing"
                      className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[var(--color-tertiary)] hover:bg-[var(--color-tertiary-dark)] transition-colors"
                    >
                      View Subscription Plans
                    </Link>
                  </div>
                </div>
              )
            ) : (
              <div className="md:col-span-1">
                <div className="bg-[var(--color-bg-secondary)] p-6 rounded-lg border border-[var(--color-border-light)]">
                  <p className="mb-4 text-[var(--color-text-primary)]">
                    This is your listing. You can manage it from your dashboard.
                  </p>
                  <Link href={`/dashboard/rentals/${rentalItem.id}`}>
                    <Button variant="default" size="default">
                      Edit Listing
                    </Button>
                  </Link>
                </div>
              </div>
            )
          ) : (
            <div className="md:col-span-1">
              <div className="p-4 bg-[var(--color-bg-secondary)] rounded-lg text-center">
                <p className="mb-2">Please sign in to contact the owner.</p>
                <Link
                  href={`/login?callbackUrl=/rentals/${params.id}`}
                  className="btn-primary"
                >
                  Sign In
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error("Error loading rental item:", error);
    return (
      <div className="max-w-7xl mx-auto p-6">
        <h1 className="text-2xl font-bold text-red-500">
          Error loading rental item
        </h1>
        <p>There was a problem loading this item. Please try again later.</p>
        <Link href="/rentals" className="mt-4 btn-primary inline-block">
          Back to Rentals
        </Link>
      </div>
    );
  }
}
