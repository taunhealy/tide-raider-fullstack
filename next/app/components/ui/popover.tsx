"use client";

import * as React from "react";
import { useFloating, offset, flip, shift } from "@floating-ui/react";
import { cn } from "@/app/lib/utils";

interface PopoverProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const PopoverContext = React.createContext<{
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}>({
  open: false,
  setOpen: () => {},
});

const Popover = ({
  children,
  open: controlledOpen,
  onOpenChange,
}: PopoverProps) => {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const setOpen = React.useCallback(
    (nextOrUpdater: boolean | ((prev: boolean) => boolean)) => {
      const next =
        typeof nextOrUpdater === "function"
          ? nextOrUpdater(open)
          : nextOrUpdater;
      if (!isControlled) setUncontrolledOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange, open]
  );

  return (
    <PopoverContext.Provider value={{ open, setOpen }}>
      {children}
    </PopoverContext.Provider>
  );
};

const PopoverTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ children, ...props }, ref) => {
  const { setOpen, open } = React.useContext(PopoverContext);

  return (
    <button ref={ref} type="button" onClick={() => setOpen(!open)} {...props}>
      {children}
    </button>
  );
});
PopoverTrigger.displayName = "PopoverTrigger";

const PopoverContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    align?: "start" | "center" | "end";
    sideOffset?: number;
  }
>(({ className, align = "center", sideOffset = 4, ...props }, ref) => {
  const { open } = React.useContext(PopoverContext);
  const [mounted, setMounted] = React.useState(false);

  const { refs, floatingStyles } = useFloating({
    placement: "bottom",
    middleware: [offset(sideOffset), flip(), shift()],
  });

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !open) return null;

  return (
    <div
      ref={ref}
      className={cn(
        "z-50 w-72 rounded-md border bg-white p-4 shadow-md outline-none font-primary",
        "animate-in fade-in-0 zoom-in-95",
        className
      )}
      style={floatingStyles}
      {...props}
    />
  );
});
PopoverContent.displayName = "PopoverContent";

export { Popover, PopoverTrigger, PopoverContent };
