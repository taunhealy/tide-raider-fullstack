import { cn } from "@/app/lib/utils";
import { forwardRef } from "react";

const Skeleton = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "animate-pulse rounded-md bg-gray-200 dark:bg-gray-800",
      className
    )}
    {...props}
  />
));
Skeleton.displayName = "Skeleton";

export { Skeleton };
