"use client";

import * as React from "react";
import { cn } from "@/app/lib/utils";

interface BasicSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  onValueChange?: (value: string) => void;
}

export function BasicSelect({
  children,
  className,
  onValueChange,
  onChange,
  ...props
}: BasicSelectProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onValueChange) {
      onValueChange(e.target.value);
    }
    if (onChange) {
      onChange(e);
    }
  };

  return (
    <select
      className={cn(
        "flex h-10 w-full rounded-lg border border-input bg-white px-3 py-2 text-sm font-primary",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      onChange={handleChange}
      {...props}
    >
      {children}
    </select>
  );
}

interface BasicOptionProps
  extends React.OptionHTMLAttributes<HTMLOptionElement> {}

export function BasicOption({
  children,
  className,
  ...props
}: BasicOptionProps) {
  return (
    <option className={cn("font-primary", className)} {...props}>
      {children}
    </option>
  );
}
