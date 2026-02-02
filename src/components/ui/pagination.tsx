'use client';

import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Select } from './select';

const DEFAULT_PAGE_SIZE_OPTIONS = [5, 10, 20];

export interface PaginationProps {
  /** Current page number (1-indexed) */
  page: number;
  /** Number of items per page */
  pageSize: number;
  /** Total number of pages */
  totalPages: number;
  /** Total number of items */
  total: number;
  /** Callback when page changes */
  onPageChange: (page: number) => void;
  /** Callback when page size changes */
  onPageSizeChange: (pageSize: number) => void;
  /** Available page size options */
  pageSizeOptions?: number[];
  /** Disable all controls (e.g., during loading) */
  disabled?: boolean;
  /** Additional class name for the container */
  className?: string;
}

function Pagination({
  page,
  pageSize,
  totalPages,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  disabled = false,
  className,
}: PaginationProps) {
  const handlePrevious = () => {
    if (page > 1) {
      onPageChange(page - 1);
    }
  };

  const handleNext = () => {
    if (page < totalPages) {
      onPageChange(page + 1);
    }
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = Number(e.target.value);
    onPageSizeChange(newSize);
  };

  const isFirstPage = page <= 1;
  const isLastPage = page >= totalPages;

  // Calculate the range of items being displayed
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-4 text-sm',
        className,
      )}
      role="navigation"
      aria-label="Pagination"
    >
      {/* Page size selector */}
      <div className="flex items-center gap-2">
        <label htmlFor="page-size-select" className="text-muted-foreground">
          Per page:
        </label>
        <Select
          id="page-size-select"
          value={pageSize}
          onChange={handlePageSizeChange}
          disabled={disabled}
          className="h-9 w-auto px-2 py-1"
          aria-label="Items per page"
        >
          {pageSizeOptions.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </Select>
      </div>

      {/* Navigation controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          disabled={disabled || isFirstPage}
          aria-label="Go to previous page"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Previous
        </Button>

        <div
          className="min-w-[120px] text-center text-muted-foreground"
          role="status"
          aria-live="polite"
        >
          {totalPages > 0 ? (
            <>
              Page {page} of {totalPages}
            </>
          ) : (
            'No results'
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={disabled || isLastPage}
          aria-label="Go to next page"
        >
          Next
          <ChevronRight className="ml-1 h-4 w-4" />
        </Button>
      </div>

      {/* Total count */}
      <div className="text-muted-foreground">
        {total > 0 ? (
          <>
            {startItem}–{endItem} of {total}
          </>
        ) : (
          '0 results'
        )}
      </div>
    </div>
  );
}

export { Pagination };
