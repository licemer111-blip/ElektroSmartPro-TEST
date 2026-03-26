"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Package } from "lucide-react";
import { CatalogSidebar } from "./catalog-sidebar";
import type { CatalogCategory, CatalogItem } from "@/lib/types/database";

interface MobileCatalogSheetProps {
  projectId: string;
  categories: CatalogCategory[];
  catalogItemsByCategory: { categoryId: string; items: CatalogItem[] }[];
  isPro: boolean;
}

export function MobileCatalogSheet({ 
  projectId, 
  categories, 
  catalogItemsByCategory, 
  isPro 
}: MobileCatalogSheetProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          size="sm" 
          className="lg:hidden w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          <Package className="w-4 h-4 mr-2" />
          Katalog
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] p-0 rounded-t-2xl overflow-hidden [&>button]:right-3 [&>button]:top-3 [&>button]:rounded-full [&>button]:w-8 [&>button]:h-8 [&>button]:flex [&>button]:items-center [&>button]:justify-center [&>button]:bg-slate-100 [&>button]:dark:bg-slate-800 [&>button]:hover:bg-slate-200 [&>button]:dark:hover:bg-slate-700 [&>button]:transition-all [&>button]:duration-200 [&>button]:hover:scale-110 [&>button]:shadow-sm">
        <SheetTitle className="sr-only">Katalog pozycji</SheetTitle>
        <CatalogSidebar
          projectId={projectId}
          categories={categories}
          catalogItemsByCategory={catalogItemsByCategory}
          isPro={isPro}
        />
      </SheetContent>
    </Sheet>
  );
}
