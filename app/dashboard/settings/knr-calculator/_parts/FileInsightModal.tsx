"use client";

import { X, FileText, FileSpreadsheet } from "lucide-react";

interface KBFile {
  name: string;
  uri: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string | null;
}

const ALLOWED_TYPES: Record<string, string> = {
  "application/pdf": "PDF",
  "text/plain": "TXT",
  "text/csv": "CSV",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "XLSX",
  "application/vnd.ms-excel": "XLS",
};

export function getFileBadgeLabel(mimeType: string): string {
  return ALLOWED_TYPES[mimeType] ?? "PLIK";
}

export function isSpreadsheet(mimeType: string): boolean {
  return mimeType.includes("excel") || mimeType.includes("spreadsheet") || mimeType === "text/csv" || mimeType === "text/plain";
}

export function getFileRoutingLabel(mimeType: string): { label: string; color: string } {
  if (mimeType === "application/pdf") return { label: "ES-Engine Kontekst", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300" };
  if (isSpreadsheet(mimeType)) return { label: "Moje Normy", color: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300" };
  return { label: "Własne dane", color: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400" };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("pl-PL", { dateStyle: "short", timeStyle: "short" });
}

export type { KBFile };

interface FileInsightModalProps {
  file: KBFile | null;
  onClose: () => void;
}

export function FileInsightModal({ file, onClose }: FileInsightModalProps) {
  if (!file) return null;

  const isPdf = file.mimeType === "application/pdf";
  const isSheet = isSpreadsheet(file.mimeType);
  const routing = getFileRoutingLabel(file.mimeType);

  const usage = isPdf
    ? [
        { label: "Używane przez", value: "ES Engine (Tryb Własny)", color: "text-blue-600 dark:text-blue-400" },
        { label: "Kiedy", value: "Przy każdej wycenie — ES Engine czyta Twoje ceny i normy", color: "text-slate-600 dark:text-slate-300" },
        { label: "Co wyciąga", value: "Nazwy materiałów, ceny jednostkowe, stawki robocizny", color: "text-slate-600 dark:text-slate-300" },
        { label: "Format", value: "Tekst z PDF (nie skany!)", color: "text-slate-600 dark:text-slate-300" },
      ]
    : [
        { label: "Używane przez", value: "ES-Engine L1 (błyskawiczne dopasowanie)", color: "text-violet-600 dark:text-violet-400" },
        { label: "Kiedy", value: "Przy każdej wycenie — przed globalną bazą KNR", color: "text-slate-600 dark:text-slate-300" },
        { label: "Co wyciąga", value: "Nazwy pozycji → kody KNR → normy rbh/jedn.", color: "text-slate-600 dark:text-slate-300" },
        { label: "Format", value: "Kolumny: Nazwa | KNR | Norma | Jednostka", color: "text-slate-600 dark:text-slate-300" },
      ];

  const example = isPdf
    ? [
        { from: "Gniazdo 230V z uziemieniem (wg cennika)", to: "mat=28 zł/szt, rob=20 zł/szt" },
        { from: "Przewód YDYp 3x2.5 (cena netto/mb)", to: "mat=4.80 zł/mb" },
        { from: "Oprawa LED panel 60x60 (oferta dostawcy)", to: "mat=145 zł/szt, rob=35 zł/szt" },
      ]
    : [
        { from: "Montaż gniazda wtyczkowego", to: "KNR 5-01 0401-01 | 0.25 rbh/szt" },
        { from: "Układanie kabla YDYp w rurach", to: "KNR 5-04 0101-02 | 0.05 rbh/mb" },
        { from: "Instalacja wyłącznika nadprądowego MCB", to: "KNR 5-08 0201-01 | 0.15 rbh/szt" },
      ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
              isPdf ? "bg-red-100 dark:bg-red-950/40" : "bg-violet-100 dark:bg-violet-950/40"
            }`}>
              {isPdf
                ? <FileText className="w-4.5 h-4.5 text-red-600" />
                : <FileSpreadsheet className="w-4.5 h-4.5 text-violet-600" />
              }
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">{file.name}</p>
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${routing.color}`}>
                {routing.label}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 flex-shrink-0 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-700">
              <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                Jak system używa tego pliku
              </p>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {usage.map((row) => (
                <div key={row.label} className="px-3 py-2 flex items-start gap-3">
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 w-24 flex-shrink-0 pt-0.5">{row.label}</span>
                  <span className={`text-[11px] font-medium leading-snug ${row.color}`}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-700">
              <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                Przykład: co system wyciąga z pliku tego typu
              </p>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {example.map((row, i) => (
                <div key={i} className="px-3 py-2 space-y-0.5">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    <span className="text-slate-400">z pliku:</span> {row.from}
                  </p>
                  <p className="text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
                    → {row.to}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
            <span>{formatBytes(file.sizeBytes)}</span>
            <span>{getFileBadgeLabel(file.mimeType)}</span>
            {file.uploadedAt && <span>Dodano: {formatDate(file.uploadedAt)}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
