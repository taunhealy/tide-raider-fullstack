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
        <button
          onClick={onClearFilters}
          className="w-full flex items-center justify-center gap-1.5 px-2.5 py-2 bg-white hover:bg-gray-100 border border-gray-200 hover:border-gray-300 rounded-lg text-[9px] font-black uppercase tracking-wider text-slate-500 transition-all active:scale-[0.95]"
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
}
