"use client";

import * as React from "react";
import { cn } from "@/app/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    // Remove browser extension attributes that cause hydration mismatches
    const sanitizedProps = { ...props };
    delete (sanitizedProps as any).fdprocessedid;
    
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-lg border border-[var(--color-border)] bg-background px-3 py-2 text-sm ring-offset-background font-primary",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium",
          "placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2",
          "focus-visible:ring-[var(--color-tertiary)] focus-visible:ring-offset-2",
          "disabled:cursor-not-allowed disabled:opacity-50 transition-colors duration-200",
          className
        )}
        ref={ref}
        {...sanitizedProps}
        suppressHydrationWarning
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
