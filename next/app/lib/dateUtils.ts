import { format, isValid } from "date-fns";

export const normalizeDate = (date: string | Date) =>
  new Date(typeof date === "string" ? date.split("T")[0] : date)
    .toISOString()
    .split("T")[0];

/**
 * Formats a date safely, returning a fallback if the date is invalid or missing.
 */
export const safeFormat = (date: any, formatStr: string, fallback: string = "N/A") => {
  if (!date) return fallback;
  const d = new Date(date);
  if (!isValid(d)) return fallback;
  return format(d, formatStr);
};
