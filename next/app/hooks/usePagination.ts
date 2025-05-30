// hooks/usePagination.ts
import { useMemo } from "react";

export function usePagination<T>(
  items: T[],
  currentPage: number,
  itemsPerPage: number
) {
  const totalItems = items.length;
  const totalPages = useMemo(
    () => Math.ceil(totalItems / itemsPerPage),
    [totalItems, itemsPerPage]
  );

  const currentItems = useMemo(
    () =>
      items.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage),
    [items, currentPage, itemsPerPage]
  );

  return {
    totalItems,
    totalPages,
    currentItems,
  };
}
