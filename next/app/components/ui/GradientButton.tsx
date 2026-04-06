"use client";

import { ButtonHTMLAttributes, ReactNode } from "react";

export type GradientButtonVariant = 
  | "purple-pink"    // Hidden Gems style
  | "blue-purple"    // Alternative gradient
  | "green-blue"     // Success/positive actions
  | "orange-red"     // Warning/important actions
  | "gray"           // Neutral/secondary
  | "outline";       // Outlined version

export type GradientButtonSize = "sm" | "md" | "lg";

interface GradientButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: GradientButtonVariant;
  size?: GradientButtonSize;
  active?: boolean;
  icon?: ReactNode;
  badge?: string | number;
  fullWidth?: boolean;
  children: ReactNode;
}

const variantStyles: Record<GradientButtonVariant, { active: string; inactive: string }> = {
  "purple-pink": {
    active: "bg-gradient-to-r from-blue-600 to-gray-800 text-white shadow-lg shadow-blue-500/30",
    inactive: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700",
  },
  "blue-purple": {
    active: "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/30",
    inactive: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700",
  },
  "green-blue": {
    active: "bg-gradient-to-r from-green-500 to-blue-500 text-white shadow-lg shadow-green-500/30",
    inactive: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700",
  },
  "orange-red": {
    active: "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30",
    inactive: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700",
  },
  "gray": {
    active: "bg-gray-800 border-gray-800 text-white shadow-lg translate-y-[-1px]",
    inactive: "bg-white border-gray-100 text-gray-900 hover:bg-gray-50 transition-colors",
  },
  "outline": {
    active: "border-2 border-purple-500 text-purple-500 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30",
    inactive: "border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500",
  },
};

const sizeStyles: Record<GradientButtonSize, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2 text-sm",
  lg: "px-6 py-3 text-base",
};

export default function GradientButton({
  variant = "purple-pink",
  size = "md",
  active = false,
  icon,
  badge,
  fullWidth = false,
  children,
  className = "",
  disabled = false,
  ...props
}: GradientButtonProps) {
  const variantClass = active 
    ? variantStyles[variant].active 
    : variantStyles[variant].inactive;
  
  const sizeClass = sizeStyles[size];
  
  const baseStyles = `
    rounded-xl font-medium transition-all duration-200
    flex items-center justify-center gap-2
    disabled:opacity-50 disabled:cursor-not-allowed
    ${fullWidth ? "w-full" : ""}
    ${variantClass}
    ${sizeClass}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  return (
    <button
      className={baseStyles}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span>{children}</span>
      {badge !== undefined && (
        <span className="ml-1 bg-white/20 px-2 py-0.5 rounded-full text-xs font-semibold">
          {badge}
        </span>
      )}
    </button>
  );
}

// Export a specialized Hidden Gems button for convenience
export function HiddenGemsButton({
  active = false,
  children = "Hidden Gems",
  ...props
}: Omit<GradientButtonProps, "variant" | "icon"> & { children?: ReactNode }) {
  return (
    <GradientButton
      variant="gray"
      active={active}
      icon={
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
          />
        </svg>
      }
      {...props}
    >
      {children}
    </GradientButton>
  );
}

// Export a specialized Loggers button for convenience
export function LoggersButton({
  active = false,
  children = "Loggers",
  ...props
}: Omit<GradientButtonProps, "variant" | "icon"> & { children?: ReactNode }) {
  return (
    <GradientButton
      variant="gray"
      active={active}
      icon={
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          viewBox="0 0 24 24"
        >
          <path d="M12 2C8 6 6 12 6 16c0 4 2 6 6 6s6-2 6-6c0-4-2-10-6-14z" />
          <path d="M12 2v20" />
        </svg>
      }
      {...props}
    >
      {children}
    </GradientButton>
  );
}

export function FoilingButton({
  active = false,
  children = "Foiling",
  ...props
}: Omit<GradientButtonProps, "variant" | "icon"> & { children?: ReactNode }) {
  return (
    <GradientButton
      variant="gray"
      active={active}
      icon={
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 3v4M3 5h4M6 17l4-2 4 2m-2-2v4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
          />
        </svg>
      }
      {...props}
    >
      {children}
    </GradientButton>
  );
}
