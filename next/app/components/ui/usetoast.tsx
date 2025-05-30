"use client";

import { toast as sonnerToast } from "sonner";

export function toast(props: {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}) {
  const { title, description, variant } = props;

  return sonnerToast(title, {
    description,
    className: variant === "destructive" ? "bg-destructive" : "",
  });
}
