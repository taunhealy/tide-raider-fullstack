"use client";

import { cn } from "@/app/lib/utils";
import { RentalItemWithRelations } from "@/app/types/rentals";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useBeach } from "@/app/context/BeachContext";
import { useBeachAttributes } from "@/app/hooks/useBeachAttributes";

export type LocationFilterType = {
  continent: string | null;
  country: string | null;
  region: string | null;
  beach: string | null;
};

interface LocationFilterProps {
  locationFilters: LocationFilterType;
  onLocationFilterChange: (
    type: keyof LocationFilterType,
    value: string | null
  ) => void;
  initialRentalItems: RentalItemWithRelations[];
  onClearFilters: () => void;
  hasOtherActiveFilters: boolean;
}

export function LocationFilter({
  locationFilters,
  onLocationFilterChange,
  initialRentalItems,
  onClearFilters,
  hasOtherActiveFilters,
}: LocationFilterProps) {
  const [uniqueContinents, setUniqueContinents] = useState<string[]>([]);
  const [uniqueCountries, setUniqueCountries] = useState<string[]>([]);
  const [uniqueRegions, setUniqueRegions] = useState<string[]>([]);
  const [uniqueBeaches, setUniqueBeaches] = useState<string[]>([]);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { filters, setFilters } = useBeach();
  const { beaches } = useBeach();
  const { uniqueRegions: beachUniqueRegions } = useBeachAttributes(beaches);

  useEffect(() => {
    // Extract unique location data from filtered items only
    const continents = new Set<string>();
    const countries = new Set<string>();
    const regions = new Set<string>();
    const beaches = new Set<string>();

    // Only process locations if there are rental items available
    if (initialRentalItems.length > 0) {
      initialRentalItems.forEach((item) => {
        item.availableBeaches.forEach((ab) => {
          // Check if beach.region exists and has the required properties
          if (ab.beach && ab.beach.region) {
            if (ab.beach.region.continent) {
              continents.add(ab.beach.region.continent);
            }
            if (ab.beach.region.country) {
              countries.add(ab.beach.region.country);
            }
            if (ab.beach.region.name) {
              regions.add(ab.beach.region.name);
            }
          }

          // Add beach name
          if (ab.beach && ab.beach.name) {
            beaches.add(ab.beach.name);
          }
        });
      });
    }

    console.log("Countries found:", Array.from(countries)); // Debug output
    console.log("Regions found:", Array.from(regions));
    console.log(
      "Sample item structure:",
      initialRentalItems.length > 0
        ? JSON.stringify(initialRentalItems[0].availableBeaches[0], null, 2)
        : "No items"
    );

    // Convert sets to sorted arrays
    setUniqueContinents(Array.from(continents).sort());
    setUniqueCountries(Array.from(countries).sort());
    setUniqueRegions(Array.from(regions).sort());
    setUniqueBeaches(Array.from(beaches).sort());
  }, [initialRentalItems]);

  // Update URL when filters change
  useEffect(() => {
    // Create a new URLSearchParams instance
    const params = new URLSearchParams(searchParams);

    // Update the parameters
    Object.entries(locationFilters).forEach(([key, value]) => {
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
    });

    // Use Next.js router to update URL
    router.push(`${pathname}?${params}`, { scroll: false });
  }, [locationFilters, router, pathname, searchParams]);

  const hasActiveFilters =
    Object.values(locationFilters).some((value) => value !== null) ||
    hasOtherActiveFilters;

  // Check if we should show the "No rental items" message
  const showNoItemsMessage =
    hasOtherActiveFilters && initialRentalItems.length === 0;

  const selectRegion = (regionName: string) => {
    try {
      const currentLocation = filters?.location || {
        region: "",
        regionId: "",
        country: "",
        continent: "",
      };
      const newLocation = {
        ...currentLocation,
        region: currentLocation.region === regionName ? "" : regionName,
      };
      setFilters({ ...filters, location: newLocation });
    } catch (error) {
      console.error("Error selecting region:", error);
      setFilters({
        ...filters,
        location: { region: "", regionId: "", country: "", continent: "" },
      });
    }
  };

  return (
    <div className="mb-6 space-y-4">
      {/* Section Title */}
      <h2 className="text-lg font-semibold font-primary">Filter by Location</h2>

      {showNoItemsMessage ? (
        <p className="text-sm text-gray-500 font-primary">
          No location filters available with current selection.
        </p>
      ) : (
        <>
          {/* Only show location filters if we have items and locations */}
          {initialRentalItems.length > 0 && (
            <>
              {/* Continent Filter - Only show if there are valid continents */}
              {uniqueContinents.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2 font-primary">
                    Continent
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {uniqueContinents.map((continent) => (
                      <button
                        key={continent}
                        onClick={() =>
                          onLocationFilterChange(
                            "continent",
                            locationFilters.continent === continent
                              ? null
                              : continent
                          )
                        }
                        className={cn(
                          "px-4 py-2 rounded-full text-sm font-medium transition-colors font-primary",
                          locationFilters.continent === continent
                            ? "btn-filter-active"
                            : "btn-filter-inactive"
                        )}
                      >
                        {continent}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Country Filter - Show only if continent is selected or if there are countries */}
              {(locationFilters.continent ||
                (!locationFilters.continent && uniqueCountries.length > 0)) && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2 font-primary">
                    Country
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {uniqueCountries
                      .filter(
                        (country) =>
                          !locationFilters.continent ||
                          initialRentalItems.some((item) =>
                            item.availableBeaches.some(
                              (ab) =>
                                ab.beach.region.continent ===
                                  locationFilters.continent &&
                                ab.beach.region.country === country
                            )
                          )
                      )
                      .map((country) => (
                        <button
                          key={country}
                          onClick={() =>
                            onLocationFilterChange(
                              "country",
                              locationFilters.country === country
                                ? null
                                : country
                            )
                          }
                          className={cn(
                            "px-4 py-2 rounded-full text-sm font-medium transition-colors font-primary",
                            locationFilters.country === country
                              ? "btn-filter-active"
                              : "btn-filter-inactive"
                          )}
                        >
                          {country}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Region Filter */}
              {uniqueRegions.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2 font-primary">
                    Region
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {uniqueRegions
                      .filter(
                        (region) =>
                          (!locationFilters.continent &&
                            !locationFilters.country) ||
                          initialRentalItems.some((item) =>
                            item.availableBeaches.some(
                              (ab) =>
                                (!locationFilters.continent ||
                                  ab.beach.region.continent ===
                                    locationFilters.continent) &&
                                (!locationFilters.country ||
                                  ab.beach.region.country ===
                                    locationFilters.country) &&
                                ab.beach.region.name === region
                            )
                          )
                      )
                      .map((region) => (
                        <button
                          key={region}
                          onClick={() => selectRegion(region)}
                          className={cn(
                            "px-4 py-2 rounded-full text-sm font-medium transition-colors font-primary",
                            locationFilters.region === region
                              ? "btn-filter-active"
                              : "btn-filter-inactive"
                          )}
                        >
                          {region}
                        </button>
                      ))}
                  </div>
                </div>
              )}

              {/* Beach Filter - Show only if region is selected or if there are beaches */}
              {(locationFilters.region ||
                (!locationFilters.region && uniqueBeaches.length > 0)) && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2 font-primary">
                    Beach
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {uniqueBeaches
                      .filter(
                        (beach) =>
                          !locationFilters.region ||
                          initialRentalItems.some((item) =>
                            item.availableBeaches.some(
                              (ab) =>
                                ab.beach.region.name ===
                                  locationFilters.region &&
                                ab.beach.name === beach
                            )
                          )
                      )
                      .map((beach) => (
                        <button
                          key={beach}
                          onClick={() =>
                            onLocationFilterChange(
                              "beach",
                              locationFilters.beach === beach ? null : beach
                            )
                          }
                          className={cn(
                            "px-4 py-2 rounded-full text-sm font-medium transition-colors font-primary",
                            locationFilters.beach === beach
                              ? "btn-filter-active"
                              : "btn-filter-inactive"
                          )}
                        >
                          {beach}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Clear Filters button - only show if any filter is active */}
      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="btn-filter-active text-[14px]"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}
