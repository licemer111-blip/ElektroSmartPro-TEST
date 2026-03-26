"use client";

// ═══════════════════════════════════════════════════════════════════
// _parts/DocumentsSection.tsx — Project documents download + preview
// ═══════════════════════════════════════════════════════════════════

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FolderOpen, Download, FileDown, Loader2, Sparkles, X } from "lucide-react";
import { getOfferDocumentUrl } from "../actions";

function getDisplayName(filename: string): string {
  return filename.replace(/^\d+_/, "");
}

function getFileIcon(name: string): string {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  if (ext === "pdf") return "📄";
  if (["xlsx", "xls", "csv"].includes(ext)) return "📊";
  if (["jpg", "jpeg", "png", "webp"].includes(ext)) return "🖼️";
  if (ext === "svg") return "📐";
  if (ext === "txt") return "📝";
  return "📎";
}

function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isPreviewable(name: string): boolean {
  const ext = name.split(".").pop()?.toLowerCase() || "";
  return ["pdf", "jpg", "jpeg", "png", "webp", "svg"].includes(ext);
}

interface DocumentsSectionProps {
  documents: { name: string; path: string; size: number; mimetype: string }[];
  token: string;
}

export function DocumentsSection({ documents, token }: DocumentsSectionProps) {
  const [downloadingPath, setDownloadingPath] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState("");
  const [previewLoading, setPreviewLoading] = useState<string | null>(null);

  const handleDownload = async (doc: { name: string; path: string }) => {
    setDownloadingPath(doc.path);
    try {
      const { url, error } = await getOfferDocumentUrl(token, doc.path);
      if (error || !url) return;
      const resp = await fetch(url);
      const blob = await resp.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = getDisplayName(doc.name);
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      // silent fail
    } finally {
      setDownloadingPath(null);
    }
  };

  const handlePreview = async (doc: { name: string; path: string }) => {
    setPreviewLoading(doc.path);
    try {
      const { url, error } = await getOfferDocumentUrl(token, doc.path);
      if (error || !url) return;
      const ext = doc.name.split(".").pop()?.toLowerCase() || "";
      if (ext === "pdf") {
        window.open(url, "_blank");
      } else {
        setPreviewName(getDisplayName(doc.name));
        setPreviewUrl(url);
      }
    } catch {
      // silent fail
    } finally {
      setPreviewLoading(null);
    }
  };

  const handleDownloadAll = async () => {
    setDownloadingAll(true);
    for (const doc of documents) {
      try {
        const { url } = await getOfferDocumentUrl(token, doc.path);
        if (url) {
          const resp = await fetch(url);
          const blob = await resp.blob();
          const blobUrl = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = blobUrl;
          a.download = getDisplayName(doc.name);
          a.click();
          URL.revokeObjectURL(blobUrl);
          await new Promise((r) => setTimeout(r, 400));
        }
      } catch {
        // continue
      }
    }
    setDownloadingAll(false);
  };

  return (
    <>
      <Card className="border-0 shadow-lg bg-white dark:bg-slate-800/80 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <FolderOpen className="w-4 h-4" />
            Dokumenty projektu
            <Badge className="bg-white/20 text-white text-[10px] border-0">{documents.length}</Badge>
          </h2>
          {documents.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs gap-1.5 h-7 text-white/80 hover:text-white hover:bg-white/10"
              onClick={handleDownloadAll}
              disabled={downloadingAll}
            >
              {downloadingAll ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
              Pobierz wszystkie
            </Button>
          )}
        </div>
        <CardContent className="p-0 divide-y divide-slate-100 dark:divide-slate-700">
          {documents.map((doc) => {
            const displayName = getDisplayName(doc.name);
            const icon = getFileIcon(doc.name);
            const size = formatFileSize(doc.size);
            const isDownloading = downloadingPath === doc.path;
            const canPreview = isPreviewable(doc.name);
            const isPreviewing = previewLoading === doc.path;

            return (
              <div
                key={doc.path}
                className="flex items-center gap-3 px-4 py-3 hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors"
              >
                <span className="text-xl flex-shrink-0">{icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">{displayName}</p>
                  {size && <p className="text-[11px] text-slate-400 dark:text-slate-500">{size}</p>}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {canPreview && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                      onClick={() => handlePreview(doc)}
                      disabled={isPreviewing}
                      title="Podgląd"
                    >
                      {isPreviewing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      )}
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:bg-slate-100 dark:hover:bg-slate-700"
                    onClick={() => handleDownload(doc)}
                    disabled={isDownloading}
                    title="Pobierz"
                  >
                    {isDownloading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                    ) : (
                      <FileDown className="w-3.5 h-3.5 text-slate-500" />
                    )}
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Image preview overlay */}
      {previewUrl && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center"
          onClick={() => setPreviewUrl(null)}
        >
          <button className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors z-10">
            <X className="w-5 h-5" />
          </button>
          <div className="absolute top-4 left-4 bg-white/10 backdrop-blur-sm text-white rounded-full px-3 py-1.5 text-sm font-medium z-10">
            {previewName}
          </div>
          <div className="max-w-[90vw] max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt={previewName}
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </>
  );
}
