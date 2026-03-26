"use client";

import { memo, useRef, useEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { CheckCircle2, Pencil, Trash2, Check, AlertCircle, Sparkles } from "lucide-react";
import type { AIProjectItem, ExcelRow } from "@/components/project/ai-import-dialog-reducer";

// ─── Constants ────────────────────────────────────────────────────────────────

const VIRTUAL_THRESHOLD = 30;
const ITEM_HEIGHT_NORMAL = 72;
const ITEM_HEIGHT_EDITING = 192;

// ─── ImportItemRow ────────────────────────────────────────────────────────────

interface ImportItemRowProps {
  item: AIProjectItem;
  index: number;
  isSelected: boolean;
  isEditing: boolean;
  isPro: boolean;
  onToggle: (i: number) => void;
  onEdit: (i: number | null) => void;
  onRemove: (i: number) => void;
  onUpdate: (i: number, field: keyof AIProjectItem, value: string | number) => void;
}

const ImportItemRow = memo(function ImportItemRow({
  item, index, isSelected, isEditing, isPro, onToggle, onEdit, onRemove, onUpdate,
}: ImportItemRowProps) {
  const total = (item.material_price + item.labor_price) * item.quantity;
  return (
    <div className={`rounded-lg border p-2.5 transition-all ${isSelected ? "border-orange-200 dark:border-orange-800 bg-orange-50/30 dark:bg-orange-950/10" : "border-slate-200 dark:border-slate-700 opacity-50"}`}>
      <div className="flex items-start gap-2">
        <button
          onClick={() => onToggle(index)}
          className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${isSelected ? "border-orange-500 bg-orange-500 text-white" : "border-slate-300 dark:border-slate-600"}`}
        >
          {isSelected && <CheckCircle2 className="w-3 h-3" />}
        </button>
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-1.5">
              {/* Row 1: Name */}
              <Input
                id={`import-name-${index}`}
                name={`import-name-${index}`}
                aria-label="Nazwa pozycji"
                value={item.name}
                onChange={(e) => onUpdate(index, "name", e.target.value)}
                className="h-7 text-xs"
                placeholder="Nazwa"
              />
              {/* Row 2: Qty + Unit */}
              <div className="grid grid-cols-2 gap-1.5">
                <div>
                  <label htmlFor={`import-qty-${index}`} className="text-[10px] text-muted-foreground">Ilość</label>
                  <Input id={`import-qty-${index}`} name={`import-qty-${index}`} type="number" value={item.quantity} onChange={(e) => onUpdate(index, "quantity", parseFloat(e.target.value) || 0)} className="h-7 text-xs" />
                </div>
                <div>
                  <label htmlFor={`import-unit-${index}`} className="text-[10px] text-muted-foreground">Jedn.</label>
                  <Input id={`import-unit-${index}`} name={`import-unit-${index}`} value={item.unit} onChange={(e) => onUpdate(index, "unit", e.target.value)} className="h-7 text-xs" />
                </div>
              </div>
              {/* Row 3: Mat + Rob + OK */}
              <div className="grid grid-cols-[1fr_1fr_auto] gap-1.5 items-end">
                <div>
                  <label htmlFor={`import-mat-${index}`} className="text-[10px] text-muted-foreground">Mat. (zł)</label>
                  <Input id={`import-mat-${index}`} name={`import-mat-${index}`} type="number" value={item.material_price} onChange={(e) => onUpdate(index, "material_price", parseFloat(e.target.value) || 0)} className="h-7 text-xs" />
                </div>
                <div>
                  <label htmlFor={`import-lab-${index}`} className="text-[10px] text-muted-foreground">Rob. (zł)</label>
                  <Input id={`import-lab-${index}`} name={`import-lab-${index}`} type="number" value={item.labor_price} onChange={(e) => onUpdate(index, "labor_price", parseFloat(e.target.value) || 0)} className="h-7 text-xs" />
                </div>
                <Button size="sm" onClick={() => onEdit(null)} className="h-7 px-3 text-xs bg-orange-500 hover:bg-orange-600 text-white whitespace-nowrap">
                  <Check className="w-3 h-3 mr-1" /> OK
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-xs font-medium leading-snug line-clamp-2" title={item.name}>{item.name}</p>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <Badge variant="outline" className="text-[10px] h-5 px-1.5">{item.quantity} {item.unit}</Badge>
                <span className="text-[10px] text-muted-foreground">Mat: {isPro ? `${item.material_price.toFixed(2)} zł` : "***"}</span>
                <span className="text-[10px] text-muted-foreground/40">|</span>
                <span className="text-[10px] text-muted-foreground">Rob: {isPro ? `${item.labor_price.toFixed(2)} zł` : "***"}</span>
                <span className="text-[10px] text-muted-foreground/40">|</span>
                <span className="text-[10px] font-semibold text-orange-600 dark:text-orange-400">= {isPro ? `${total.toFixed(2)} zł` : "*** zł"}</span>
                {item.knr_code && item.knr_source !== "es_synthetic" && (
                  <span
                    className="text-[9px] font-mono px-1 rounded bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300"
                    title="Kod KNR"
                  >
                    {item.knr_code}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
        {!isEditing && (
          <div className="flex items-center gap-0.5 flex-shrink-0">
            <Button variant="ghost" size="sm" onClick={() => onEdit(index)} className="h-6 w-6 p-0 text-muted-foreground hover:text-orange-600">
              <Pencil className="w-3 h-3" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => onRemove(index)} className="h-6 w-6 p-0 text-muted-foreground hover:text-red-600">
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}, (prev, next) =>
  prev.isSelected === next.isSelected &&
  prev.isEditing === next.isEditing &&
  prev.item === next.item &&
  prev.isPro === next.isPro
);

// ─── VirtualizedImportList ────────────────────────────────────────────────────

interface VirtualizedImportListProps {
  items: AIProjectItem[];
  selectedItems: Set<number>;
  editingIndex: number | null;
  isPro: boolean;
  onToggle: (i: number) => void;
  onEdit: (i: number | null) => void;
  onRemove: (i: number) => void;
  onUpdate: (i: number, field: keyof AIProjectItem, value: string | number) => void;
}

function VirtualizedImportList({
  items, selectedItems, editingIndex, isPro, onToggle, onEdit, onRemove, onUpdate,
}: VirtualizedImportListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => editingIndex === index ? ITEM_HEIGHT_EDITING : ITEM_HEIGHT_NORMAL,
    measureElement: (el) => el.getBoundingClientRect().height,
    overscan: 5,
  });

  // When editing row changes, force re-measurement of that row
  useEffect(() => {
    if (editingIndex !== null) {
      rowVirtualizer.resizeItem(editingIndex, ITEM_HEIGHT_EDITING);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingIndex]);

  if (items.length <= VIRTUAL_THRESHOLD) {
    return (
      <div className="h-[42vh] overflow-y-auto">
        <div className="flex flex-col gap-1.5 pr-3 pb-2">
          {items.map((item, index) => (
            <ImportItemRow
              key={index}
              item={item}
              index={index}
              isSelected={selectedItems.has(index)}
              isEditing={editingIndex === index}
              isPro={isPro}
              onToggle={onToggle}
              onEdit={onEdit}
              onRemove={onRemove}
              onUpdate={onUpdate}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={parentRef} className="h-[42vh] overflow-y-auto pr-1">
      <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: "relative" }}>
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const index = virtualRow.index;
          const item = items[index];
          return (
            <div
              key={index}
              data-index={index}
              ref={rowVirtualizer.measureElement}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                transform: `translateY(${virtualRow.start}px)`,
                paddingBottom: "8px",
                paddingRight: "12px",
              }}
            >
              <ImportItemRow
                item={item}
                index={index}
                isSelected={selectedItems.has(index)}
                isEditing={editingIndex === index}
                isPro={isPro}
                onToggle={onToggle}
                onEdit={onEdit}
                onRemove={onRemove}
                onUpdate={onUpdate}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── ExcelPreviewTable ────────────────────────────────────────────────────────

interface ExcelPreviewTableProps {
  rows: ExcelRow[];
  headers: string[];
  validCount: number;
  invalidCount: number;
}

export const ExcelPreviewTable = memo(function ExcelPreviewTable({
  rows, headers, validCount, invalidCount,
}: ExcelPreviewTableProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 text-green-600 font-medium">
            <Check className="w-3.5 h-3.5" />
            {validCount} pozycji gotowych
          </span>
          {invalidCount > 0 && (
            <span className="flex items-center gap-1 text-red-500">
              <AlertCircle className="w-3.5 h-3.5" />
              {invalidCount} z błędami
            </span>
          )}
        </div>
        <span className="text-[10px] text-slate-400">{headers.length} kolumn auto-wykrytych</span>
      </div>
      <ScrollArea className="h-[44vh] border rounded-lg">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0 z-10">
            <tr>
              <th className="p-2 text-left font-medium">Nazwa</th>
              <th className="p-2 text-center font-medium w-10">Jdn.</th>
              <th className="p-2 text-center font-medium w-10">Ilość</th>
              <th className="p-2 text-right font-medium w-16">Mat.</th>
              <th className="p-2 text-right font-medium w-16">Rob.</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={`border-t border-slate-100 dark:border-slate-800 ${!row.valid ? "bg-red-50/50 dark:bg-red-950/10" : ""}`}>
                <td className="p-2 max-w-[180px]">
                  <span className={`leading-tight block ${!row.valid ? "text-red-500" : ""}`}>{row.name || "—"}</span>
                  {row.section && <span className="text-[9px] text-slate-400">{row.section}</span>}
                  {row.error && <span className="block text-[9px] text-red-400">{row.error}</span>}
                </td>
                <td className="p-2 text-center text-slate-500">{row.unit}</td>
                <td className="p-2 text-center">{row.quantity}</td>
                <td className="p-2 text-right text-amber-700 dark:text-amber-400">
                  {row.materialPrice > 0 ? row.materialPrice.toFixed(2) : <span className="text-slate-300">—</span>}
                </td>
                <td className="p-2 text-right text-emerald-700 dark:text-emerald-400">
                  {row.laborPrice > 0 ? row.laborPrice.toFixed(2) : <span className="text-slate-300">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </ScrollArea>
    </div>
  );
});

// ─── AIPreviewPanel (main export) ────────────────────────────────────────────

interface AIPreviewPanelProps {
  items: AIProjectItem[];
  selectedItems: Set<number>;
  editingIndex: number | null;
  isPro: boolean;
  error: string | null;
  onToggle: (i: number) => void;
  onToggleAll: () => void;
  onEdit: (i: number | null) => void;
  onRemove: (i: number) => void;
  onUpdate: (i: number, field: keyof AIProjectItem, value: string | number) => void;
}

export const AIPreviewPanel = memo(function AIPreviewPanel({
  items, selectedItems, editingIndex, isPro, error,
  onToggle, onToggleAll, onEdit, onRemove, onUpdate,
}: AIPreviewPanelProps) {
  return (
    <div className="space-y-3 py-2">
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-sm text-red-700 dark:text-red-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /><span>{error}</span>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300">
          <Sparkles className="w-3 h-3 mr-1" />
          ES-Engine zidentyfikował {items.length} pozycji
        </Badge>
        <Button variant="ghost" size="sm" onClick={onToggleAll} className="text-xs h-7">
          {selectedItems.size === items.length ? "Odznacz" : "Zaznacz"} wszystko
        </Button>
      </div>

      <VirtualizedImportList
        items={items}
        selectedItems={selectedItems}
        editingIndex={editingIndex}
        isPro={isPro}
        onToggle={onToggle}
        onEdit={onEdit}
        onRemove={onRemove}
        onUpdate={onUpdate}
      />
    </div>
  );
});
