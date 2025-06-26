// app/components/RegionFilter.tsx
import type { Region } from "@/app/types/region";

interface RegionFilterProps {
  regions: Region[];
  selectedRegions: string[];
  onChange: (regions: string[]) => void;
}

export function RegionFilter({
  selectedRegions,
  onChange,
  regions,
}: RegionFilterProps) {
  return (
    <div className="p-4">
      {regions.map((region) => (
        <label key={region.id} className="flex items-center p-2">
          <input
            type="checkbox"
            checked={selectedRegions.includes(region.id)}
            onChange={() => {
              const newRegions = selectedRegions.includes(region.id)
                ? selectedRegions.filter((id) => id !== region.id)
                : [...selectedRegions, region.id];
              onChange(newRegions);
            }}
            className="mr-3"
          />
          <span>{region.name}</span>
          <span className="text-gray-500 text-sm ml-2">
            ({region.country?.name})
          </span>
        </label>
      ))}
    </div>
  );
}
