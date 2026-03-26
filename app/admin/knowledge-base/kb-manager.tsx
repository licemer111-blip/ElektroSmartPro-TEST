"use client";

import { useState, useCallback, useEffect } from "react";
import { CheckCircle2, AlertCircle, Database, FolderOpen, Settings2, Trash2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { uploadKbFile, deleteKbFile, deleteKbFiles, listKbFiles } from "./actions";
import { getAdminSettings, saveExpertDirectives } from "@/app/actions/admin-settings";
import type { KbFile } from "./actions";
import type { KnrCategory } from "./_parts/KbFilesPanel";
import { KbSettingsPanel } from "./_parts/KbSettingsPanel";
import { KbFilesPanel } from "./_parts/KbFilesPanel";
import { KbKnrImportPanel } from "./_parts/KbKnrImportPanel";

const ALLOWED_EXTENSIONS = [".json", ".csv", ".xlsx", ".xls", ".pdf", ".txt"];

function getExtension(fileName: string): string {
  const idx = fileName.lastIndexOf(".");
  return idx !== -1 ? fileName.slice(idx).toLowerCase() : "";
}

type ToastState = { type: "success" | "error"; message: string } | null;

interface KbManagerProps {
  initialFiles: KbFile[];
  knrCategories: KnrCategory[];
}

export function KbManager({ initialFiles, knrCategories }: KbManagerProps) {
  const [files, setFiles] = useState<KbFile[]>(initialFiles);
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingFile, setDeletingFile] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  const [directives, setDirectives] = useState("");
  const [isSavingDirectives, setIsSavingDirectives] = useState(false);

  useEffect(() => {
    getAdminSettings().then((s) => {
      setDirectives(s.directives);
    }).catch(() => {});
  }, []);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleSaveDirectives = async () => {
    setIsSavingDirectives(true);
    const result = await saveExpertDirectives(directives);
    setIsSavingDirectives(false);
    showToast(result.success ? "success" : "error", result.success ? "Dyrektywy zapisane — AI użyje ich przy następnym zapytaniu" : (result.error ?? "Błąd zapisu"));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    const result = await listKbFiles();
    if (result.error) {
      showToast("error", result.error);
    } else {
      setFiles(result.files);
      setSelectedFiles(new Set());
      showToast("success", `Odświeżono — ${result.files.length} plików`);
    }
    setRefreshing(false);
  };

  const handleUpload = useCallback(async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];
    const ext = getExtension(file.name);
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      showToast("error", `Niedozwolony format. Obsługiwane: ${ALLOWED_EXTENSIONS.join(", ")}`);
      return;
    }
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const result = await uploadKbFile(fd);
    if (result.success) {
      showToast("success", `Wgrano: ${result.fileName}`);
      const refreshed = await listKbFiles();
      if (!refreshed.error) setFiles(refreshed.files);
    } else {
      showToast("error", result.error ?? "Błąd uploadu");
    }
    setUploading(false);
  }, []);

  const handleDeleteConfirm = async (fileName: string) => {
    setDeletingFile(fileName);
    const result = await deleteKbFile(fileName);
    if (result.success) {
      setFiles((prev) => prev.filter((f) => f.name !== fileName));
      setSelectedFiles((prev) => { const next = new Set(prev); next.delete(fileName); return next; });
      showToast("success", `Usunięto: ${fileName}`);
    } else {
      showToast("error", result.error ?? "Błąd usuwania");
    }
    setDeletingFile(null);
    setConfirmDelete(null);
  };

  const handleBulkDeleteConfirm = async () => {
    if (selectedFiles.size === 0) return;
    setBulkDeleting(true);
    setConfirmBulkDelete(false);
    const result = await deleteKbFiles(Array.from(selectedFiles));
    if (result.deleted.length > 0) {
      setFiles((prev) => prev.filter((f) => !result.deleted.includes(f.name)));
      setSelectedFiles(new Set());
      showToast("success", `Usunięto ${result.deleted.length} plik${result.deleted.length === 1 ? "" : "ów"}`);
    }
    if (result.errors.length > 0) {
      showToast("error", result.errors[0]);
    }
    setBulkDeleting(false);
  };

  const handleToggleSelect = (fileName: string) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(fileName)) next.delete(fileName); else next.add(fileName);
      return next;
    });
  };

  const handleSelectAll = (fileNames: string[]) => {
    setSelectedFiles((prev) =>
      prev.size === fileNames.length ? new Set() : new Set(fileNames)
    );
  };

  return (
    <div className="space-y-8">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium transition-all ${
          toast.type === "success"
            ? "bg-emerald-50 border border-emerald-200 text-emerald-800"
            : "bg-red-50 border border-red-200 text-red-800"
        }`}>
          {toast.type === "success"
            ? <CheckCircle2 className="w-4 h-4 shrink-0" />
            : <AlertCircle className="w-4 h-4 shrink-0" />}
          {toast.message}
        </div>
      )}

      {/* ── SEKCJA 1: Normy KNR → PostgreSQL ─────────────────────────────── */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-indigo-600 text-white text-xs font-bold shrink-0">1</div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-500" />
              Import norm KNR do bazy danych (PostgreSQL)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Wgraj plik <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">.json</code> z normami robocizny.
              Dane trafiają do tabeli <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">knr_norms</code> i są używane przez
              <strong> ES-Engine</strong> do kalkulacji kosztorysów. Wymagany format v1.4.
            </p>
          </div>
        </div>
        <KbKnrImportPanel />
      </section>

      {/* ── SEKCJA 2: Pliki RAG → Supabase Bucket ────────────────────────── */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold shrink-0">2</div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-blue-500" />
              Pliki kontekstu RAG (Supabase Bucket)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Wgraj dowolne pliki <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded">.json / .pdf / .csv</code> do bucketu
              <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded ml-1">ai-knowledge-base</code>.
              Są one wstrzykiwane jako kontekst do <strong>Gemini AI</strong> przy analizie zdjęć i doradzaniu.
              Nie zastępują norm KNR — to dodatkowa wiedza dla AI.
            </p>
          </div>
        </div>
        <KbFilesPanel
          files={files}
          knrCategories={knrCategories}
          uploading={uploading}
          refreshing={refreshing}
          deletingFile={deletingFile}
          confirmDelete={confirmDelete}
          dragOver={dragOver}
          selectedFiles={selectedFiles}
          bulkDeleting={bulkDeleting}
          onDragOver={setDragOver}
          onUpload={handleUpload}
          onRefresh={handleRefresh}
          onDeleteRequest={setConfirmDelete}
          onDeleteConfirm={handleDeleteConfirm}
          onDeleteCancel={() => setConfirmDelete(null)}
          onToggleSelect={handleToggleSelect}
          onSelectAll={handleSelectAll}
          onBulkDeleteRequest={() => setConfirmBulkDelete(true)}
        />

        {/* Bulk delete confirm dialog */}
        <AlertDialog open={confirmBulkDelete} onOpenChange={setConfirmBulkDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-500" />
                Usuń zaznaczone pliki?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Zostaną trwale usunięte <strong>{selectedFiles.size}</strong> plików z bucketu Supabase.
                Gemini nie będzie miał dostępu do tej wiedzy.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Anuluj</AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700"
                onClick={() => void handleBulkDeleteConfirm()}
              >
                Usuń {selectedFiles.size} plików
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </section>

      {/* ── SEKCJA 3: Ustawienia globalne ─────────────────────────────────── */}
      <section>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-500 text-white text-xs font-bold shrink-0">3</div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-slate-500" />
              Ustawienia globalne ES-Engine
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Dyrektywy eksperta — globalne instrukcje wstrzykiwane do każdego promptu AI.
            </p>
          </div>
        </div>
        <KbSettingsPanel
          directives={directives}
          isSavingDirectives={isSavingDirectives}
          onDirectivesChange={setDirectives}
          onSaveDirectives={handleSaveDirectives}
        />
      </section>
    </div>
  );
}