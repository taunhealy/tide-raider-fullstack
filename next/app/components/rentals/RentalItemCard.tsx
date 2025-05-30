"use client";

import Link from "next/link";
import Image from "next/image";
import { RentalItemWithRelations } from "@/app/types/rentals";

interface RentalItemCardProps {
  item: RentalItemWithRelations;
}

export function RentalItemCard({ item }: RentalItemCardProps) {
  // Format the item type for display
  const formatItemType = (type: string) => {
    return type.charAt(0) + type.slice(1).toLowerCase();
  };

  // Get the specifications based on item type
  const getSpecDetails = () => {
    const specs = item.specifications as any;

    switch (item.itemType) {
      case "SURFBOARD":
        return (
          <>
            <p className="text-sm font-primary">
              {specs.type?.replace("_", " ")} • {specs.length}"
            </p>
            <p className="text-sm font-primary">
              {specs.finSetup?.replace("_", " ")} fin setup
            </p>
          </>
        );
      case "WETSUIT":
        return (
          <>
            <p className="text-sm font-primary">
              {specs.thickness}mm • {specs.size}
            </p>
            <p className="text-sm font-primary">
              {specs.style?.replace("_", " ")} style
            </p>
          </>
        );
      case "BODYBOARD":
        return (
          <>
            <p className="text-sm font-primary">
              {specs.length}" • {specs.core} core
            </p>
            <p className="text-sm font-primary">
              {specs.tailShape?.replace("_", " ")} tail
            </p>
          </>
        );
      case "STAND_UP_PADDLE":
        return (
          <>
            <p className="text-sm font-primary">
              {specs.type?.replace("_", " ")} • {specs.length}"
            </p>
            <p className="text-sm font-primary">
              {specs.width}" wide •{" "}
              {specs.paddleIncluded ? "Paddle included" : "No paddle"}
            </p>
          </>
        );
      case "KAYAK":
        return (
          <>
            <p className="text-sm font-primary">
              {specs.type?.replace("_", " ")} • {specs.length}ft
            </p>
            <p className="text-sm font-primary">
              {specs.material} • {specs.paddlesIncluded}{" "}
              {specs.paddlesIncluded === 1 ? "paddle" : "paddles"}
            </p>
          </>
        );
      case "FOIL":
        return (
          <>
            <p className="text-sm font-primary">
              {specs.type?.replace("_", " ")} • {specs.mastLength}cm mast
            </p>
            <p className="text-sm font-primary">
              {specs.material} •{" "}
              {specs.boardIncluded ? "Board included" : "No board"}
            </p>
          </>
        );
      case "MOTORBIKE":
        return (
          <>
            <p className="text-sm font-primary">
              {specs.make} {specs.model}
            </p>
            <p className="text-sm font-primary">
              {specs.year} • {specs.engineSize}cc
            </p>
          </>
        );
      case "SCOOTER":
        return (
          <>
            <p className="text-sm font-primary">
              {specs.make} {specs.model}
            </p>
            <p className="text-sm font-primary">
              {specs.year} • {specs.maxSpeed}km/h max
            </p>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <Link href={`/rentals/${item.id}`} className="block">
      <div className="border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition">
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
          <div className="absolute top-2 left-2 bg-white text-black px-2 py-1 rounded-full text-xs shadow-sm">
            {formatItemType(item.itemType)}
          </div>
        </div>

        <div className="p-4">
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-lg truncate">{item.name}</h3>
            <p className="font-semibold text-black">${item.rentPrice}</p>
          </div>

          <div className="mt-1 text-gray-600">{getSpecDetails()}</div>

          <div className="flex flex-col mt-3 items-left text-sm text-gray-500">
            <span className="truncate">
              {item.availableBeaches.length > 0
                ? `Available at ${item.availableBeaches.length} location${item.availableBeaches.length > 1 ? "s" : ""}`
                : "No pickup locations"}
            </span>
            <span className="truncate">
              <p>2 weeks rental package</p>
            </span>
          </div>

          <div className="mt-3 pt-3 border-t border-gray-200 flex items-center">
            {item.user.image && (
              <Image
                src={item.user.image}
                alt={item.user.name}
                width={24}
                height={24}
                className="rounded-full mr-2"
              />
            )}
            <span className="text-sm text-gray-600">
              Listed by {item.user.name}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
