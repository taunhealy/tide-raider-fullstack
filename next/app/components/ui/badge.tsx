import { cn } from "@/app/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "outline" | "secondary" | "destructive";
  className?: string;
}

export function Badge({ 
  children, 
  variant = "default", 
  className 
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        "transition-colors font-primary",
        variant === "default" && "bg-[var(--color-bg-tertiary)] text-white",
        variant === "secondary" && "bg-gray-100 text-gray-800",
        variant === "outline" && "border border-gray-200 text-gray-800",
        variant === "destructive" && "bg-red-100 text-red-800",
        className
      )}
    >
      {children}
    </span>
  );
} 