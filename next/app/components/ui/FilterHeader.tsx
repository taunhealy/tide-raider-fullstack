"use client";

import React from "react";
import { Button } from "./Button";
import { Input } from "./input";

interface FilterHeaderProps {
  title: string;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onClearFilters: () => void;
  placeholder?: string;
}

export function FilterHeader({
  title,
  searchQuery,
  onSearchChange,
  onClearFilters,
  placeholder = "Search...",
}: FilterHeaderProps) {
  return (
    <div className="space-y-3">
      <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest font-primary">
        {title}
      </h4>

      <div className="space-y-2">
        <Input
          type="text"
          placeholder={placeholder}
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-primary focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Button
          variant="outline"
          onClick={onClearFilters}
          className="w-full text-sm"
        >
          Clear Filters
        </Button>
      </div>
    </div>
  );
}
