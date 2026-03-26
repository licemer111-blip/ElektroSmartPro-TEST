"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  listProjectDocuments,
  uploadProjectDocument,
  deleteProjectDocument,
  getProjectDocumentUrl,
  type ProjectDocument,
} from "@/app/dashboard/projects/[id]/document-actions";
import {
  FileText,
  Image as ImageIcon,
  Upload,
  ExternalLink,
  Trash2,
  Loader2,
  FolderOpen,
  FileSpreadsheet,
  File,
  Calculator,
} from "lucide-react";
import * as XLSX from "xlsx-js-style";
import { DocumentPreviewDialog } from "@/components/project/DocumentPreviewDialog";
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

interface ProjectDocumentsSectionProps {
  projectId: string;
}

const ACCEPT = ".pdf,.jpg,.jpeg,.png,.webp,.xlsx,.xls,.csv,.txt";
const MAX_MB = 25;

export function ProjectDocumentsSection({ projectId }: ProjectDocumentsSectionProps) {
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [pendingDeleteDoc, setPendingDeleteDoc] = useState<ProjectDocument | null>(null);
  const [previewDoc, setPreviewDoc] = useState<ProjectDocument | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  
  // Spreadsheet/text viewer state
  const [spreadsheetData, setSpreadsheetData] = useState<string[][] | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

  const { toast } = useToast();

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await listProjectDocuments(projectId, "estimation");
    setLoading(false);
    if (error) {
      toast({ title: "Błąd", description: error, variant: "destructive" });
      return;
    }
    setDocuments(data);
  }, [projectId, toast]);

  useEffect(() => {
    load();
  }, [load]);

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
    formData.set("subfolder", "estimation");
    const result = await uploadProjectDocument(projectId, formData);
    setUploading(false);
    e.target.value = "";
    if (result.error) {
      const isBucketMissing = /bucket|not found|nie znaleziono/i.test(result.error);
      toast({
        title: "Błąd dodawania pliku",
        description: isBucketMissing
          ? "Brak bucketu 'project-documents'. W Supabase Dashboard → SQL Editor uruchom: supabase/migrations/20260201_project_documents_bucket_manual.sql"
          : result.error,
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Dodano plik", description: file.name });
    load();
  };

  const handleOpenPreview = async (doc: ProjectDocument) => {
    // Reset all preview states - set loading BEFORE opening dialog
    setPreviewUrl(null);
    setSpreadsheetData(null);
    setTextContent(null);
    setPreviewLoading(true);
    setPreviewDoc(doc); // This opens the dialog - must be AFTER loading=true
    
    const { url, error } = await getProjectDocumentUrl(projectId, doc.path);
    if (error || !url) {
      setPreviewLoading(false);
      toast({ title: "Błąd", description: error ?? "Nie udało się otworzyć", variant: "destructive" });
      setPreviewDoc(null);
      return;
    }
    
    // For spreadsheets - fetch and parse with xlsx
    if (isSpreadsheet(doc.name)) {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const arrayBuffer = await response.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json<string[]>(firstSheet, { header: 1 });
        setSpreadsheetData(data);
      } catch {
        // Keep dialog open — DocumentPreviewDialog will show download fallback when spreadsheetData=null
      }
      setPreviewUrl(url);
      setPreviewLoading(false);
      return;
    }
    
    // For text files - fetch as text
    if (isText(doc.name)) {
      try {
        const response = await fetch(url);
        const text = await response.text();
        setTextContent(text);
        setPreviewUrl(url);
      } catch (e) {
        toast({ title: "Błąd", description: "Nie udało się odczytać pliku tekstowego", variant: "destructive" });
        setPreviewDoc(null);
      }
      setPreviewLoading(false);
      return;
    }
    
    // For PDFs - fetch as blob to avoid CORS/embed issues
    if (isPdf(doc.name)) {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        setPdfBlobUrl(blobUrl);
        setPreviewUrl(url);
      } catch {
        toast({ title: "Błąd", description: "Nie udało się załadować PDF", variant: "destructive" });
        setPreviewDoc(null);
      }
      setPreviewLoading(false);
      return;
    }
    
    // For images - just set URL
    setPreviewUrl(url);
    setPreviewLoading(false);
  };

  const handleDelete = (doc: ProjectDocument) => {
    setPendingDeleteDoc(doc);
  };

  const executeDelete = async () => {
    if (!pendingDeleteDoc) return;
    const doc = pendingDeleteDoc;
    setPendingDeleteDoc(null);
    setDeletingId(doc.path);
    const result = await deleteProjectDocument(projectId, doc.path);
    setDeletingId(null);
    if (result.error) {
      toast({ title: "Błąd usuwania", description: result.error, variant: "destructive" });
      return;
    }
    toast({ title: "Usunięto plik" });
    load();
  };

  const isPdf = (name: string) => /\.pdf$/i.test(name);
  const isImage = (name: string) => /\.(jpg|jpeg|png|webp)$/i.test(name);
  const isSpreadsheet = (name: string) => /\.(xlsx|xls|csv)$/i.test(name);
  const isText = (name: string) => /\.txt$/i.test(name);
  const isCalculatorPdf = (name: string) => name.includes("Obliczenia_") && isPdf(name);

  const handleClosePreview = () => {
    setPreviewDoc(null);
    setPreviewUrl(null);
    setSpreadsheetData(null);
    setTextContent(null);
    setPreviewLoading(false);
    if (pdfBlobUrl) {
      URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(null);
    }
  };

  const getFileType = (name: string) => {
    if (isCalculatorPdf(name)) return "Obliczenie";
    if (isPdf(name)) return "PDF";
    if (isImage(name)) return "Obraz";
    if (isSpreadsheet(name)) return "Excel/CSV";
    if (isText(name)) return "Tekst";
    return "Plik";
  };

  const getFileIcon = (name: string) => {
    if (isCalculatorPdf(name)) return <Calculator className="w-10 h-10 text-indigo-500" />;
    if (isPdf(name)) return <FileText className="w-10 h-10 text-red-500" />;
    if (isImage(name)) return <ImageIcon className="w-10 h-10 text-blue-500" />;
    if (isSpreadsheet(name)) return <FileSpreadsheet className="w-10 h-10 text-green-600" />;
    return <File className="w-10 h-10 text-slate-500" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FolderOpen className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          Dokumentacja projektu
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Załaduj rysunki, specyfikacje, PDF — wszystko w jednym miejscu. Analiza ES-Engine dostępna przez ES Import w Kreatorze.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-6 cursor-pointer hover:border-blue-400 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
          <input
            type="file"
            accept={ACCEPT}
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
          {uploading ? (
            <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
          ) : (
            <Upload className="w-10 h-10 text-slate-400" />
          )}
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {uploading ? "Dodawanie…" : "Przeciągnij plik lub kliknij"}
          </span>
          <span className="text-xs text-muted-foreground">PDF, JPG, PNG, WEBP, Excel, CSV — max {MAX_MB} MB</span>
        </label>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            Brak załączników. Dodaj pierwszą dokumentację powyżej.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {documents.map((doc) => (
              <div
                key={doc.path}
                className="group rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 overflow-hidden hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-md transition-all"
              >
                <button
                  type="button"
                  onClick={() => handleOpenPreview(doc)}
                  className="w-full p-4 flex flex-col items-center text-left"
                >
                  <div className="w-16 h-20 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800 mb-3">
                    {getFileIcon(doc.name)}
                  </div>
                  <Badge
                    variant="secondary"
                    className={`mb-2 text-xs ${isCalculatorPdf(doc.name) ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300" : ""}`}
                  >
                    {isCalculatorPdf(doc.name) && <Calculator className="w-3 h-3 mr-1" />}
                    {getFileType(doc.name)}
                  </Badge>
                  <span className="text-sm font-medium truncate w-full text-center" title={doc.name}>
                    {isCalculatorPdf(doc.name)
                      ? doc.name
                          .replace(/^\d+_/, "")        // strip timestamp prefix
                          .replace(/^Obliczenia_/, "")  // strip Obliczenia_ prefix
                          .replace(/_/g, " ")           // underscores to spaces
                          .replace(/\.pdf$/i, "")       // strip extension
                      : doc.name}
                  </span>
                </button>
                <div className="flex items-center justify-center gap-1 p-2 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                  <Button
                    variant="default"
                    size="sm"
                    className="h-8 bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={(e) => { e.stopPropagation(); handleOpenPreview(doc); }}
                    title="Otwórz"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 text-red-600 hover:text-red-700"
                    onClick={(e) => { e.stopPropagation(); handleDelete(doc); }}
                    disabled={deletingId === doc.path}
                    title="Usuń"
                  >
                    {deletingId === doc.path ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        <DocumentPreviewDialog
          doc={previewDoc}
          projectId={projectId}
          previewUrl={previewUrl}
          pdfBlobUrl={pdfBlobUrl}
          spreadsheetData={spreadsheetData}
          textContent={textContent}
          previewLoading={previewLoading}
          onClose={handleClosePreview}
        />
      </CardContent>

      <AlertDialog open={!!pendingDeleteDoc} onOpenChange={(open) => !open && setPendingDeleteDoc(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Usuń plik</AlertDialogTitle>
            <AlertDialogDescription>
              Usuń plik <strong>&quot;{pendingDeleteDoc?.name}&quot;</strong>? Tej operacji nie można cofnąć.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-red-600 hover:bg-red-700 text-white">Usuń</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
