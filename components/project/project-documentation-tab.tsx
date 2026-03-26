"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FolderOpen,
  FileText,
  FileSpreadsheet,
  Image as ImageIcon,
  File,
  Calculator,
  Upload,
  Trash2,
  Eye,
  Loader2,
  Download,
  ArrowLeft,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  listProjectDocuments,
  uploadProjectDocument,
  deleteProjectDocument,
  getProjectDocumentUrl,
  type ProjectDocument,
} from "@/app/dashboard/projects/[id]/document-actions";
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

interface DocumentationDialogProps {
  projectId: string;
  projectStatus?: string;
  projectName?: string;
  itemCount?: number;
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
}

const ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp,.xlsx,.xls,.csv,.txt";
const MAX_MB = 25;

function isPdf(name: string) { return /\.pdf$/i.test(name); }
function isImage(name: string) { return /\.(jpg|jpeg|png|webp)$/i.test(name); }
function isSvg(name: string) { return /\.svg$/i.test(name); }
function isDxf(name: string) { return /\.dxf$/i.test(name); }
function isSpreadsheet(name: string) { return /\.(xlsx|xls|csv)$/i.test(name); }
function isCalculatorPdf(name: string) { return name.includes("Obliczenia_") && isPdf(name); }
function isPreviewable(name: string) { return isPdf(name) || isImage(name) || isSvg(name) || isSpreadsheet(name); }

function getFileIcon(name: string) {
  if (isCalculatorPdf(name)) return <Calculator className="w-5 h-5 text-indigo-500" />;
  if (isPdf(name)) return <FileText className="w-5 h-5 text-red-500" />;
  if (isImage(name)) return <ImageIcon className="w-5 h-5 text-blue-500" />;
  if (isSvg(name)) return <Eye className="w-5 h-5 text-emerald-500" />;
  if (isDxf(name)) return <File className="w-5 h-5 text-amber-500" />;
  if (isSpreadsheet(name)) return <FileSpreadsheet className="w-5 h-5 text-green-600" />;
  return <File className="w-5 h-5 text-slate-500" />;
}

function getFileLabel(name: string) {
  if (isCalculatorPdf(name)) return "Obliczenie";
  if (isPdf(name)) return "PDF";
  if (isImage(name)) return "Obraz";
  if (isSvg(name)) return "SVG";
  if (isDxf(name)) return "DXF";
  if (isSpreadsheet(name)) return "Excel/CSV";
  return "Plik";
}

function getDisplayName(name: string) {
  if (isCalculatorPdf(name)) {
    return name
      .replace(/^\d+_/, "")
      .replace(/^Obliczenia_/, "")
      .replace(/_/g, " ")
      .replace(/\.pdf$/i, "");
  }
  return name.replace(/^\d+_/, "");
}

