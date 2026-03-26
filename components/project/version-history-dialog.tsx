"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  History,
  Clock,
  FileJson,
  ChevronRight,
  ArrowLeftRight,
  Plus,
  Minus,
  Equal,
  Loader2,
  RotateCcw,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getProjectSnapshots, restoreSnapshot, type SnapshotMeta } from "@/app/dashboard/projects/[id]/snapshot-actions";
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

interface VersionHistoryDialogProps {
  projectId: string;
  isPro?: boolean;
  disabled?: boolean;
}

interface SnapshotItem {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  final_material_price: number | null;
  final_labor_price: number | null;
  material_price: number | null;
  labor_price: number | null;
}

interface DiffResult {
  added: SnapshotItem[];
  removed: SnapshotItem[];
  changed: { before: SnapshotItem; after: SnapshotItem; changes: string[] }[];
  unchanged: number;
}

function computeDiff(older: SnapshotItem[], newer: SnapshotItem[], isPro = true): DiffResult {
  const olderMap = new Map(older.map(i => [i.id, i]));
  const newerMap = new Map(newer.map(i => [i.id, i]));

  const added: SnapshotItem[] = [];
  const removed: SnapshotItem[] = [];
  const changed: { before: SnapshotItem; after: SnapshotItem; changes: string[] }[] = [];
  let unchanged = 0;

  // Find added and changed
  for (const item of newer) {
    const old = olderMap.get(item.id);
    if (!old) {
      added.push(item);
    } else {
      const changes: string[] = [];
      if (old.name !== item.name) changes.push(`Nazwa: "${old.name}" → "${item.name}"`);
      if (old.quantity !== item.quantity) changes.push(`Ilość: ${old.quantity} → ${item.quantity}`);
      const oldMat = old.final_material_price ?? old.material_price ?? 0;
      const newMat = item.final_material_price ?? item.material_price ?? 0;
      if (oldMat !== newMat) changes.push(isPro ? `Materiał: ${oldMat.toFixed(2)} → ${newMat.toFixed(2)} zł` : 'Materiał: *** → *** zł');
      const oldLab = old.final_labor_price ?? old.labor_price ?? 0;
      const newLab = item.final_labor_price ?? item.labor_price ?? 0;
      if (oldLab !== newLab) changes.push(isPro ? `Robocizna: ${oldLab.toFixed(2)} → ${newLab.toFixed(2)} zł` : 'Robocizna: *** → *** zł');

      if (changes.length > 0) {
        changed.push({ before: old, after: item, changes });
      } else {
        unchanged++;
      }
    }
  }

  // Find removed
  for (const item of older) {
    if (!newerMap.has(item.id)) {
      removed.push(item);
    }
  }

  return { added, removed, changed, unchanged };
}

