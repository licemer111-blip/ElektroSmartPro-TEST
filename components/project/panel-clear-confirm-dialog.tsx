"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import type { PanelSection } from "./panel-configurator-types";

interface PanelClearConfirmDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  allModulesCount: number;
  allAccessoriesCount: number;
  setSections: React.Dispatch<React.SetStateAction<PanelSection[]>>;
  setSelectedUid: (uid: string | null) => void;
  toast: (opts: { title: string; description?: string }) => void;
}

export function PanelClearConfirmDialog({
  open, onOpenChange, allModulesCount, allAccessoriesCount, setSections, setSelectedUid, toast,
}: PanelClearConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <Trash2 className="w-5 h-5" />
            Wyczyścić wszystkie moduły?
          </DialogTitle>
          <DialogDescription className="text-sm">
            Ta operacja usunie <strong>wszystkie urządzenia</strong> ze wszystkich szyn DIN we wszystkich sekcjach ({allModulesCount + allAccessoriesCount} poz.). Akcesoria i materiały również zostaną usunięte.
            <br /><br />
            <span className="text-red-600 font-semibold">Tej operacji nie można cofnąć.</span>
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 justify-end mt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Anuluj</Button>
          <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white"
            onClick={() => {
              setSections(prev => prev.map(s => ({ ...s, modules: [], accessories: [] })));
              setSelectedUid(null);
              onOpenChange(false);
              toast({ title: "Wyczyszczono", description: "Wszystkie moduły zostały usunięte z szyn DIN." });
            }}>
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Tak, wyczyść wszystko
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