function formatSize(bytes?: number) {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentationDialog({
  projectId,
  projectStatus = "draft",
  externalOpen,
  onExternalOpenChange,
}: DocumentationDialogProps) {
  const isFinal = projectStatus === "final";
  const [open, setOpen] = useState(false);

  // Sync with external (viewer) open state
  const prevExternalOpen = useRef<boolean | undefined>(undefined);
  useEffect(() => {
    if (externalOpen !== undefined && externalOpen !== prevExternalOpen.current) {
      prevExternalOpen.current = externalOpen;
      setOpen(externalOpen);
    }
  }, [externalOpen]);

  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [docCountPreview, setDocCountPreview] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingPath, setDeletingPath] = useState<string | null>(null);
  const [pendingDeleteDoc, setPendingDeleteDoc] = useState<ProjectDocument | null>(null);
  const [openingPath, setOpeningPath] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>("");
  const [previewTextContent, setPreviewTextContent] = useState<string | null>(null);
  const [previewExcelHtml, setPreviewExcelHtml] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const loadDocs = useCallback(async () => {
    setLoading(true);
    const { data, error } = await listProjectDocuments(projectId, "client");
    setLoading(false);
    if (error) {
      toast({ title: "Błąd", description: error, variant: "destructive" });
      return;
    }
    setDocuments(data);
    setDocCountPreview(data.length);
  }, [projectId, toast]);

  // Load count on mount so badge shows correct number without opening dialog
  useEffect(() => {
    listProjectDocuments(projectId, "client").then(({ data }) => {
      if (data) setDocCountPreview(data.length);
    });
  }, [projectId]);

  // Refresh count after auto-generate on finalization
  useEffect(() => {
    const handler = (e: Event) => {
      const { projectId: evtId } = (e as CustomEvent<{ projectId: string }>).detail;
      if (evtId !== projectId) return;
      // Wait for documents to be saved, then refresh count
      setTimeout(() => {
        listProjectDocuments(projectId, "client").then(({ data }) => {
          if (data) setDocCountPreview(data.length);
        });
      }, 4000);
    };
    window.addEventListener("project-finalized", handler);
    return () => window.removeEventListener("project-finalized", handler);
  }, [projectId]);

  useEffect(() => {
    if (open) loadDocs();
  }, [open, loadDocs]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_MB * 1024 * 1024) {
      toast({ title: "Plik za duży", description: `Maks. ${MAX_MB} MB`, variant: "destructive" });
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.set("file", file);
    formData.set("subfolder", "client");
    const result = await uploadProjectDocument(projectId, formData);
    setUploading(false);
    e.target.value = "";
    if (result.error) {
      toast({ title: "Błąd dodawania pliku", description: result.error, variant: "destructive" });
      return;
    }
    toast({ title: "Dodano plik", description: file.name });
    loadDocs();
  };

  const handleDelete = (doc: ProjectDocument) => {
    setPendingDeleteDoc(doc);
  };

  const executeDelete = async () => {
    if (!pendingDeleteDoc) return;
    const doc = pendingDeleteDoc;
    setPendingDeleteDoc(null);
    setDeletingPath(doc.path);
    const result = await deleteProjectDocument(projectId, doc.path);
    setDeletingPath(null);
    if (result.error) {
      toast({ title: "Błąd usuwania", description: result.error, variant: "destructive" });
      return;
    }
    toast({ title: "Usunięto plik" });
    loadDocs();
  };

  const handleOpen = async (doc: ProjectDocument) => {
    setOpeningPath(doc.path);
    const { url, error } = await getProjectDocumentUrl(projectId, doc.path);
    setOpeningPath(null);
    if (error || !url) {
      toast({ title: "Błąd", description: error ?? "Nie udało się otworzyć", variant: "destructive" });
      return;
    }
    // Previewable files open in-app; other types download via blob
    if (isPreviewable(doc.name)) {
      setPreviewUrl(url);
      setPreviewName(doc.name);
      setPreviewTextContent(null);
      setPreviewExcelHtml(null);
      if (isDxf(doc.name)) {
        try {
          const resp = await fetch(url);
          const text = await resp.text();
          setPreviewTextContent(text);
        } catch {
          setPreviewTextContent("Nie udało się załadować zawartości pliku");
        }
      } else if (isSpreadsheet(doc.name)) {
        try {
          const { read, utils } = await import("xlsx-js-style");
          const resp = await fetch(url);
          const buffer = await resp.arrayBuffer();
          const wb = read(buffer, { type: "array" });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const html = utils.sheet_to_html(ws, { id: "excel-preview-table" });
          setPreviewExcelHtml(html);
        } catch {
          setPreviewExcelHtml("<p>Nie udało się załadować podglądu arkusza</p>");
        }
      }
    } else {
      try {
        const resp = await fetch(url);
        const blob = await resp.blob();
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = doc.name;
        a.click();
        URL.revokeObjectURL(blobUrl);
      } catch {
        toast({ title: "Pobieranie...", description: doc.name });
        window.open(url, "_blank");
      }
    }
  };

  const handleDownloadAll = async () => {
    for (const doc of documents) {
      const { url } = await getProjectDocumentUrl(projectId, doc.path);
      if (url) {
        const a = document.createElement("a");
        a.href = url;
        a.download = doc.name;
        a.target = "_blank";
        a.click();
      }
    }
  };

  const docCount = documents.length;
  // badgeCount uses preview (loaded on mount) when dialog is closed, actual when open
  const badgeCount = open ? docCount : (docCountPreview ?? docCount);

  return (
    <Dialog open={open} onOpenChange={(v) => {
      setOpen(v);
      onExternalOpenChange?.(v);
    }}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="h-7 sm:h-8 text-[11px] sm:text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0 rounded-md"
        >
          <FolderOpen className="h-3.5 w-3.5" />
          <span>Dokumentacja</span>
          {badgeCount > 0 && (
            <Badge className="ml-0.5 h-4 min-w-4 px-1 text-[9px] bg-white/20 text-white border-0">
              {badgeCount}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-[70vw] w-[70vw] h-[90vh] overflow-hidden flex flex-col p-0" onPointerDownOutside={(e) => { if (previewUrl) e.preventDefault(); }}>
        {/* In-app file preview overlay */}
        {previewUrl && (
          <div className="absolute inset-0 z-50 bg-white dark:bg-slate-950 flex flex-col">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex-shrink-0 bg-slate-50 dark:bg-slate-900">
              <Button
                size="sm"
                variant="ghost"
                className="h-8 px-2 text-xs gap-1.5"
                onClick={() => { setPreviewUrl(null); setPreviewName(""); setPreviewTextContent(null); setPreviewExcelHtml(null); }}
              >
                <ArrowLeft className="w-4 h-4" />
                Wróć do listy
              </Button>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate flex-1">
                {getDisplayName(previewName)}
              </span>
              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2 text-xs gap-1.5"
                onClick={() => { window.open(previewUrl, "_blank", "noopener,noreferrer"); }}
              >
                <Download className="w-3.5 h-3.5" />
                Pobierz
              </Button>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              {isPdf(previewName) ? (
                <iframe
                  src={previewUrl}
                  className="w-full h-full border-0"
                  title={getDisplayName(previewName)}
                />
              ) : isSvg(previewName) ? (
                <div className="w-full h-full flex items-center justify-center p-4 overflow-auto bg-white dark:bg-slate-900">
                  <iframe
                    src={previewUrl}
                    className="w-full h-full border-0 bg-white rounded-lg shadow-lg"
                    title={getDisplayName(previewName)}
                    sandbox="allow-same-origin"
                  />
                </div>
              ) : isDxf(previewName) && previewTextContent ? (
                <div className="w-full h-full overflow-auto p-4 bg-slate-50 dark:bg-slate-900">
                  <pre className="text-[11px] font-mono text-slate-700 dark:text-slate-300 whitespace-pre leading-relaxed">
                    {previewTextContent}
                  </pre>
                </div>
              ) : isImage(previewName) ? (
                <div className="w-full h-full flex items-center justify-center p-4 overflow-auto bg-slate-100 dark:bg-slate-900">
                  <img
                    src={previewUrl}
                    alt={getDisplayName(previewName)}
                    className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
                  />
                </div>
              ) : isSpreadsheet(previewName) ? (
                <div className="w-full h-full overflow-auto bg-white dark:bg-slate-950 p-4">
                  {previewExcelHtml ? (
                    <div
                      className="excel-preview text-xs"
                      // eslint-disable-next-line react/no-danger
                      dangerouslySetInnerHTML={{ __html: previewExcelHtml }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full gap-2 text-slate-400">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-sm">Ładowanie arkusza...</span>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="px-5 pt-5 pb-3 flex-shrink-0 border-b border-slate-100 dark:border-slate-800">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <FolderOpen className="w-5 h-5 text-blue-600" />
              Dokumenty projektu
              {docCount > 0 && (
                <Badge variant="secondary" className="text-[10px]">
                  {docCount} {docCount === 1 ? "plik" : docCount < 5 ? "pliki" : "plików"}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription className="text-[11px]">
              Wszystkie dokumenty dołączone do tego projektu — obliczenia, specyfikacje, protokoły
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Toolbar */}
        <div className="px-5 py-2.5 flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 flex-shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
          <Button
            size="sm"
            className="h-8 text-xs gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Upload className="w-3.5 h-3.5" />
            )}
            {uploading ? "Dodawanie…" : "Dodaj plik"}
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
          {docCount > 1 && (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs gap-1.5 ml-auto"
              onClick={handleDownloadAll}
            >
              <Download className="w-3.5 h-3.5" />
              Pobierz wszystkie
            </Button>
          )}
        </div>

        {/* File list */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
          ) : docCount === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                <FolderOpen className="w-8 h-8 text-slate-400" />
              </div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Brak dokumentów
              </h3>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 max-w-xs leading-relaxed">
                Dodaj pliki ręcznie lub generuj dokumenty z kalkulatorów, rozdzielnicy i protokołów — pojawią się tutaj automatycznie.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-4">
              {documents.map((doc) => (
                <div
                  key={doc.path}
                  className="group relative flex flex-col items-center rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-600 transition-all cursor-pointer"
                  onClick={() => handleOpen(doc)}
                >
                  {/* Delete button */}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-1.5 right-1.5 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 z-10"
                    onClick={(e) => { e.stopPropagation(); handleDelete(doc); }}
                    disabled={deletingPath === doc.path}
                    title="Usuń"
                  >
                    {deletingPath === doc.path ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Trash2 className="w-3 h-3" />
                    )}
                  </Button>

                  {/* Icon */}
                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
                    {openingPath === doc.path ? (
                      <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                    ) : (
                      getFileIcon(doc.name)
                    )}
                  </div>

                  {/* Name */}
                  <span className="text-[11px] font-medium text-slate-800 dark:text-slate-200 text-center line-clamp-2 leading-tight mb-1.5">
                    {getDisplayName(doc.name)}
                  </span>

                  {/* Badge */}
                  <Badge
                    variant="secondary"
                    className={`text-[9px] px-1.5 py-0 mb-1 ${
                      isCalculatorPdf(doc.name)
                        ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                        : ""
                    }`}
                  >
                    {getFileLabel(doc.name)}
                  </Badge>

                  {/* Meta */}
                  <div className="flex items-center gap-1.5 mt-auto">
                    {doc.metadata?.size && (
                      <span className="text-[9px] text-slate-400">
                        {formatSize(doc.metadata.size)}
                      </span>
                    )}
                    {doc.created_at && (
                      <span className="text-[9px] text-slate-400">
                        {new Date(doc.created_at).toLocaleDateString("pl-PL", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        {docCount > 0 && (
          <div className="px-5 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex-shrink-0">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center">
              Te dokumenty zostaną dołączone do oferty wysyłanej klientowi przez portal lub e-mail
            </p>
          </div>
        )}
      </DialogContent>
      <AlertDialog open={!!pendingDeleteDoc} onOpenChange={(open) => !open && setPendingDeleteDoc(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usuń plik</AlertDialogTitle>
            <AlertDialogDescription>
              Usuń plik <strong>&quot;{pendingDeleteDoc ? getDisplayName(pendingDeleteDoc.name) : ""}&quot;</strong>? Tej operacji nie można cofnąć.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-red-600 hover:bg-red-700 text-white">Usuń</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
