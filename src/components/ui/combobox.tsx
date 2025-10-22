'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

export interface ComboboxOption {
  value: string;
  label: string;
  email?: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value?: string;
  onSelect: (value: string) => void;
  placeholder?: string;
  emptyText?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  loading?: boolean;
  disabled?: boolean;
}

export function Combobox({
  options,
  value,
  onSelect,
  placeholder = 'Select option...',
  emptyText = 'No option found.',
  searchValue,
  onSearchChange,
  loading = false,
  disabled = false,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);

  const selectedOption = options.find((option) => option.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedOption ? selectedOption.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        sideOffset={0}
      >
        <Command shouldFilter={false} loop>
          <CommandInput
            placeholder={placeholder}
            value={searchValue}
            onValueChange={onSearchChange}
          />
          <CommandList>
            {loading ? (
              <div className="py-6 text-center text-sm">Loading...</div>
            ) : (
              <>
                <CommandEmpty>{emptyText}</CommandEmpty>
                <CommandGroup>
                  {options.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.value}
                      keywords={[option.label, option.email || '']}
                      onSelect={(currentValue) => {
                        // cmdk lowercases the value, so we need to find the original
                        const selectedOption = options.find(
                          (opt) => opt.value.toLowerCase() === currentValue.toLowerCase(),
                        );
                        if (selectedOption) {
                          onSelect(selectedOption.value);
                        }
                        setOpen(false);
                      }}
                    >
                      <div className="flex items-start">
                        <Check
                          className={cn(
                            'mr-2 mt-1 h-4 w-4 shrink-0',
                            value === option.value ? 'opacity-100' : 'opacity-0',
                          )}
                        />
                        <div className="flex flex-col">
                          <span>{option.label}</span>
                          {option.email && (
                            <span className="text-xs text-muted-foreground">{option.email}</span>
                          )}
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
