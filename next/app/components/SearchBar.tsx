import { Search } from "lucide-react";
import { cn } from "@/app/lib/utils";
import { useEffect, useRef, useState } from "react";
import debounce from "lodash/debounce";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export default function SearchBar({
  value,
  onChange,
  placeholder = "Search breaks...",
  className,
}: SearchBarProps) {
  // Local state for immediate UI updates
  const [localValue, setLocalValue] = useState(value);

  // Create debounced function once and clean it up properly
  const debouncedUpdate = useRef(
    debounce((value: string) => {
      onChange(value);
    }, 300)
  ).current;

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedUpdate.cancel();
    };
  }, [debouncedUpdate]);

  // Keep local value in sync with prop value
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <div className={cn("relative w-full max-w-md font-primary", className)}>
      <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
        <Search className="h-5 w-5 text-gray-400" />
      </div>
      <input
        type="text"
        value={localValue}
        onChange={(e) => {
          const newValue = e.target.value;
          setLocalValue(newValue); // Update local state immediately
          debouncedUpdate(newValue); // Debounce the parent update
        }}
        placeholder={placeholder}
        className={cn(
          "w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg " +
            "focus:outline-none focus:ring-1 focus:ring-[var(--color-bg-tertiary)] focus:border-transparent " +
            "placeholder-gray-400 transition-all ml-1",
          className
        )}
      />
    </div>
  );
}
