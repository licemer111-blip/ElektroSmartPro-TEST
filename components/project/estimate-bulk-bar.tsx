"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, X, Percent, Loader2, LayoutGrid } from "lucide-react";

const SECTION_PRESETS = [
  "Kuchnia", "Łazienka", "Salon", "Sypialnia", "Korytarz",
  "Garaż", "Piwnica", "Taras", "Zewnętrzne", "Ogólne",
];

interface EstimateBulkBarProps {
  selectedCount: number;
  isBulkProcessing: boolean;
  onDelete: () => void;
  onPriceAdjust: (percent: number) => void;
  onSectionAssign?: (section: string | null) => void;
  onClear: () => void;
}

export function EstimateBulkBar({
  selectedCount,
  isBulkProcessing,
  onDelete,
  onPriceAdjust,
  onSectionAssign,
  onClear,
}: EstimateBulkBarProps) {
  const [showPriceDialog, setShowPriceDialog] = React.useState(false);
  const [showSectionDialog, setShowSectionDialog] = React.useState(false);
  const [pricePercent, setPricePercent] = React.useState("");
  const [selectedSection, setSelectedSection] = React.useState("__none__");

  if (selectedCount === 0) return null;

  const handleApplyPrice = () => {
    const pct = parseFloat(pricePercent);
    if (isNaN(pct)) return;
    onPriceAdjust(pct);
    setShowPriceDialog(false);
    setPricePercent("");
  };

  const handleApplySection = () => {
    if (!onSectionAssign) return;
    onSectionAssign(selectedSection === "__none__" ? null : selectedSection);
    setShowSectionDialog(false);
    setSelectedSection("__none__");
  };

  return (
    <>
      <div className="sticky bottom-3 z-30 px-3 sm:px-0 sm:mx-auto sm:w-fit animate-in slide-in-from-bottom-4 fade-in duration-300">
        <div className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-2xl border border-slate-700 dark:border-slate-300 w-full sm:w-auto">
          {/* Count badge */}
          <span className="text-xs sm:text-sm font-semibold tabular-nums whitespace-nowrap shrink-0">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-500 text-white text-[10px] font-bold mr-1">{selectedCount}</span>
            <span className="hidden sm:inline">zaznaczono</span>
          </span>

          <div className="w-px h-5 bg-slate-600 dark:bg-slate-400 shrink-0" />

          {onSectionAssign && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 px-2 sm:px-3 text-xs text-purple-400 dark:text-purple-600 hover:bg-purple-950 dark:hover:bg-purple-100 gap-1 shrink-0"
              onClick={() => setShowSectionDialog(true)}
              disabled={isBulkProcessing}
              title="Przypisz sekcję"
            >
              <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Sekcja</span>
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 sm:px-3 text-xs text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-200 gap-1 shrink-0"
            onClick={() => setShowPriceDialog(true)}
            disabled={isBulkProcessing}
            title="Zmień cenę"
          >
            <Percent className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Zmień cenę</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2 sm:px-3 text-xs text-red-400 dark:text-red-600 hover:bg-red-950 dark:hover:bg-red-100 gap-1 shrink-0"
            onClick={onDelete}
            disabled={isBulkProcessing}
            title="Usuń zaznaczone"
          >
            {isBulkProcessing
              ? <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
              : <Trash2 className="w-3.5 h-3.5 shrink-0" />}
            <span className="hidden sm:inline">Usuń</span>
          </Button>

          <div className="w-px h-5 bg-slate-600 dark:bg-slate-400 shrink-0" />

          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-slate-400 dark:text-slate-500 hover:bg-slate-800 dark:hover:bg-slate-200 shrink-0"
            onClick={onClear}
            title="Odznacz wszystko"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Price adjust dialog */}
      <AlertDialog open={showPriceDialog} onOpenChange={setShowPriceDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Zmień cenę zaznaczonych pozycji</AlertDialogTitle>
            <AlertDialogDescription>
              Podaj wartość procentową do skorygowania cen {selectedCount} pozycji.
              Np. +10 = podwyżka 10%, -15 = obniżka 15%.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-2">
              <Input
                id="bulk-price-percent"
                name="bulk-price-percent"
                type="number"
                step="1"
                aria-label="Procent zmiany ceny (np. +10 lub -15)"
                value={pricePercent}
                onChange={(e) => setPricePercent(e.target.value)}
                placeholder="np. +10 lub -15"
                className="flex-1"
                onKeyDown={(e) => { if (e.key === "Enter") handleApplyPrice(); }}
              />
              <span className="text-lg font-bold text-muted-foreground">%</span>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkProcessing}>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApplyPrice}
              disabled={isBulkProcessing || !pricePercent}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isBulkProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Zastosuj
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Section assign dialog */}
      <AlertDialog open={showSectionDialog} onOpenChange={setShowSectionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-purple-600" />
              Przypisz sekcję
            </AlertDialogTitle>
            <AlertDialogDescription>
              Wybierz sekcję (pomieszczenie) dla {selectedCount} zaznaczonych pozycji.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-3">
            <Select value={selectedSection} onValueChange={setSelectedSection}>
              <SelectTrigger>
                <SelectValue placeholder="Wybierz sekcję..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Bez sekcji (usuń)</SelectItem>
                {SECTION_PRESETS.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkProcessing}>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApplySection}
              disabled={isBulkProcessing}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {isBulkProcessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Przypisz
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
