"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import RippleLoader from "@/app/components/ui/RippleLoader";
import { Button } from "@/app/components/ui/Button";
import { useState } from "react";

import {
  RentalItemWithRelations,
  RentalItemType,
  SurfboardSpecifications,
} from "@/app/types/rentals";

interface UserRentalsProps {
  userId: string;
  isOwnProfile: boolean;
}

type RentalFilter = "all" | RentalItemType;

export default function UserRentals({
  userId,
  isOwnProfile,
}: UserRentalsProps) {
  const [filter, setFilter] = useState<RentalFilter>("all");

  const {
    data: rentalItems,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["userRentals", userId],
    queryFn: async () => {
      const res = await fetch(`/api/user/${userId}/rentals`);
      if (!res.ok) throw new Error("Failed to fetch rental items");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-10">
        <RippleLoader isLoading={true} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-10 font-primary">
        <p>Failed to load rental items. Please try again later.</p>
      </div>
    );
  }

  if (!rentalItems || rentalItems.length === 0) {
    return (
      <div className="text-center py-10 font-primary">
        {isOwnProfile ? (
          <div>
            <p className="mb-4">You haven't added any rental items yet.</p>
            <Link href="/rentals/new">
              <Button>Add Your First Rental Item</Button>
            </Link>
          </div>
        ) : (
          <p>This user hasn't added any rental items yet.</p>
        )}
      </div>
    );
  }

  // Get unique item types from rental items
  const availableItemTypes = rentalItems
    ? (Array.from(
        new Set(
          rentalItems.map((item: RentalItemWithRelations) => item.itemType)
        )
      ) as RentalItemType[])
    : [];

  // Filter rental items based on the selected filter
  const filteredRentals = rentalItems.filter(
    (item: RentalItemWithRelations) => {
      if (filter === "all") return true;
      return item.itemType === filter;
    }
  );

  const handleFilterChange = (value: RentalFilter) => {
    setFilter(value);
  };

  // Get the specifications based on item type
  const getSpecDetails = (item: RentalItemWithRelations) => {
    const specs = item.specifications as any;

    switch (item.itemType) {
      case "SURFBOARD":
        const surfSpecs = specs as SurfboardSpecifications;
        return (
          <>
            <p className="text-sm">
              {surfSpecs.type?.replace("_", " ")} • {surfSpecs.length}"
            </p>
            <p className="text-sm">
              {surfSpecs.finSetup?.replace("_", " ")} fin setup
            </p>
          </>
        );
      case "WETSUIT":
        return (
          <p className="text-sm">
            {specs.size} • {specs.thickness}mm
          </p>
        );
      case "BODYBOARD":
        return (
          <p className="text-sm">
            {specs.length}" • {specs.core}
          </p>
        );
      case "STAND_UP_PADDLE":
        return (
          <p className="text-sm">
            {specs.type?.replace("_", " ")} • {specs.length}" •
            {specs.paddleIncluded ? " Paddle included" : ""}
          </p>
        );
      case "KAYAK":
        return (
          <p className="text-sm">
            {specs.type?.replace("_", " ")} • {specs.length}ft •
            {specs.paddlesIncluded > 0
              ? ` ${specs.paddlesIncluded} paddle(s)`
              : ""}
          </p>
        );
      case "FOIL":
        return (
          <p className="text-sm">
            {specs.type?.replace("_", " ")} • {specs.material} •
            {specs.boardIncluded ? " Board included" : ""}
          </p>
        );
      case "SCOOTER":
        return (
          <p className="text-sm">
            {specs.type?.replace("_", " ")} • {specs.maxSpeed}mph •
            {specs.helmetIncluded ? " Helmet included" : ""}
          </p>
        );
      case "MOTORBIKE":
        return (
          <p className="text-sm">
            {specs.type?.replace("_", " ")} • {specs.engineSize}cc •
            {specs.helmetIncluded ? " Helmet included" : ""}
          </p>
        );
      default:
        return (
          <p className="text-sm">{String(item.itemType).replace("_", " ")}</p>
        );
    }
  };

  return (
    <div className="font-primary">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">
          {isOwnProfile ? "Your Rental Items" : "User's Rental Items"}
        </h2>
        {isOwnProfile && (
          <Link href="/rentals/new">
            <Button>Add New Item</Button>
          </Link>
        )}
      </div>

      {/* Only show filter buttons if there are rental items */}
      {rentalItems && rentalItems.length > 0 && (
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => handleFilterChange("all")}
              className={`rounded-full text-xs px-4 py-1.5 ${
                filter === "all" ? "btn-filter-active" : "btn-filter-inactive"
              }`}
            >
              All
            </button>
            {availableItemTypes.map((type: RentalItemType) => (
              <button
                key={String(type)}
                onClick={() => handleFilterChange(type as RentalFilter)}
                className={`rounded-full text-xs px-4 py-1.5 ${
                  filter === type ? "btn-filter-active" : "btn-filter-inactive"
                }`}
              >
                {String(type).replace("_", " ")}s
              </button>
            ))}
          </div>

          <RentalsGrid
            rentals={filteredRentals}
            getSpecDetails={getSpecDetails}
          />
        </div>
      )}
    </div>
  );
}

function RentalsGrid({
  rentals,
  getSpecDetails,
}: {
  rentals: RentalItemWithRelations[];
  getSpecDetails: (item: RentalItemWithRelations) => React.ReactNode;
}) {
  if (rentals.length === 0) {
    return (
      <div className="text-center py-8 font-primary">
        <p>No rental items found for this filter.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {rentals.map((item) => (
        <Link
          key={item.id}
          href={`/rentals/${item.id}`}
          className="border rounded-lg overflow-hidden hover:shadow-md transition duration-200"
        >
          <div className="relative h-48 bg-gray-100">
            {item.thumbnail ? (
              <Image
                src={item.thumbnail}
                alt={item.name}
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                className="object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full bg-gray-200">
                <span className="text-gray-400">No image</span>
              </div>
            )}
          </div>
          <div className="p-4">
            <div className="flex justify-between items-start">
              <h3 className="font-medium text-lg truncate">{item.name}</h3>
              <span className="text-sm font-semibold">${item.rentPrice}</span>
            </div>
            <div className="mt-2 text-gray-600">
              {item.specifications && getSpecDetails(item)}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
