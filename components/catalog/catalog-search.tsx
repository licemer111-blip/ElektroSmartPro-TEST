'use client';

import { useState, useEffect, useId } from 'react';
import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { SearchModeSelector } from '@/components/catalog/SearchModeSelector';
import type { DataSourceMode } from '@/hooks/use-search-mode';

export function CatalogSearch() {
  const searchId = useId();
  const [value, setValue] = useState('');
  const [mode, setModeState] = useState<DataSourceMode>('hybrid');

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const param = searchParams.get('search');
    if (param) setValue(param);
    const modeParam = searchParams.get('mode') as DataSourceMode | null;
    if (modeParam && ['own', 'engine', 'hybrid'].includes(modeParam)) setModeState(modeParam);
  }, [searchParams]);

  const handleSearch = (term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set('search', term);
    } else {
      params.delete('search');
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleModeChange = (newMode: DataSourceMode) => {
    setModeState(newMode);
    const params = new URLSearchParams(searchParams);
    params.set('mode', newMode);
    params.delete('page');
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setValue(text);
    handleSearch(text);
  };

  const handleClear = () => {
    setValue('');
    handleSearch('');
  };

  return (
    <div className="flex items-center gap-2 w-full">
      <SearchModeSelector
        mode={mode}
        onChange={handleModeChange}
        className="flex-shrink-0"
      />
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          id={searchId}
          name={searchId}
          aria-label="Szukaj pozycji katalogowych"
          placeholder="Szukaj pozycji (np. puszka, kabel)..."
          value={value}
          onChange={handleChange}
          className="pl-9 pr-9"
        />
        {value && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
