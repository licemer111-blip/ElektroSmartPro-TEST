"use client";

import { Input } from "@/components/ui/input";
import { Copy, Search } from "lucide-react";

export interface TemplateFiltersProps {
  searchTerm: string;
  onSearchChange: (v: string) => void;
}

export function TemplateFilters({ searchTerm, onSearchChange }: TemplateFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Copy className="w-6 h-6 text-blue-600" />
          Szablony projektów
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Twórz projekty w sekundy z gotowych szablonów — raz utwórz, używaj wielokrotnie
        </p>
      </div>
      <div className="relative w-full sm:w-64">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          id="template-search"
          name="template-search"
          aria-label="Szukaj szablonów"
          placeholder="Szukaj szablonów..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
      </div>
    </div>
  );
}
