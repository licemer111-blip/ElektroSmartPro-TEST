'use client';

import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { createClient } from '@/utils/supabase/client';
import { useDebounce } from 'use-debounce';
import { cn } from '@/lib/utils';

interface KnrNorm {
  keyword: string;
  label: string;
  knr_ref: string | null;
  unit: string | null;
  labor_norm_rbh: number | null;
  category: string | null;
}

export interface KnrSelectedItem {
  name: string;
  unit: string;
  knrRef: string | null;
  laborNormRbh: number | null;
}

interface AutocompleteItemInputProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  onItemSelect?: (item: KnrSelectedItem) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export function AutocompleteItemInput({
  id,
  value,
  onChange,
  onItemSelect,
  placeholder = "Wprowadź nazwę...",
  disabled = false,
  className,
}: AutocompleteItemInputProps) {
  const [suggestions, setSuggestions] = useState<KnrNorm[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const supabase = createClient();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [debouncedValue] = useDebounce(value, 300);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (debouncedValue.length < 2) {
        setSuggestions([]);
        setIsOpen(false);
        return;
      }

      setIsLoading(true);

      try {
        const { data, error } = await supabase
          .from('es_dictionary')
          .select('keyword, label, knr_ref, unit, labor_norm_rbh, category')
          .or(`label.ilike.%${debouncedValue}%,keyword_normalized.ilike.%${debouncedValue}%`)
          .order('confidence_weight', { ascending: false })
          .limit(8);

        if (error) {
          setSuggestions([]);
        } else {
          setSuggestions((data ?? []) as KnrNorm[]);
          setIsOpen((data ?? []).length > 0);
        }
      } catch {
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedValue, supabase]);

  const handleSelect = (item: KnrNorm) => {
    onChange(item.label);
    setIsOpen(false);
    setSelectedIndex(-1);
    if (onItemSelect) {
      onItemSelect({
        name: item.label,
        unit: item.unit ?? 'szt',
        knrRef: item.knr_ref ?? null,
        laborNormRbh: item.labor_norm_rbh ?? null,
      });
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'Escape') setIsOpen(false);
      return;
    }
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0) handleSelect(suggestions[selectedIndex]);
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <Input
        id={id}
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
        autoComplete="off"
        onFocus={() => {
          if (suggestions.length > 0) setIsOpen(true);
        }}
      />

      {isOpen && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-md border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 py-1 shadow-lg max-h-64 overflow-auto">
          <li className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-orange-600 dark:text-orange-400 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-orange-500" />
            Baza Referencyjna KNR
          </li>
          {suggestions.map((item, index) => (
            <li
              key={item.keyword}
              className={cn(
                "cursor-pointer px-3 py-2 text-sm transition-colors",
                "hover:bg-slate-100 dark:hover:bg-slate-800",
                selectedIndex === index && "bg-slate-100 dark:bg-slate-800"
              )}
              onClick={() => handleSelect(item)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 dark:text-slate-100 truncate leading-snug">
                    {item.label}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {item.unit ?? 'szt'}
                    {item.labor_norm_rbh != null && (
                      <span className="ml-2 text-emerald-600 dark:text-emerald-400">
                        {item.labor_norm_rbh} r-g
                      </span>
                    )}
                  </div>
                </div>
                {item.knr_ref && (
                  <span className="shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
                    {item.knr_ref}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {isLoading && debouncedValue.length >= 2 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 py-2 shadow-lg">
          <div className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400 text-center">
            Szukam w bazie KNR...
          </div>
        </div>
      )}

      {!isLoading && isOpen && suggestions.length === 0 && debouncedValue.length >= 2 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 py-2 shadow-lg">
          <div className="px-4 py-2 text-sm text-slate-500 dark:text-slate-400 text-center">
            Nie znaleziono w bazie KNR
          </div>
        </div>
      )}
    </div>
  );
}
