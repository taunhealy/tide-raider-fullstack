"use client";

import { FILTERS } from "@/app/config/filters";
import { useBeachFilters } from "@/app/hooks/useBeachFilters";
import { useRouter, usePathname } from "next/navigation";

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  
}

export default function FilterSidebar({ isOpen, onClose }: FilterSidebarProps) {
  const { filters, updateFilter } = useBeachFilters();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? "" : "hidden"}`}>
      <div className="fixed inset-y-0 right-0 w-80 z-50 bg-white shadow-lg transform">
        <div className="bg-white p-4 sm:p-6 overflow-y-auto h-full">
          <div className="space-y-6">
            {FILTERS.map((filter) => (
              <div key={filter.key} className="space-y-2">
                <h6 className="heading-6 font-primary">{filter.label}</h6>
                {filter.type === "array" && (
                  <div className="flex flex-wrap gap-2">
                    {filter.options?.map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          const currentValue = filters[filter.key] as string[];
                          const updated = currentValue.includes(option)
                            ? currentValue.filter((v) => v !== option)
                            : [...currentValue, option];
                          updateFilter(filter.urlParam, updated);
                        }}
                        className={`px-3 py-1 rounded-full text-sm font-primary ${
                          (filters[filter.key] as string[]).includes(option)
                            ? "bg-cyan-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                )}
                {filter.type === "boolean" && (
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters[filter.key] as boolean}
                      onChange={(e) => {
                        updateFilter(
                          filter.urlParam,
                          e.target.checked ? "true" : ""
                        );
                      }}
                      className="h-4 w-4 text-cyan-600 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-700 font-primary">
                      {filter.label}
                    </span>
                  </label>
                )}
              </div>
            ))}

            <div className="space-y-2">
              <button
                onClick={() => router.push(pathname)}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors font-primary"
              >
                Clear All Filters
              </button>
              <button
                onClick={onClose}
                className="w-full px-4 py-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-700 transition-colors font-primary"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
