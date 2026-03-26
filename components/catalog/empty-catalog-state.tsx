"use client";

import { EmptyState } from "@/components/ui/empty-state";
import { Database } from "lucide-react";

export function EmptyCatalogState() {
  return (
    <EmptyState
      icon={Database}
      title="Twój katalog jest pusty"
      description="Masz 2 opcje: (1) Dodaj własne pozycje przyciskiem '+ Dodaj Pozycję'. (2) Użyj ES Creator do automatycznego generowania pozycji. Ceny w katalogu rozdzielone na materiał i robociznę."
    />
  );
}
