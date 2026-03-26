"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { bulkDeleteProjectItems, bulkUpdateItemPrices, bulkUpdateItemSection } from "@/app/dashboard/projects/[id]/actions";
import { notifyDataChanged } from "@/hooks/use-synced-action";
import { useToast } from "@/hooks/use-toast";
import { EstimateBulkBar } from "@/components/project/estimate-bulk-bar";
import type { ProjectItem } from "@/lib/types/database";

interface EstimateBulkActionsProps {
  projectId: string;
  selectedIds: Set<string>;
  isFinal: boolean;
  isReadOnly: boolean;
  onClear: () => void;
  onOptimisticSectionUpdate: (ids: Set<string>, section: string | null) => void;
}

export function EstimateBulkActions({
  projectId,
  selectedIds,
  isFinal,
  isReadOnly,
  onClear,
  onOptimisticSectionUpdate,
}: EstimateBulkActionsProps) {
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0 || isFinal) return;
    setIsBulkProcessing(true);
    try {
      const result = await bulkDeleteProjectItems(projectId, Array.from(selectedIds));
      if (result.error) {
        toast({ title: "Błąd", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Usunięto", description: `Usunięto ${result.count} pozycji` });
        onClear();
        notifyDataChanged("items-bulk-deleted");
        router.refresh();
      }
    } catch {
      toast({ title: "Błąd", description: "Nie udało się usunąć pozycji", variant: "destructive" });
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkPriceAdjust = async (pct?: number) => {
    if (pct === undefined || isNaN(pct) || selectedIds.size === 0) return;
    setIsBulkProcessing(true);
    try {
      const result = await bulkUpdateItemPrices(projectId, Array.from(selectedIds), pct);
      if (result.error) {
        toast({ title: "Błąd", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Zaktualizowano", description: `Zmieniono ceny ${result.count} pozycji o ${pct > 0 ? "+" : ""}${pct}%` });
        onClear();
        notifyDataChanged("items-bulk-updated");
        router.refresh();
      }
    } catch {
      toast({ title: "Błąd", description: "Nie udało się zaktualizować cen", variant: "destructive" });
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkSectionAssign = async (section: string | null) => {
    if (selectedIds.size === 0) return;
    setIsBulkProcessing(true);
    try {
      const result = await bulkUpdateItemSection(projectId, Array.from(selectedIds), section);
      if (result.error) {
        toast({ title: "Błąd", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Zaktualizowano", description: `Przypisano sekcję "${section || "Bez sekcji"}" do ${result.count} pozycji` });
        onOptimisticSectionUpdate(selectedIds, section);
        onClear();
        notifyDataChanged("items-section-updated");
        router.refresh();
      }
    } catch {
      toast({ title: "Błąd", description: "Nie udało się zaktualizować sekcji", variant: "destructive" });
    } finally {
      setIsBulkProcessing(false);
    }
  };

  if (isFinal || isReadOnly) return null;

  return (
    <EstimateBulkBar
      selectedCount={selectedIds.size}
      isBulkProcessing={isBulkProcessing}
      onDelete={handleBulkDelete}
      onPriceAdjust={handleBulkPriceAdjust}
      onSectionAssign={handleBulkSectionAssign}
      onClear={onClear}
    />
  );
}
