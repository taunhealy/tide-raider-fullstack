import * as React from "react";
import { cn } from "@/app/lib/utils";
import { cva } from "class-variance-authority";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "ghost"
    | "link"
    | "secondary"
    | "regions";
  size?: "default" | "sm" | "lg" | "icon";
  isLoading?: boolean;
  isActive?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "default",
      size = "default",
      isLoading,
      isActive = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <button
        className={cn(
          // Base styles
          "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
          // Disabled state
          "disabled:opacity-50 disabled:pointer-events-none",
          // Variant styles
          {
            "border border-gray-300 bg-white hover:bg-gray-100":
              variant === "default",
            "bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500":
              variant === "destructive",
            "border border-gray-100 bg-white hover:bg-gray-100":
              variant === "outline",
            "hover:bg-gray-100 hover:text-gray-900 focus-visible:ring-gray-400":
              variant === "ghost",
            "text-[var(--color-bg-tertiary)] underline-offset-4 hover:underline focus-visible:ring-[var(--color-bg-tertiary)]":
              variant === "link",
            "bg-gray-100 text-gray-900 hover:bg-gray-200 focus-visible:ring-gray-400":
              variant === "secondary",
            "rounded-full text-sm font-primary px-3 py-1.5":
              variant === "regions",
            "bg-[var(--color-badge-active)] text-white focus-visible:ring-[var(--color-badge-active)]":
              variant === "regions" && isActive,
            "bg-white text-black border border-gray-200 hover:bg-gray-50 focus-visible:ring-gray-300":
              variant === "regions" && !isActive,
          },
          // Size styles
          {
            "h-10 px-4 py-2": size === "default",
            "h-8 px-3 text-sm": size === "sm",
            "h-12 px-8 text-lg": size === "lg",
            "h-10 w-10": size === "icon",
          },
          // Loading state
          {
            "relative text-transparent transition-none hover:text-transparent":
              isLoading,
          },
          className
        )}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <svg
              className="animate-spin h-5 w-5 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        outline:
          "border border-input hover:bg-accent hover:text-accent-foreground",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        regions: "rounded-full px-3 py-1.5 text-sm font-primary",
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export { Button };
