'use client';

import React from 'react';
import { X } from 'lucide-react';
import { Input, Label } from '@/components';
import { Badge } from '@/components/ui/badge';

export interface FilterDropdownProps<T> {
  label: string;
  items: T[];
  selectedItems: T[];
  onAdd: (item: T) => void;
  onRemove: (item: T) => void;
  getKey: (item: T) => string | number;
  getLabel: (item: T) => string;
  getBadgeStyle?: (item: T) => React.CSSProperties;
  capitalize?: boolean;
  maxResults?: number;
}

export function FilterDropdown<T>({
  label,
  items,
  selectedItems,
  onAdd,
  onRemove,
  getKey,
  getLabel,
  getBadgeStyle,
  capitalize = true,
  maxResults,
}: FilterDropdownProps<T>) {
  const [search, setSearch] = React.useState('');
  const [focused, setFocused] = React.useState(false);

  const inputId = label.toLowerCase().replace(/\s+/g, '-');
  const placeholder = `Search ${label.toLowerCase()}...`;

  const filteredItems = React.useMemo(() => {
    const selectedKeys = new Set(selectedItems.map(getKey));
    const matched = items.filter(
      (item) =>
        !selectedKeys.has(getKey(item)) &&
        getLabel(item).toLowerCase().includes(search.toLowerCase()),
    );
    return maxResults ? matched.slice(0, maxResults) : matched;
  }, [items, selectedItems, search, getKey, getLabel, maxResults]);

  const handleAdd = (item: T) => {
    onAdd(item);
    setSearch('');
    setFocused(false);
  };

  const hasCustomBadgeStyle = !!getBadgeStyle;
  const capClass = capitalize ? ' capitalize' : '';

  return (
    <div className="w-64 space-y-2">
      <Label htmlFor={inputId}>{label}</Label>
      <div className="relative">
        <Input
          id={inputId}
          placeholder={placeholder}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onFocus={() => setFocused(true)}
          onClick={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {focused && filteredItems.length > 0 && (
          <div className="fixed z-50 mt-1 max-h-60 w-64 overflow-auto rounded-md border border-border bg-popover p-1 shadow-md">
            {filteredItems.map((item) => (
              <button
                key={getKey(item)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleAdd(item);
                }}
                className={`w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground${capClass}`}
              >
                {getLabel(item)}
              </button>
            ))}
          </div>
        )}
      </div>
      {selectedItems.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedItems.map((item) => (
            <Badge
              key={getKey(item)}
              variant={hasCustomBadgeStyle ? undefined : 'secondary'}
              className={`gap-1${capClass}`}
              style={hasCustomBadgeStyle ? getBadgeStyle(item) : undefined}
            >
              {getLabel(item)}
              <button
                onClick={() => onRemove(item)}
                className={`ml-1 rounded-full ${hasCustomBadgeStyle ? 'hover:bg-black/20' : 'hover:bg-background/20'}`}
                aria-label={`Remove ${getLabel(item)}`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
