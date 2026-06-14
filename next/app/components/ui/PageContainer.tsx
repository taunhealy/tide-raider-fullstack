import { ReactNode } from "react";
import { cn } from "@/app/lib/utils";

interface PageContainerProps {
  children: ReactNode;
  className?: string;
}

export default function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div className={cn("max-w-7xl mx-auto px-4 md:px-8 py-12", className)}>
      {children}
    </div>
  );
}
