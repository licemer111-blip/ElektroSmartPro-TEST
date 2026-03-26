"use client";

import { useState, useEffect, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  History,
  Clock,
  FileText,
  RotateCcw,
  GitBranch,
  Plus,
  Save,
  Loader2,
  FileJson,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { pl } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import {
  getProjectSnapshots,
  restoreSnapshot,
  createManualSnapshot,
  type SnapshotMeta,
} from "@/app/dashboard/projects/[id]/snapshot-actions";
import { useRouter } from "next/navigation";
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

interface ProjectHistoryProps {
  projectId: string;
  compact?: boolean;
  projectStatus?: string;
}

export function ProjectHistory({ projectId, projectStatus = "draft" }: ProjectHistoryProps) {
  const isFinal = projectStatus === "final";
  const [snapshots, setSnapshots] = useState<SnapshotMeta[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [versionName, setVersionName] = useState("");
  const [versionDesc, setVersionDesc] = useState("");
  const [isPending, startTransition] = useTransition();
  const [pendingRestore, setPendingRestore] = useState<SnapshotMeta | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    loadSnapshots();
  }, [projectId]);

  const loadSnapshots = async () => {
    setIsLoading(true);
    const data = await getProjectSnapshots(projectId);
    setSnapshots(data);
    setIsLoading(false);
  };

  const handleCreate = async () => {
    if (!versionName.trim()) {
      toast({ title: "Wprowadź nazwę wersji", variant: "destructive" });
      return;
    }

    startTransition(async () => {
      const result = await createManualSnapshot(projectId, versionName, versionDesc);
      if (result.error) {
        toast({ title: "Błąd", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "✅ Wersja utworzona", description: `Zapisano snapshot: ${versionName}` });
        setVersionName("");
        setVersionDesc("");
        setIsCreateOpen(false);
        loadSnapshots();
      }
    });
  };

  const handleRestore = (snapshot: SnapshotMeta) => {
    setPendingRestore(snapshot);
  };

  const executeRestore = () => {
    if (!pendingRestore) return;
    const snapshot = pendingRestore;
    setPendingRestore(null);
    startTransition(async () => {
      const result = await restoreSnapshot(projectId, snapshot.fileName);
      if (result.error) {
        toast({ title: "Błąd", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "✅ Przywrócono", description: `Przywrócono ${result.restoredCount} pozycji` });
        router.refresh();
      }
    });
  };

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleString("pl-PL", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch { return d; }
  };

  const parseSnapshotMeta = (snapshot: SnapshotMeta) => {
    // Try to extract version name from filename metadata
    const dateStr = formatDate(snapshot.date);
    let timeAgo = "";
    try {
      timeAgo = formatDistanceToNow(new Date(snapshot.date), { addSuffix: true, locale: pl });
    } catch { timeAgo = ""; }
    return { dateStr, timeAgo };
  };

  return (
    <>
      <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <GitBranch className="w-4 h-4 flex-shrink-0" />
            <span>Historia i wersje</span>
          </CardTitle>
          <Button
            onClick={() => {
              if (isFinal) {
                toast({ title: "🔒 Projekt zablokowany", description: "Odblokuj projekt, aby tworzyć wersje", variant: "destructive" });
                return;
              }
              setIsCreateOpen(true);
            }}
            size="sm"
            className={`bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0 ${isFinal ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <Plus className="w-4 h-4" />
            <span className="hidden xs:inline ml-1">Utwórz wersję</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Create new version */}
          {isCreateOpen && (
            <Card className="border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/30">
              <CardHeader>
                <CardTitle className="text-lg">Utwórz nową wersję</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label htmlFor="version-name" className="text-sm font-medium">Nazwa wersji</label>
                  <input
                    id="version-name"
                    name="version-name"
                    type="text"
                    autoComplete="off"
                    value={versionName}
                    onChange={(e) => setVersionName(e.target.value)}
                    placeholder="np. Wersja po zatwierdzeniu przez klienta"
                    className="w-full mt-1 px-3 py-2 border rounded-md bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor="version-desc" className="text-sm font-medium">Opis (opcjonalnie)</label>
                  <textarea
                    id="version-desc"
                    name="version-desc"
                    aria-label="Opis wersji"
                    value={versionDesc}
                    onChange={(e) => setVersionDesc(e.target.value)}
                    placeholder="Opis zmian w tej wersji..."
                    className="w-full mt-1 px-3 py-2 border rounded-md bg-white dark:bg-slate-900 dark:border-slate-700 dark:text-white"
                    rows={3}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreate} disabled={isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
                    {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    {isPending ? "Tworzenie..." : "Utwórz wersję"}
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    Anuluj
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Versions list */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Wersje projektu
            </h3>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              </div>
            ) : snapshots.length === 0 ? (
              <div className="text-center py-8 space-y-2">
                <FileJson className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-muted-foreground">Brak zapisanych wersji</p>
                <p className="text-xs text-slate-400">Kliknij &quot;Utwórz wersję&quot; aby zapisać aktualny stan kosztorysu</p>
              </div>
            ) : (
              <div className="space-y-2">
                {snapshots.map((snapshot, idx) => {
                  const { dateStr, timeAgo } = parseSnapshotMeta(snapshot);
                  return (
                    <div key={snapshot.fileName} className="flex items-center gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors">
                      <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex-shrink-0">
                        <History className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                          <Badge variant="secondary" className="text-[10px] flex-shrink-0">v{snapshots.length - idx}</Badge>
                          <span className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">
                            {dateStr}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {timeAgo}
                          </span>
                          {snapshot.itemCount > 0 && <span>{snapshot.itemCount} poz.</span>}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`h-7 text-xs gap-1 flex-shrink-0 ${isFinal ? "opacity-50 cursor-not-allowed" : ""}`}
                        onClick={() => {
                          if (isFinal) {
                            toast({ title: "🔒 Projekt zablokowany", description: "Odblokuj projekt, aby przywrócić wersję", variant: "destructive" });
                            return;
                          }
                          handleRestore(snapshot);
                        }}
                        disabled={isPending}
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span className="hidden xs:inline">Przywróć</span>
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>

      <AlertDialog open={!!pendingRestore} onOpenChange={(open) => !open && setPendingRestore(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Przywrócić wersję?</AlertDialogTitle>
            <AlertDialogDescription>
              Przywrócić kosztorys do wersji z{" "}
              <strong>{pendingRestore ? formatDate(pendingRestore.date) : ""}</strong>?<br />
              Obecne pozycje zostaną zastąpione. Ta operacja jest nieodwracalna.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={executeRestore} disabled={isPending} className="bg-blue-600 hover:bg-blue-700 text-white">
              {isPending ? <><Loader2 className="w-4 h-4 mr-1 animate-spin" />Przywrócanie...</> : "Przywróć"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

