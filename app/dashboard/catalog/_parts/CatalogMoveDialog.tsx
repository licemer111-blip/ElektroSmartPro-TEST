"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CatalogItem } from "../actions";

interface CatalogMoveDialogProps {
  item: CatalogItem;
  categories: { id: string; name: string; user_id?: string | null }[];
  targetCategoryId: string;
  onTargetChange: (value: string) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export function CatalogMoveDialog({
  item,
  categories,
  targetCategoryId,
  onTargetChange,
  onConfirm,
  onClose,
}: CatalogMoveDialogProps) {
  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">Przenieś do kategorii</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
          Przenieś <strong>{item.name}</strong> do innej kategorii
        </p>
        <Select name="move-category" value={targetCategoryId} onValueChange={onTargetChange}>
          <SelectTrigger id="move-category" aria-label="Wybierz kategorię">
            <SelectValue placeholder="Wybierz kategorię" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="uncategorized">Bez kategorii</SelectItem>
            {categories.map((cat) => (
              <SelectItem key={cat.id} value={cat.id}>
                {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={onClose}>
            Anuluj
          </Button>
          <Button
            onClick={onConfirm}
            className="bg-blue-600 text-white hover:bg-blue-700 shadow-sm border-transparent"
          >
            Przenieś
          </Button>
        </div>
      </div>
    </div>
  );
}
