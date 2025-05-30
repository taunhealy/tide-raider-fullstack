"use client";

import { forwardRef } from "react";
import { cn } from "@/app/lib/utils";
import { TextareaHTMLAttributes } from "react";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex w-full rounded-lg border border-[var(--color-border)] bg-background px-3 py-2 text-sm ring-offset-background",
          "placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2",
          "focus-visible:ring-[var(--color-tertiary)] focus-visible:ring-offset-2 disabled:cursor-not-allowed",
          "disabled:opacity-50 transition-colors duration-200",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";

export default Textarea;