export function VersionHistoryDialog({ projectId, isPro, disabled }: VersionHistoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [pendingRestoreIdx, setPendingRestoreIdx] = useState<number | null>(null);
  const [snapshots, setSnapshots] = useState<SnapshotMeta[]>([]);
  const [selectedA, setSelectedA] = useState<number | null>(null);
  const [selectedB, setSelectedB] = useState<number | null>(null);
  const [diff, setDiff] = useState<DiffResult | null>(null);
  const [snapshotData, setSnapshotData] = useState<Map<string, SnapshotItem[]>>(new Map());
  const { toast } = useToast();

  const loadSnapshots = async () => {
    setLoading(true);
    const data = await getProjectSnapshots(projectId);
    setSnapshots(data);
    setLoading(false);
  };

  useEffect(() => {
    if (open) {
      loadSnapshots();
      setSelectedA(null);
      setSelectedB(null);
      setDiff(null);
    }
  }, [open]);

  const handleCompare = async () => {
    if (selectedA === null || selectedB === null) return;
    const a = snapshots[selectedA];
    const b = snapshots[selectedB];
    if (!a || !b) return;

    // Load snapshot data if not cached
    const cache = new Map(snapshotData);
    for (const s of [a, b]) {
      if (!cache.has(s.fileName)) {
        const res = await fetch(`/api/snapshot/${projectId}/${encodeURIComponent(s.fileName)}`);
        if (res.ok) {
          const json = await res.json();
          cache.set(s.fileName, json.items || []);
        }
      }
    }
    setSnapshotData(cache);

    const itemsA = cache.get(a.fileName) || [];
    const itemsB = cache.get(b.fileName) || [];
    setDiff(computeDiff(itemsA, itemsB, isPro));
  };

  const handleRestore = (idx: number) => {
    setPendingRestoreIdx(idx);
  };

  const executeRestore = async () => {
    if (pendingRestoreIdx === null) return;
    const s = snapshots[pendingRestoreIdx];
    if (!s) return;
    setPendingRestoreIdx(null);
    setRestoring(true);
    const result = await restoreSnapshot(projectId, s.fileName);
    if (result.error) {
      toast({ title: "Błąd", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "✅ Przywrócono", description: `Przywrócono ${result.restoredCount} pozycji z wersji ${formatDate(s.date)}` });
      setOpen(false);
    }
    setRestoring(false);
  };

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleString("pl-PL", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch { return d; }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-7 sm:h-8 text-[11px] sm:text-xs gap-1 bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0 rounded-md" disabled={disabled}>
          <History className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Historia wersji</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <History className="w-5 h-5 text-indigo-600" />
            Historia wersji kosztorysu
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          </div>
        ) : snapshots.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <FileJson className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm text-slate-500">Brak zapisanych wersji</p>
            <p className="text-xs text-slate-400">Wersja jest zapisywana automatycznie przy finalizacji projektu</p>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col gap-4">
            {/* Snapshots list */}
            <ScrollArea className="max-h-[200px]">
              <div className="space-y-1.5">
                {snapshots.map((s, idx) => (
                  <div
                    key={s.fileName}
                    className={`flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                      selectedA === idx
                        ? "border-blue-300 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800"
                        : selectedB === idx
                        ? "border-emerald-300 bg-emerald-50 dark:bg-emerald-950/20 dark:border-emerald-800"
                        : "border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900"
                    }`}
                    onClick={() => {
                      if (selectedA === null || selectedA === idx) {
                        setSelectedA(selectedA === idx ? null : idx);
                      } else if (selectedB === null || selectedB === idx) {
                        setSelectedB(selectedB === idx ? null : idx);
                      } else {
                        setSelectedA(idx);
                        setSelectedB(null);
                      }
                      setDiff(null);
                    }}
                  >
                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-slate-700 dark:text-slate-200">
                        {formatDate(s.date)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {s.itemCount} pozycji
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {selectedA === idx && <Badge className="text-[9px] bg-blue-100 text-blue-700 px-1.5">A</Badge>}
                      {selectedB === idx && <Badge className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5">B</Badge>}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => { e.stopPropagation(); handleRestore(idx); }}
                        disabled={restoring}
                        title="Przywróć tę wersję"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Compare button */}
            {selectedA !== null && selectedB !== null && selectedA !== selectedB && (
              <Button
                size="sm"
                className="w-full h-8 text-xs bg-indigo-600 hover:bg-indigo-700 gap-1.5"
                onClick={handleCompare}
              >
                <ArrowLeftRight className="w-3.5 h-3.5" />
                Porównaj wersje A ↔ B
              </Button>
            )}

            {/* Diff view */}
            {diff && (
              <ScrollArea className="flex-1 max-h-[300px] border rounded-lg">
                <div className="p-3 space-y-3">
                  {/* Summary */}
                  <div className="flex flex-wrap gap-2 text-xs">
                    {diff.added.length > 0 && (
                      <Badge className="bg-green-100 text-green-700 gap-1 px-2">
                        <Plus className="w-3 h-3" />+{diff.added.length} dodanych
                      </Badge>
                    )}
                    {diff.removed.length > 0 && (
                      <Badge className="bg-red-100 text-red-700 gap-1 px-2">
                        <Minus className="w-3 h-3" />-{diff.removed.length} usuniętych
                      </Badge>
                    )}
                    {diff.changed.length > 0 && (
                      <Badge className="bg-amber-100 text-amber-700 gap-1 px-2">
                        <ArrowLeftRight className="w-3 h-3" />{diff.changed.length} zmienionych
                      </Badge>
                    )}
                    <Badge variant="outline" className="gap-1 px-2">
                      <Equal className="w-3 h-3" />{diff.unchanged} bez zmian
                    </Badge>
                  </div>

                  {/* Added items */}
                  {diff.added.map(item => (
                    <div key={item.id} className="p-2 rounded bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Plus className="w-3 h-3 text-green-600" />
                        <span className="font-medium text-green-800 dark:text-green-300">{item.name}</span>
                        <span className="text-green-600">({item.quantity} {item.unit})</span>
                      </div>
                    </div>
                  ))}

                  {/* Removed items */}
                  {diff.removed.map(item => (
                    <div key={item.id} className="p-2 rounded bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Minus className="w-3 h-3 text-red-600" />
                        <span className="font-medium text-red-800 dark:text-red-300 line-through">{item.name}</span>
                        <span className="text-red-600">({item.quantity} {item.unit})</span>
                      </div>
                    </div>
                  ))}

                  {/* Changed items */}
                  {diff.changed.map(({ after, changes }) => (
                    <div key={after.id} className="p-2 rounded bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                      <div className="text-xs font-medium text-amber-800 dark:text-amber-300 mb-1">{after.name}</div>
                      {changes.map((c, i) => (
                        <div key={i} className="text-[10px] text-amber-700 dark:text-amber-400 pl-3">
                          <ChevronRight className="w-2.5 h-2.5 inline mr-0.5" />{c}
                        </div>
                      ))}
                    </div>
                  ))}

                  {diff.added.length === 0 && diff.removed.length === 0 && diff.changed.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-4">Brak różnic między wersjami</p>
                  )}
                </div>
              </ScrollArea>
            )}
          </div>
        )}
      </DialogContent>
      <AlertDialog open={pendingRestoreIdx !== null} onOpenChange={(open) => !open && setPendingRestoreIdx(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Przywrócić wersję?</AlertDialogTitle>
            <AlertDialogDescription>
              Przywrócić kosztorys do wersji z{" "}
              <strong>{pendingRestoreIdx !== null && snapshots[pendingRestoreIdx] ? formatDate(snapshots[pendingRestoreIdx].date) : ""}</strong>?{" "}
              Obecne pozycje zostaną zastąpione. Tej operacji nie można cofnąć.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={restoring}>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={executeRestore} disabled={restoring} className="bg-blue-600 hover:bg-blue-700 text-white">
              {restoring ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Przywracanie...</> : "Przywróć"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
