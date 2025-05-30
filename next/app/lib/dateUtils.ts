export const normalizeDate = (date: string | Date) =>
  new Date(typeof date === "string" ? date.split("T")[0] : date)
    .toISOString()
    .split("T")[0];
