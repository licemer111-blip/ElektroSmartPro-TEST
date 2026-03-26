"use client";

import { useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Upload, Trash2, RefreshCw, FileJson, FileSpreadsheet, FileText, File,
  CloudUpload, CheckCircle2, Clock,
  Square, CheckSquare,
} from "lucide-react";
import type { KbFile } from "../actions";

export interface KnrCategory {
  fileName: string;
  label: string;
  keywords: string[];
  normalizedKey: string;
}


function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pl-PL", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function getExtension(fileName: string): string {
  const idx = fileName.lastIndexOf(".");
  return idx !== -1 ? fileName.slice(idx).toLowerCase() : "";
}

function FileIcon({ name }: { name: string }) {
  const ext = getExtension(name);
  if (ext === ".json") return <FileJson className="w-4 h-4 text-emerald-600 shrink-0" />;
  if ([".csv", ".xlsx", ".xls"].includes(ext)) return <FileSpreadsheet className="w-4 h-4 text-green-600 shrink-0" />;
  if (ext === ".txt") return <FileText className="w-4 h-4 text-slate-500 shrink-0" />;
  return <File className="w-4 h-4 text-orange-500 shrink-0" />;
}

const ALLOWED_EXTENSIONS = [".json", ".csv", ".xlsx", ".xls", ".pdf", ".txt"];

interface KbFilesPanelProps {
  files: KbFile[];
  knrCategories: KnrCategory[];
  uploading: boolean;
  refreshing: boolean;
  deletingFile: string | null;
  confirmDelete: string | null;
  dragOver: boolean;
  selectedFiles: Set<string>;
  bulkDeleting: boolean;
  onDragOver: (over: boolean) => void;
  onUpload: (fileList: FileList | null) => void;
  onRefresh: () => void;
  onDeleteRequest: (fileName: string) => void;
  onDeleteConfirm: (fileName: string) => void;
  onDeleteCancel: () => void;
  onToggleSelect: (fileName: string) => void;
  onSelectAll: (fileNames: string[]) => void;
  onBulkDeleteRequest: () => void;
}

