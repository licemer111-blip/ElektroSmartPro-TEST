"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn, normalizePolish, searchComparator } from "@/lib/utils";

export interface AutocompleteOption {
  value: string;
  label: string;
  metadata?: Record<string, unknown>;
}

interface AutocompleteInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onSelect"> {
  options: AutocompleteOption[];
  onSelect?: (option: AutocompleteOption) => void;
  minChars?: number;
  maxResults?: number;
  emptyText?: string;
}

export function AutocompleteInput({
  options,
  onSelect,
  minChars = 1,
  maxResults = 10,
  emptyText = "Nie znaleziono",
  value,
  onChange,
  className,
  ...props
}: AutocompleteInputProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [filteredOptions, setFilteredOptions] = React.useState<AutocompleteOption[]>([]);
  const [selectedIndex, setSelectedIndex] = React.useState(-1);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Filter options based on input value
  React.useEffect(() => {
    const inputValue = (value as string) || "";
    
    if (inputValue.length < minChars) {
      setFilteredOptions([]);
      setIsOpen(false);
      return;
    }

    const normalizedInput = normalizePolish(inputValue);
    const filtered = options
      .filter((option) =>
        normalizePolish(option.label).includes(normalizedInput)
      )
      .sort((a, b) => 
        searchComparator(normalizedInput, normalizePolish(a.label), normalizePolish(b.label))
      )
      .slice(0, maxResults);

    setFilteredOptions(filtered);
    setIsOpen(filtered.length > 0);
    setSelectedIndex(-1);
  }, [value, options, minChars, maxResults]);

  // Handle option selection
  const handleSelect = (option: AutocompleteOption) => {
    if (onSelect) {
      onSelect(option);
    }
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || filteredOptions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0) {
          handleSelect(filteredOptions[selectedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full">
      <Input
        ref={inputRef}
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        className={className}
        autoComplete="off"
        {...props}
      />
      
      {isOpen && filteredOptions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {filteredOptions.map((option, index) => (
            <div
              key={option.value}
              className={cn(
                "px-3 py-2 cursor-pointer text-sm transition-colors",
                "hover:bg-slate-100 dark:hover:bg-slate-700",
                selectedIndex === index && "bg-slate-100 dark:bg-slate-700"
              )}
              onClick={() => handleSelect(option)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="font-medium">{option.label}</div>
              {!!option.metadata?.category && (
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {String(option.metadata.category)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isOpen && filteredOptions.length === 0 && (value as string)?.length >= minChars && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg"
        >
          <div className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400 text-center">
            {emptyText}
          </div>
        </div>
      )}
    </div>
  );
}
