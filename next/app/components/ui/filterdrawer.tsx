// app/components/ui/FilterDrawer.tsx
import { X } from "lucide-react";
import { cn } from "@/app/lib/utils";

interface FilterDrawerProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
}

export function FilterDrawer({ children, isOpen, onClose }: FilterDrawerProps) {
  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[19999] transition-opacity"
          onClick={onClose}
        />
      )}
      
      {/* Drawer */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white transform transition-transform duration-300 ease-in-out z-[20000] shadow-2xl flex flex-col font-primary",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="p-4 border-b flex items-center justify-between bg-white shrink-0">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Filters</h2>
          <button 
            onClick={onClose} 
            className="p-2 -mr-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Close filters"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </>
  );
}
