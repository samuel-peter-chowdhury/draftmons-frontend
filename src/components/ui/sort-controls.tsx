'use client';

import * as React from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { Select } from './select';

export interface SortOption {
  value: string;
  label: string;
}

export interface SortControlsProps {
  /** Available sort field options */
  options: SortOption[];
  /** Current sort field value */
  sortBy: string;
  /** Current sort direction */
  sortOrder: 'ASC' | 'DESC';
  /** Callback when sort field or order changes */
  onSortChange: (sortBy: string, sortOrder: 'ASC' | 'DESC') => void;
  /** Disable all controls (e.g., during loading) */
  disabled?: boolean;
  /** Additional class name for the container */
  className?: string;
}

function SortControls({
  options,
  sortBy,
  sortOrder,
  onSortChange,
  disabled = false,
  className,
}: SortControlsProps) {
  const handleSortByChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSortChange(e.target.value, sortOrder);
  };

  const handleSortOrderToggle = () => {
    const newOrder = sortOrder === 'ASC' ? 'DESC' : 'ASC';
    onSortChange(sortBy, newOrder);
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <label htmlFor="sort-field" className="text-sm text-muted-foreground">
        Sort by:
      </label>
      <Select
        id="sort-field"
        value={sortBy}
        onChange={handleSortByChange}
        disabled={disabled}
        className="h-9 w-auto px-2 py-1"
        aria-label="Sort field"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Select>
      <Button
        variant="outline"
        size="sm"
        onClick={handleSortOrderToggle}
        disabled={disabled}
        aria-label={sortOrder === 'ASC' ? 'Sort ascending, click to sort descending' : 'Sort descending, click to sort ascending'}
        title={sortOrder === 'ASC' ? 'Ascending' : 'Descending'}
        className="h-9 w-9 p-0"
      >
        {sortOrder === 'ASC' ? (
          <ArrowUp className="h-4 w-4" />
        ) : (
          <ArrowDown className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
}

export { SortControls };
