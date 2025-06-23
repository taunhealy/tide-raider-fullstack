"use client";

import * as React from "react";
import { Search } from "lucide-react";
import { cn } from "@/app/lib/utils";

interface CommandProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

const Command = React.forwardRef<HTMLDivElement, CommandProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex h-full w-full flex-col overflow-hidden rounded-md bg-white border border-[var(--color-border-light)]",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Command.displayName = "Command";

interface CommandInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const CommandInput = React.forwardRef<HTMLInputElement, CommandInputProps>(
  ({ className, ...props }, ref) => {
    return (
      <div className="flex items-center border-b border-[var(--color-border-light)] px-3">
        <Search className="mr-2 h-4 w-4 shrink-0 text-[var(--color-text-secondary)]" />
        <input
          ref={ref}
          className={cn(
            "flex h-11 w-full bg-transparent py-3 text-sm outline-none placeholder:text-[var(--color-text-secondary)] disabled:cursor-not-allowed disabled:opacity-50 font-primary",
            className
          )}
          {...props}
        />
      </div>
    );
  }
);
CommandInput.displayName = "CommandInput";

interface CommandListProps extends React.HTMLAttributes<HTMLDivElement> {}

const CommandList = React.forwardRef<HTMLDivElement, CommandListProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "max-h-[300px] overflow-y-auto overflow-x-hidden",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
CommandList.displayName = "CommandList";

interface CommandEmptyProps extends React.HTMLAttributes<HTMLDivElement> {}

const CommandEmpty = React.forwardRef<HTMLDivElement, CommandEmptyProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "py-6 text-center text-sm text-[var(--color-text-secondary)] font-primary",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
CommandEmpty.displayName = "CommandEmpty";

interface CommandGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  heading?: string;
}

const CommandGroup = React.forwardRef<HTMLDivElement, CommandGroupProps>(
  ({ className, heading, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn("overflow-hidden p-1 font-primary", className)}
        {...props}
      >
        {heading && (
          <div className="px-2 py-1.5 text-xs font-medium text-[var(--color-text-secondary)]">
            {heading}
          </div>
        )}
        {children}
      </div>
    );
  }
);
CommandGroup.displayName = "CommandGroup";

interface CommandItemProps {
  className?: string;
  children?: React.ReactNode;
  selected?: boolean;
  value?: string;
  onSelect?: (value: string) => void;
}

const CommandItem = React.forwardRef<HTMLDivElement, CommandItemProps>(
  ({ className, children, selected, value, onSelect, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none font-primary",
          selected &&
            "bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]",
          "hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text-primary)]",
          className
        )}
        onClick={() => onSelect?.(value ?? "")}
        {...props}
      >
        {children}
      </div>
    );
  }
);
CommandItem.displayName = "CommandItem";

const CommandSeparator = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("my-1 h-px bg-[var(--color-border-light)]", className)}
    {...props}
  />
));
CommandSeparator.displayName = "CommandSeparator";

export {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
};
