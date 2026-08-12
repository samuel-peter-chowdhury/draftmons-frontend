'use client';

import { useMemo, useState } from 'react';
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
  onSearchChange?: (search: string) => void;
  isAsync?: boolean;
  loading?: boolean;
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
  onSearchChange,
  isAsync = false,
  loading = false,
}: FilterDropdownProps<T>) {
  const [search, setSearch] = useState('');
  const [focused, setFocused] = useState(false);

  const inputId = label.toLowerCase().replace(/\s+/g, '-');
  const placeholder = `Search ${label.toLowerCase()}...`;

  const filteredItems = useMemo(() => {
    const selectedKeys = new Set(selectedItems.map(getKey));
    const matched = isAsync
      ? items.filter((item) => !selectedKeys.has(getKey(item)))
      : items.filter(
        (item) =>
          !selectedKeys.has(getKey(item)) &&
          getLabel(item).toLowerCase().includes(search.toLowerCase()),
      );
    return maxResults ? matched.slice(0, maxResults) : matched;
  }, [items, selectedItems, search, getKey, getLabel, maxResults, isAsync]);

  const handleInputChange = (value: string) => {
    setSearch(value);
    if (onSearchChange) onSearchChange(value);
  };

  const handleAdd = (item: T) => {
    onAdd(item);
    setSearch('');
    setFocused(false);
    if (onSearchChange) onSearchChange('');
  };

  const hasCustomBadgeStyle = !!getBadgeStyle;
  const capClass = capitalize ? ' capitalize' : '';

  const showDropdown = focused && (filteredItems.length > 0 || (isAsync && loading));

  const VALID_TYPES = new Set([
    'bug', 'dark', 'dragon', 'electric', 'fairy', 'fighting', 'fire',
    'flying', 'ghost', 'grass', 'ground', 'ice', 'normal',
    'poison', 'psychic', 'rock', 'steel', 'water'
  ]);

  const getTypeImg = (item: T) => {
    const name = (item as any)?.name;
    if (typeof name !== 'string') return null;

    const key = name.toLowerCase();
    if (!VALID_TYPES.has(key)) return null;

    return `/types-images/${key}.png`;
  };
  return (
    <div className="w-full space-y-2">
      <Label htmlFor={inputId}>{label}</Label>

      <div className="relative">
        <Input
          id={inputId}
          placeholder={placeholder}
          value={search}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onClick={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />

        {showDropdown && (
          <div className="absolute left-0 top-full z-[100] mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-popover p-1 shadow-md">
            {isAsync && loading && filteredItems.length === 0 ? (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">Loading...</div>
            ) : (
              filteredItems.map((item) => {
                const typeImgSrc = getTypeImg(item);

                return (
                  <button
                    key={getKey(item)}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleAdd(item);
                    }}
                    className={`w-full rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground${capClass}`}
                  >
                    {typeImgSrc ? (
                      <span className="flex items-center gap-2">
                        <img
                          src={typeImgSrc}
                          alt={getLabel(item)}
                          className="h-4 w-10"
                        />
                        <span>{getLabel(item)}</span>
                      </span>
                    ) : (
                      getLabel(item)
                    )}
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {selectedItems.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {selectedItems.map((item) => {
            const typeImgSrc = getTypeImg(item);

            return (
              <Badge
                key={getKey(item)}
                variant={hasCustomBadgeStyle ? undefined : 'secondary'}
                className={`gap-1 px-1.5 py-0.5 ${capClass}`}
                style={hasCustomBadgeStyle ? getBadgeStyle(item) : undefined}
              >
                {typeImgSrc ? (
                  <img
                    src={typeImgSrc}
                    alt={getLabel(item)}
                    className="h-[110%] w-[110%] drop-shadow-[0_2px_2px_rgba(0,0,0,0.65)]"
                  />
                ) : (getLabel(item)) }

                

                <button
                  type="button"
                  onClick={() => onRemove(item)}
                  className={`ml-0.5 rounded-full ${hasCustomBadgeStyle ? 'hover:bg-black/20' : 'hover:bg-background/20'}`}
                  aria-label={`Remove ${getLabel(item)}`}
                >
                  <X className="h-3 w-3 font-bold" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
} 