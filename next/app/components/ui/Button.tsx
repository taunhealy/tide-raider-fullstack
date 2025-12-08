"use client";

import * as React from "react";
import { cn } from "@/app/lib/utils";
import { cva } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium duration-300 ease-in-out focus:outline-none disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 border border-gray-200",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        dark: "bg-gray-700 dark:bg-gray-600 text-white hover:bg-gray-600 dark:hover:bg-gray-500",
        grey: "bg-gray-600 text-white hover:bg-gray-700 border border-gray-600",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "ghost"
    | "link"
    | "secondary"
    | "dark"
    | "grey";
  size?: "default" | "sm" | "lg" | "icon";
  isLoading?: boolean;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, asChild = false, ...props }, ref) => {
    // Remove any browser-generated IDs to prevent hydration mismatches
    const sanitizedProps = { ...props };
    // Remove fdprocessedid on both server and client to prevent hydration errors
    delete (sanitizedProps as any).fdprocessedid;

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...sanitizedProps}
        suppressHydrationWarning
      >
        {isLoading ? (
          <div className="flex items-center">
            <div className="animate-spin mr-2">⌛</div>
            Loading...
          </div>
        ) : (
          props.children
        )}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
