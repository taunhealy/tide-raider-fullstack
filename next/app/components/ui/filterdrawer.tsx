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
    <div
      className={cn(
        "fixed top-0 right-0 h-full w-full sm:w-[360px] bg-white transform transition-transform duration-300 ease-in-out z-50 shadow-lg",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}
    >
      <div className="p-4 border-b">
        <button onClick={onClose} className="float-right">
          <X className="h-5 w-5" />
        </button>
      </div>
      {children}
    </div>
  );
}
