// app/components/BeachFilter.tsx
import { useState } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/app/lib/utils";
import type { Beach } from "@/app/types/beaches";

interface BeachFilterProps {
  selectedBeaches: string[];
  onChange: (beaches: string[]) => void;
  beaches: Beach[];
}

export function BeachFilter({
  selectedBeaches,
  onChange,
  beaches,
}: BeachFilterProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBeaches = beaches.filter((beach) =>
    beach.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleBeach = (beachId: string) => {
    const newSelected = selectedBeaches.includes(beachId)
      ? selectedBeaches.filter((id) => id !== beachId)
      : [...selectedBeaches, beachId];
    onChange(newSelected);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search beaches..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="max-h-[240px] overflow-y-auto space-y-1">
        {filteredBeaches.map((beach) => (
          <label
            key={beach.id}
            className={cn(
              "flex items-center p-2 rounded-md cursor-pointer hover:bg-gray-50",
              selectedBeaches.includes(beach.id) &&
                "bg-blue-50 hover:bg-blue-100"
            )}
          >
            <input
              type="checkbox"
              checked={selectedBeaches.includes(beach.id)}
              onChange={() => handleToggleBeach(beach.id)}
              className="mr-3"
            />
            <span className="flex-1 text-sm">{beach.name}</span>
            {beach.region?.name && (
              <span className="text-xs text-gray-500">{beach.region.name}</span>
            )}
          </label>
        ))}

        {filteredBeaches.length === 0 && (
          <div className="text-center py-4 text-gray-500">No beaches found</div>
        )}
      </div>

      {selectedBeaches.length > 0 && (
        <div className="pt-2 border-t">
          <button
            onClick={() => onChange([])}
            className="text-sm text-red-600 hover:text-red-700"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
