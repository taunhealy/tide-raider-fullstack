"use client";

import * as React from "react";
import { cn } from "@/app/lib/utils";
import { cva } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md font-medium duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
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
    | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  isLoading?: boolean;
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, asChild = false, ...props }, ref) => {
    // Remove any browser-generated IDs during SSR
    const sanitizedProps = { ...props };
    if (typeof window === "undefined") {
      delete (sanitizedProps as any).fdprocessedid;
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...sanitizedProps}
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
