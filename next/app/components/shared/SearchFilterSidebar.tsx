import { useState } from "react";

interface Filter {
  id: string;
  name: string;
  options: {
    value: string;
    label: string;
  }[];
}

interface SearchFilterSidebarProps {
  filters: Filter[];
  onFilterChange: (filterId: string, value: string | null) => void;
  activeFilters?: Record<string, string | null>;
  className?: string;
}

export function SearchFilterSidebar({
  filters,
  onFilterChange,
  activeFilters = {},
  className,
}: SearchFilterSidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilters, setSelectedFilters] = useState<
    Record<string, string>
  >({});

  const handleFilterChange = (filterId: string, value: string) => {
    const newFilters = { ...selectedFilters };

    if (value === "") {
      delete newFilters[filterId];
    } else {
      newFilters[filterId] = value;
    }

    setSelectedFilters(newFilters);
    onFilterChange(filterId, value);
  };

  return (
    <div
      className={`w-64 bg-white border-l border-gray-200 p-4 font-primary ${className || ""}`}
    >
      <h2 className="text-lg font-semibold mb-4">Filters</h2>

      {/* Search */}
      <div className="mb-6">
        <label
          htmlFor="search"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Search
        </label>
        <input
          type="text"
          id="search"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Search boards..."
        />
      </div>

      {/* Filters */}
      {filters.map((filter) => (
        <div key={filter.id} className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {filter.name}
          </label>
          <select
            value={selectedFilters[filter.id] || ""}
            onChange={(e) => handleFilterChange(filter.id, e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All {filter.name}</option>
            {filter.options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      ))}

      {/* Clear Filters Button */}
      {Object.keys(selectedFilters).length > 0 && (
        <button
          onClick={() => {
            setSelectedFilters({});
            filters.forEach((filter) => onFilterChange(filter.id, ""));
          }}
          className="w-full mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );
}
