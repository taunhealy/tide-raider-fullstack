// hooks/usePagination.ts
import { useMemo } from "react";

interface PaginationResult<T> {
  totalItems: number;
  totalPages: number;
  currentItems: T[];
  isFirstPage: boolean;
  isLastPage: boolean;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export function usePagination<T>(
  items: T[] = [],
  currentPage: number = 1,
  itemsPerPage: number = 10
): PaginationResult<T> {
  const totalItems = items.length;

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalItems / itemsPerPage)),
    [totalItems, itemsPerPage]
  );

  const safePage = useMemo(
    () => Math.min(Math.max(1, currentPage), totalPages),
    [currentPage, totalPages]
  );

  const currentItems = useMemo(() => {
    const start = (safePage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return items.slice(start, end);
  }, [items, safePage, itemsPerPage]);

  return {
    totalItems,
    totalPages,
    currentItems,
    isFirstPage: safePage === 1,
    isLastPage: safePage === totalPages,
    hasNextPage: safePage < totalPages,
    hasPreviousPage: safePage > 1,
  };
}
