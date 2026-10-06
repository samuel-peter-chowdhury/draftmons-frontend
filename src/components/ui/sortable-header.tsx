'use client';

import { ChevronUp, ChevronDown } from 'lucide-react';
import * as React from 'react';

export interface SortableHeaderProps<T extends string> {
  /** The column this header sorts by. */
  column: T;
  /** The currently active column, or `null` when the table is unsorted. */
  sortBy: T | null;
  /** Direction of the active column. Ignored unless `sortBy === column`. */
  sortOrder: 'ASC' | 'DESC';
  onSort: (column: T) => void;
  children: React.ReactNode;
}

/**
 * In-table clickable column header with a chevron on the active column. Inactive
 * columns render a fixed-size blank spacer so header widths don't shift as the
 * active column changes.
 *
 * Not to be confused with `SortControls`, the dropdown-plus-toggle used by
 * server-side sorted list pages.
 */
export function SortableHeader<T extends string>({
  column,
  sortBy,
  sortOrder,
  onSort,
  children,
}: SortableHeaderProps<T>) {
  const isActive = sortBy === column;
  return (
    <button
      type="button"
      onClick={() => onSort(column)}
      className="inline-flex items-center gap-1 font-medium transition-colors hover:text-foreground"
    >
      {children}
      {isActive && sortOrder === 'ASC' && <ChevronUp className="h-4 w-4" />}
      {isActive && sortOrder === 'DESC' && <ChevronDown className="h-4 w-4" />}
      {!isActive && <div className="h-4 w-4" />}
    </button>
  );
}
