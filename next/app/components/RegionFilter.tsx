"use client";

import React from "react";
import { useEffect, useState, memo, useMemo } from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { FilterButton } from "@/app/components/ui/FilterButton";
import DataLoadingProgress from "@/app/components/DataLoadingProgress";
import { useAppDispatch, useAppSelector } from "@/app/redux/hooks";
import {
  selectBeachAttributes,
  selectVisibleFilterOptions,
  selectRegions,
} from "@/app/redux/selectors";
import { updateFilter, changeRegion } from "@/app/redux/slices/filterSlice";
import RegionFilterButton from "./RegionFilterButton";
import type { Region } from "@/app/types/beaches";
import { cn } from "@/app/lib/utils";

interface SavedFilters {
  continents: string[];
  countries: string[];
  regions: string[];
}

async function saveFiltersToDb(filters: SavedFilters) {
  try {
    const response = await fetch("/api/user/filters", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(filters),
    });

    if (!response.ok) throw new Error("Failed to save filters");
    return await response.json();
  } catch (error) {
    console.error("Error saving filters:", error);
    throw error;
  }
}

interface RegionFilterProps {
  selectedRegion: string | null;
  onRegionChange: (region: string | null) => void;
}

export default function RegionFilter({
  selectedRegion,
  onRegionChange,
}: RegionFilterProps) {
  // Still get regions from Redux, but handle selection via props
  const regions = useAppSelector(selectRegions);

  return (
    <div className="space-y-3">
      <h4 className="font-medium text-[16px] text-gray-700 font-primary">
        Region
      </h4>
      <div className="flex flex-wrap gap-2">
        {regions.map((region) => (
          <button
            key={region.id}
            onClick={() =>
              onRegionChange(
                region.name === selectedRegion ? null : region.name
              )
            }
            className={cn(
              "px-3 py-1.5 rounded-full text-sm font-primary transition-colors",
              region.name === selectedRegion
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            )}
          >
            {region.name}
          </button>
        ))}
      </div>
    </div>
  );
}
