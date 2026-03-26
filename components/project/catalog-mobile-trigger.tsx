"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Plus } from "lucide-react";
import { CatalogSidebar } from "./catalog-sidebar";
import { useTabSyncOptional } from "./tab-sync-context";
import { useToast } from "@/hooks/use-toast";
import type { CatalogCategory, CatalogItem } from "@/lib/types/database";

interface CatalogMobileTriggerProps {
  projectId: string;
  categories: CatalogCategory[];
  catalogItemsByCategory: { categoryId: string; items: CatalogItem[] }[];
  isPro: boolean;
  className?: string;
  projectStatus?: string;
}

export function CatalogMobileTrigger({
  projectId,
  categories,
  catalogItemsByCategory,
  isPro,
  className,
  projectStatus = "draft",
}: CatalogMobileTriggerProps) {
  const isFinal = projectStatus === "final";
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  
  // UI Sync context for Following mode
  const tabSyncContext = useTabSyncOptional();

  // ─── Stable refs for tabSyncContext to avoid loops ─────────────────────
  const tabSyncSetUIStateRef = useRef(tabSyncContext?.setUIState);
  const tabSyncIsExternalSyncRef = useRef(tabSyncContext?.isExternalSync);
  tabSyncSetUIStateRef.current = tabSyncContext?.setUIState;
  tabSyncIsExternalSyncRef.current = tabSyncContext?.isExternalSync;

  // Sync catalog sheet open state with context (for Following mode)
  useEffect(() => {
    if (tabSyncContext?.isExternalSync) {
      const shouldBeOpen = tabSyncContext?.uiState?.catalogOpen;
      if (shouldBeOpen !== undefined && shouldBeOpen !== isOpen) {
        setIsOpen(shouldBeOpen);
      }
    }
  }, [tabSyncContext?.isExternalSync, tabSyncContext?.uiState?.catalogOpen]);

  // Broadcast catalog sheet open state to context
  useEffect(() => {
    if (!tabSyncIsExternalSyncRef.current) {
      tabSyncSetUIStateRef.current?.({ catalogOpen: isOpen });
    }
  }, [isOpen]);

  const handleOpen = (open: boolean) => {
    if (open && isFinal) {
      toast({
        title: "🔒 Projekt zablokowany",
        description: "Odblokuj projekt, aby dodawać pozycje do kosztorysu",
        variant: "destructive",
      });
      return;
    }
    setIsOpen(open);
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpen}>
      <SheetTrigger asChild>
        <Button className={`${className} ${isFinal ? "opacity-50" : ""}`}>
          <Plus className="w-4 h-4 mr-2" />
          Katalog
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] flex flex-col p-0">
        <SheetHeader className="px-6 pt-6 pb-4 border-b">
          <SheetTitle>Katalog pozycji</SheetTitle>
          <SheetDescription className="sr-only">
            Przeglądaj i dodawaj pozycje z katalogu do projektu
          </SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-hidden">
          <CatalogSidebar
            projectId={projectId}
            categories={categories}
            catalogItemsByCategory={catalogItemsByCategory}
            isPro={isPro}
            projectStatus={projectStatus}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
