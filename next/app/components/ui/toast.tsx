"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/app/lib/utils";

interface ToastProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
  variant?: "default" | "destructive";
  className?: string;
}

const ToastContext = React.createContext<{
  toasts: Array<{
    id: string;
    content: React.ReactNode;
    variant?: "default" | "destructive";
  }>;
  addToast: (
    content: React.ReactNode,
    variant?: "default" | "destructive"
  ) => void;
  removeToast: (id: string) => void;
}>({
  toasts: [],
  addToast: () => {},
  removeToast: () => {},
});

export const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = React.useState<
    Array<{
      id: string;
      content: React.ReactNode;
      variant?: "default" | "destructive";
    }>
  >([]);

  const addToast = React.useCallback(
    (content: React.ReactNode, variant?: "default" | "destructive") => {
      const id = Math.random().toString(36).substr(2, 9);
      setToasts((prev) => [...prev, { id, content, variant }]);

      // Auto-remove toast after 5 seconds
      setTimeout(() => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
      }, 5000);
    },
    []
  );

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastViewport />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

const ToastViewport = () => {
  const { toasts } = useToast();

  return (
    <div className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]">
      {toasts.map(({ id, content, variant }) => (
        <Toast key={id} id={id} variant={variant}>
          {content}
        </Toast>
      ))}
    </div>
  );
};

const Toast = ({
  id,
  children,
  variant = "default",
  className,
}: {
  id: string;
  children: React.ReactNode;
  variant?: "default" | "destructive";
  className?: string;
}) => {
  const { removeToast } = useToast();

  return (
    <div
      className={cn(
        "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all animate-in fade-in-0 slide-in-from-top-full",
        variant === "destructive" &&
          "destructive group border-destructive bg-destructive text-destructive-foreground",
        className
      )}
    >
      {children}
      <button
        onClick={() => removeToast(id)}
        className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

const ToastTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm font-semibold font-primary", className)}
    {...props}
  />
));
ToastTitle.displayName = "ToastTitle";

const ToastDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm opacity-90 font-primary", className)}
    {...props}
  />
));
ToastDescription.displayName = "ToastDescription";

export { Toast, ToastTitle, ToastDescription };
