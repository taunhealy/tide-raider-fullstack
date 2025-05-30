"use client";

import { Ad } from "@/app/types/ads";
import { AD_CATEGORIES } from "@/app/lib/advertising/constants";
import { format } from "date-fns";
import DeleteAdButton from "./DeleteAdButton";

interface AdCardProps {
  ad: Ad & {
    adRequest?: any;
  };
}

export function AdCard({ ad }: AdCardProps) {
  const category = AD_CATEGORIES[ad.category as keyof typeof AD_CATEGORIES];

  return (
    <div className="relative">
      {ad.imageUrl ? (
        <div className="aspect-video bg-gray-100 relative overflow-hidden">
          <img
            src={ad.imageUrl}
            alt={ad.title || ad.companyName}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="aspect-video bg-gradient-to-r from-blue-500 to-black flex items-center justify-center">
          <span className="text-white font-bold text-xl">{ad.companyName}</span>
        </div>
      )}

      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-bold text-lg truncate">
              {ad.title || ad.companyName}
            </h3>
            <p className="text-sm text-gray-500 mb-2">
              {category?.label || ad.category} ·{" "}
              {ad.region?.name ||
                ad.regionId.charAt(0).toUpperCase() +
                  ad.regionId.slice(1).toLowerCase()}
            </p>
          </div>
          <span className="bg-blue-100 text-black text-xs px-2 py-1 rounded">
            {ad.regionId}
          </span>
        </div>

        <div className="mt-2 text-sm text-gray-600">
          <p>
            <span className="font-medium">Active until:</span>{" "}
            {format(new Date(ad.endDate), "MMM d, yyyy")}
          </p>
          <p className="truncate">
            <span className="font-medium">Link:</span>{" "}
            <a
              href={ad.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-black hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {ad.linkUrl}
            </a>
          </p>
        </div>

        {ad.targetedBeaches && ad.targetedBeaches.length > 0 && (
          <div className="mt-3">
            <span className="text-xs font-medium text-gray-500">
              Targeted beaches:
            </span>
            <div className="flex flex-wrap gap-1 mt-1">
              {ad.targetedBeaches.map((beach) => (
                <span
                  key={beach}
                  className="text-xs bg-gray-100 px-2 py-1 rounded"
                >
                  {beach}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mt-4">
          <span className="text-sm font-medium">{ad.category}</span>
          <DeleteAdButton adId={ad.id} />
        </div>
      </div>
    </div>
  );
}