export function KbFilesPanel({
  files, knrCategories, uploading, refreshing, deletingFile, confirmDelete, dragOver,
  selectedFiles, bulkDeleting,
  onDragOver, onUpload, onRefresh, onDeleteRequest, onDeleteConfirm, onDeleteCancel,
  onToggleSelect, onSelectAll, onBulkDeleteRequest,
}: KbFilesPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const allFileNames = files.map((f) => f.name);
  const allSelected = files.length > 0 && selectedFiles.size === files.length;

  return (
    <>
      {/* Upload Zone */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <CloudUpload className="w-4 h-4 text-indigo-600" />
            Wgraj plik do bazy wiedzy (bucket RAG)
          </CardTitle>
          <CardDescription>Pliki JSON/CSV/PDF trafiają do bucketu <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 rounded">ai-knowledge-base</code> i są wstrzykiwane jako kontekst do Gemini. Istniejący plik zostanie nadpisany.</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
              dragOver
                ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30"
                : "border-slate-300 dark:border-slate-600 hover:border-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
            } ${uploading ? "pointer-events-none opacity-60" : ""}`}
            onDragOver={(e) => { e.preventDefault(); onDragOver(true); }}
            onDragLeave={() => onDragOver(false)}
            onDrop={(e) => { e.preventDefault(); onDragOver(false); onUpload(e.dataTransfer.files); }}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv,.xlsx,.xls,.pdf,.txt,application/json,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,application/pdf,text/plain"
              className="hidden"
              onChange={(e) => onUpload(e.target.files)}
            />
            {uploading ? (
              <div className="flex flex-col items-center gap-2 text-indigo-600">
                <RefreshCw className="w-8 h-8 animate-spin" />
                <span className="text-sm font-medium">Wgrywanie...</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 text-slate-500">
                <Upload className="w-8 h-8" />
                <span className="text-sm font-medium">
                  Przeciągnij plik lub <span className="text-indigo-600 underline">kliknij tutaj</span>
                </span>
                <span className="text-xs text-slate-400">Maks. 20 MB · JSON, CSV, EXCEL, PDF, TXT</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Files Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileJson className="w-4 h-4 text-emerald-600" />
              Pliki w buckecie
              <Badge variant="secondary" className="ml-1 text-xs">{files.length}</Badge>
            </CardTitle>
            <CardDescription className="mt-0.5">
              Bucket: <code className="text-xs bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded">ai-knowledge-base</code>
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {selectedFiles.size > 0 && (
              <Button
                variant="destructive"
                size="sm"
                className="gap-1.5 h-8 text-xs"
                onClick={onBulkDeleteRequest}
                disabled={bulkDeleting}
              >
                {bulkDeleting
                  ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  : <Trash2 className="w-3.5 h-3.5" />}
                Usuń zaznaczone ({selectedFiles.size})
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={refreshing} className="gap-2 h-8">
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              Odśwież
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <FileJson className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Brak plików w buckecie</p>
              <p className="text-sm mt-1">Wgraj plik JSON, CSV, Excel, PDF lub TXT powyżej</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8">
                    <button
                      onClick={() => onSelectAll(allFileNames)}
                      className="flex items-center justify-center w-4 h-4 text-slate-400 hover:text-indigo-600 transition-colors"
                      title={allSelected ? "Odznacz wszystkie" : "Zaznacz wszystkie"}
                    >
                      {allSelected
                        ? <CheckSquare className="w-4 h-4 text-indigo-600" />
                        : <Square className="w-4 h-4" />}
                    </button>
                  </TableHead>
                  <TableHead>Nazwa pliku</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Rozmiar</TableHead>
                  <TableHead>Zaktualizowano</TableHead>
                  <TableHead className="text-right">Akcje</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((file) => {
                  const ext = getExtension(file.name);
                  const isStructured = [".json", ".csv", ".xlsx", ".xls"].includes(ext);
                  const isPdf = ext === ".pdf" || ext === ".txt";
                  return (
                    <TableRow
                      key={file.name}
                      className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors ${
                        selectedFiles.has(file.name) ? "bg-indigo-50/60 dark:bg-indigo-950/20" : ""
                      }`}
                    >
                      <TableCell className="w-8">
                        <button
                          onClick={() => onToggleSelect(file.name)}
                          className="flex items-center justify-center w-4 h-4 text-slate-300 hover:text-indigo-600 transition-colors"
                        >
                          {selectedFiles.has(file.name)
                            ? <CheckSquare className="w-4 h-4 text-indigo-600" />
                            : <Square className="w-4 h-4" />}
                        </button>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileIcon name={file.name} />
                          <span className="font-mono text-xs font-medium text-slate-700 dark:text-slate-300 max-w-[280px] truncate" title={file.name}>{file.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {isStructured && (
                            <Badge className="text-[9px] px-1.5 py-0 h-4 bg-emerald-100 text-emerald-700 border border-emerald-300 gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5" />RAG aktywny
                            </Badge>
                          )}
                          {isPdf && (
                            <Badge className="text-[9px] px-1.5 py-0 h-4 bg-blue-100 text-blue-700 border border-blue-300 gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse inline-block" />Gemini PDF
                            </Badge>
                          )}
                          {!isStructured && !isPdf && (
                            <Badge className="text-[9px] px-1.5 py-0 h-4 bg-amber-100 text-amber-700 border border-amber-300 gap-1">
                              <Clock className="w-2.5 h-2.5" />Oczekuje
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right text-sm text-slate-500">{formatBytes(file.size)}</TableCell>
                      <TableCell className="text-sm text-slate-500">{formatDate(file.updatedAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          disabled={deletingFile === file.name}
                          onClick={() => onDeleteRequest(file.name)}>
                          {deletingFile === file.name
                            ? <RefreshCw className="w-4 h-4 animate-spin" />
                            : <Trash2 className="w-4 h-4" />}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirm Dialog */}
      <AlertDialog open={!!confirmDelete} onOpenChange={onDeleteCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usuń plik z bazy wiedzy?</AlertDialogTitle>
            <AlertDialogDescription>
              Plik <code className="font-mono text-sm">{confirmDelete}</code> zostanie trwale usunięty
              z bucketu Supabase. Gemini nie będzie miał dostępu do tej wiedzy do czasu ponownego wgrania.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700"
              onClick={() => confirmDelete && onDeleteConfirm(confirmDelete)}>
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
