"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Download, X, ChevronLeft, ChevronRight, Loader2, FileText,
} from "lucide-react";
import { isImageAttachment, downloadAttachment, type TeamMessage } from "@/lib/chat-utils";

interface ViewingFile {
  url: string;
  filename: string;
}

interface AttachmentViewerProps {
  viewing: ViewingFile | null;
  onClose: () => void;
  allAttachments: TeamMessage[];
}

export function AttachmentViewer({ viewing, onClose, allAttachments }: AttachmentViewerProps) {
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState(false);
  const [officeHtml, setOfficeHtml] = useState<string | null>(null);

  // Reset + fetch when viewing changes
  useEffect(() => {
    if (!viewing) {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
      setPdfError(false);
      setPdfLoading(false);
      setOfficeHtml(null);
      return;
    }

    const fname = viewing.filename.toLowerCase();
    const ext = fname.split(".").pop() || "";
    const needsBlob = ["pdf", "txt"].includes(ext);
    const isOffice = ["xls", "xlsx", "doc", "docx", "ppt", "pptx", "odt", "ods", "odp", "csv"].includes(ext);

    if (needsBlob) {
      if (viewing.url.startsWith("blob:")) { setPdfBlobUrl(viewing.url); return; }
      setPdfLoading(true);
      setPdfError(false);
      fetch(viewing.url)
        .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.blob(); })
        .then((blob) => { setPdfBlobUrl(URL.createObjectURL(blob)); setPdfLoading(false); })
        .catch(() => { setPdfError(true); setPdfLoading(false); });
      return;
    }

    if (isOffice) {
      setPdfLoading(true);
      setPdfError(false);
      setOfficeHtml(null);
      fetch(viewing.url)
        .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.arrayBuffer(); })
        .then(async (buffer) => {
          try {
            const XLSX = await import("xlsx-js-style");
            const wb = XLSX.read(buffer, { type: "array" });
            const first = wb.SheetNames[0];
            if (!first) throw new Error("Brak arkuszy");
            const html = XLSX.utils.sheet_to_html(wb.Sheets[first], { editable: false });
            const styled = `<!DOCTYPE html><html><head><style>
              body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;margin:0;padding:8px;background:#fff}
              table{border-collapse:collapse;width:100%;font-size:13px}
              td,th{border:1px solid #e2e8f0;padding:6px 10px;text-align:left;white-space:nowrap}
              th{background:#f1f5f9;font-weight:600;position:sticky;top:0}
              tr:nth-child(even){background:#f8fafc}tr:hover{background:#e0f2fe}
            </style></head><body>${html}${
              wb.SheetNames.length > 1
                ? `<p style="margin-top:12px;color:#64748b;font-size:12px;">Arkusze: ${wb.SheetNames.join(", ")}</p>`
                : ""
            }</body></html>`;
            setOfficeHtml(styled);
            setPdfLoading(false);
          } catch { setPdfError(true); setPdfLoading(false); }
        })
        .catch(() => { setPdfError(true); setPdfLoading(false); });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewing]);

  const imageAttachments = allAttachments.filter((m) => isImageAttachment(m.attachment_type));
  const multipleImages = imageAttachments.length > 1;

  const navigate = (dir: "prev" | "next") => {
    if (!viewing) return;
    const idx = imageAttachments.findIndex((m) => m.attachment_url === viewing.url);
    const next =
      dir === "prev"
        ? idx > 0 ? idx - 1 : imageAttachments.length - 1
        : idx < imageAttachments.length - 1 ? idx + 1 : 0;
    const target = imageAttachments[next];
    if (target?.attachment_url) {
      // parent will re-open with new url — we trigger via onClose + caller logic
      // Instead, we directly mutate viewing via a local state trick:
      // Since viewing is controlled by parent, we need a callback. Use onClose + re-open pattern
      // is complex; simpler: expose onNavigate prop. For now navigate within local state.
      setPdfBlobUrl(null);
      setPdfError(false);
      setOfficeHtml(null);
      // We can't mutate the prop directly — signal parent via a custom event workaround.
      // The cleanest solution: the parent passes an onNavigate callback.
      // Since we don't have it yet, we'll use a dispatchEvent trick.
      window.dispatchEvent(
        new CustomEvent("chat-viewer-navigate", {
          detail: { url: target.attachment_url, filename: target.attachment_filename || "Obrazek" },
        })
      );
    }
  };

  const renderContent = () => {
    if (!viewing) return null;
    const fname = viewing.filename.toLowerCase();
    const ext = fname.split(".").pop() || "";
    const imageExts = ["jpg", "jpeg", "png", "gif", "webp", "svg", "bmp"];
    const officeExts = ["doc", "docx", "xls", "xlsx", "ppt", "pptx", "odt", "ods", "odp", "csv"];

    if (imageExts.includes(ext)) {
      return (
        <img
          src={viewing.url}
          alt={viewing.filename}
          className="max-w-full max-h-[70vh] object-contain rounded-lg"
        />
      );
    }

    const loadingSpinner = (label: string) => (
      <div className="flex-1 flex items-center justify-center bg-white rounded-lg">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          <p className="text-slate-500 text-sm">{label}</p>
        </div>
      </div>
    );

    const errorBlock = () => (
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <FileText className="w-16 h-16 text-white/40" />
        <p className="text-white/70 text-sm">Nie udało się załadować podglądu</p>
        <Button variant="secondary" onClick={() => downloadAttachment(viewing.url, viewing.filename)}>
          <Download className="w-4 h-4 mr-2" /> Pobierz plik
        </Button>
      </div>
    );

    const downloadBtn = () => (
      <div className="text-center mt-3">
        <Button size="sm" variant="secondary" className="text-xs"
          onClick={() => downloadAttachment(viewing.url, viewing.filename)}>
          <Download className="w-3 h-3 mr-1.5" /> Pobierz
        </Button>
      </div>
    );

    if (ext === "pdf") {
      return (
        <div className="w-full h-[70vh] flex flex-col">
          {pdfLoading && loadingSpinner("Ładowanie PDF...")}
          {pdfError && errorBlock()}
          {pdfBlobUrl && !pdfLoading && !pdfError && (
            <iframe src={pdfBlobUrl} className="w-full flex-1 rounded-lg bg-white" title={viewing.filename} />
          )}
          {!pdfLoading && !pdfError && downloadBtn()}
        </div>
      );
    }

    if (officeExts.includes(ext)) {
      return (
        <div className="w-full h-[70vh] flex flex-col">
          {pdfLoading && loadingSpinner("Ładowanie dokumentu...")}
          {pdfError && errorBlock()}
          {officeHtml && !pdfLoading && !pdfError && (
            <iframe srcDoc={officeHtml} className="w-full flex-1 rounded-lg bg-white"
              title={viewing.filename} sandbox="allow-same-origin" />
          )}
          {!pdfLoading && !pdfError && downloadBtn()}
        </div>
      );
    }

    if (ext === "txt") {
      return (
        <div className="w-full h-[70vh] flex flex-col">
          {pdfLoading && loadingSpinner("Ładowanie pliku...")}
          {pdfBlobUrl && !pdfLoading && (
            <iframe src={pdfBlobUrl} className="w-full flex-1 rounded-lg bg-white" title={viewing.filename} />
          )}
          {downloadBtn()}
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center gap-6 text-center p-8">
        <div className="w-24 h-24 rounded-2xl bg-white/10 flex items-center justify-center">
          <FileText className="w-12 h-12 text-white/70" />
        </div>
        <div>
          <h3 className="text-white text-lg font-medium mb-1">{viewing.filename}</h3>
          <p className="text-white/50 text-sm">Podgląd tego typu pliku nie jest dostępny</p>
        </div>
        <Button variant="secondary" onClick={() => downloadAttachment(viewing.url, viewing.filename)}>
          <Download className="w-4 h-4 mr-2" /> Pobierz
        </Button>
      </div>
    );
  };

  const currentImageIdx = imageAttachments.findIndex((m) => m.attachment_url === viewing?.url);
  const isPdf = viewing?.filename.toLowerCase().endsWith(".pdf");

  return (
    <Dialog open={!!viewing} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden bg-black/95">
        <DialogTitle className="sr-only">{viewing?.filename || "Podgląd załącznika"}</DialogTitle>
        <DialogDescription className="sr-only">Podgląd załącznika z czatu zespołu.</DialogDescription>
        <div className="relative w-full h-full flex flex-col">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
            <div className="text-white text-sm font-medium truncate max-w-[60%]">{viewing?.filename}</div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" className="text-white hover:bg-white/20"
                onClick={() => viewing && downloadAttachment(viewing.url, viewing.filename)} title="Pobierz">
                <Download className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" className="text-white hover:bg-white/20" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 flex items-center justify-center p-4 pt-16">
            {renderContent()}
          </div>

          {/* Navigation arrows */}
          {multipleImages && !isPdf && (
            <>
              <Button size="sm" variant="ghost"
                className="absolute left-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
                onClick={() => navigate("prev")}>
                <ChevronLeft className="w-8 h-8" />
              </Button>
              <Button size="sm" variant="ghost"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
                onClick={() => navigate("next")}>
                <ChevronRight className="w-8 h-8" />
              </Button>
            </>
          )}

          {/* Counter */}
          {multipleImages && !isPdf && currentImageIdx >= 0 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/70 text-sm bg-black/50 px-3 py-1 rounded-full">
              {currentImageIdx + 1} / {imageAttachments.length}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
