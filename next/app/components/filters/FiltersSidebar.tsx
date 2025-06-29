"use client";

import { FILTERS } from "@/app/config/filters";
import { useBeachFilters } from "@/app/hooks/useBeachFilters";
import { useRouter, usePathname } from "next/navigation";
import { useRef, useEffect } from "react";

// Custom hook for handling clicks outside an element
function useClickOutside(
  ref: React.RefObject<HTMLElement>,
  handler: () => void,
  isActive: boolean
) {
  useEffect(() => {
    if (!isActive) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler();
      }
    };

    // Use React's way of adding event listeners
    window.addEventListener("mousedown", handleClickOutside);

    // Clean up
    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, [ref, handler, isActive]);
}

interface FilterSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FilterSidebar({ isOpen, onClose }: FilterSidebarProps) {
  const { filters, updateFilter } = useBeachFilters();
  const router = useRouter();
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Use our custom hook
  useClickOutside(sidebarRef, onClose, isOpen);

  // Use a slide-in animation instead of overlay
  return (
    <div
      ref={sidebarRef}
      className={`fixed inset-y-0 right-0 w-80 z-50 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Filters"
    >
      <div className="bg-white p-4 sm:p-6 overflow-y-auto h-full">
        <div className="flex justify-between items-center mb-4">
          <h5 className="text-lg font-semibold font-primary">Filters</h5>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-100"
            aria-label="Close filters"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

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
  );
}
