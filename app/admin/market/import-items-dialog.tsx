"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, Download, Loader2, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Papa from "papaparse";
import { bulkImportCatalogItems } from "./actions";

interface CSVRow {
  name: string;
  category_name: string;
  unit: string;
  base_material_price: number;
  base_labor_price: number;
}

export function ImportItemsDialog() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<CSVRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();

  const handleDownloadTemplate = () => {
    // Create CSV template
    const template = [
      ["name", "category_name", "unit", "base_material_price", "base_labor_price"],
      ["Kabel YDYp 3x1.5mm² (mb)", "Okablowanie", "mb", "2.50", "1.20"],
      ["Gniazdo Schuko pojedyncze", "Rozdzielnice", "szt", "12.00", "8.00"],
      ["Puszka podtynkowa PU60", "Trasy Kablowe", "szt", "1.50", "2.00"],
    ];

    const csv = template.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", "szablon_import_pozycji.csv");
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "✅ Szablon pobrany!",
      description: "Wypełnij plik CSV i wgraj go ponownie.",
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".csv")) {
      toast({
        title: "❌ Nieprawidłowy format",
        description: "Proszę wybrać plik CSV",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);

    // Parse CSV
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as CSVRow[];
        
        // Validate required fields
        const validData = data.filter((row) => {
          return row.name && row.category_name && row.unit;
        });

        if (validData.length === 0) {
          toast({
            title: "❌ Brak danych",
            description: "Plik CSV nie zawiera prawidłowych danych",
            variant: "destructive",
          });
          return;
        }

        setParsedData(validData);
        
        toast({
          title: "✅ Plik załadowany!",
          description: `Znaleziono ${validData.length} pozycji do importu.`,
        });
      },
      error: (error) => {
        toast({
          title: "❌ Błąd parsowania",
          description: error.message,
          variant: "destructive",
        });
      },
    });
  };

  const handleImport = async () => {
    if (parsedData.length === 0) {
      toast({
        title: "❌ Brak danych",
        description: "Najpierw wybierz plik CSV",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);

    try {
      const result = await bulkImportCatalogItems(parsedData);

      if (result.success) {
        toast({
          title: "✅ Import zakończony!",
          description: `Zaimportowano ${result.imported} pozycji${
            result.skipped > 0 ? `, pominięto ${result.skipped}` : ""
          }.`,
        });

        if (result.errors.length > 0 && result.errors.length <= 5) {
          console.error("[ImportItems] Import errors:", result.errors);
          toast({
            title: "⚠️ Ostrzeżenia",
            description: result.errors.slice(0, 3).join(", "),
            variant: "default",
          });
        }

        // Reset state
        setFile(null);
        setParsedData([]);
        setOpen(false);

        // Reload page to show new items
        window.location.reload();
      } else {
        toast({
          title: "❌ Błąd importu",
          description: result.errors[0] || "Nie udało się zaimportować pozycji",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Import error:", error);
      toast({
        title: "❌ Błąd",
        description: "Wystąpił nieoczekiwany błąd podczas importu",
        variant: "destructive",
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-950/30"
        >
          <Upload className="w-4 h-4" />
          Importuj CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Import pozycji z pliku CSV</DialogTitle>
          <DialogDescription>
            Masowy import katalogowych pozycji z pliku CSV. Pobierz szablon, wypełnij go i wgraj z powrotem.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Step 1: Download Template */}
          <div className="space-y-2">
            <Label>Krok 1: Pobierz szablon CSV</Label>
            <Button
              variant="outline"
              className="w-full gap-2"
              onClick={handleDownloadTemplate}
            >
              <Download className="w-4 h-4" />
              Pobierz Szablon
            </Button>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Szablon zawiera przykładowe dane i wymagane kolumny.
            </p>
          </div>

          {/* Step 2: Upload File */}
          <div className="space-y-2">
            <Label htmlFor="csv-file">Krok 2: Wybierz wypełniony plik CSV</Label>
            <div className="flex items-center gap-2">
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={isImporting}
                className="flex-1"
              />
              {file && (
                <FileSpreadsheet className="w-5 h-5 text-green-600" />
              )}
            </div>
            {parsedData.length > 0 && (
              <div className="bg-green-50 dark:bg-green-950/30 p-3 rounded-md">
                <p className="text-sm font-medium text-green-900 dark:text-green-100">
                  ✅ Znaleziono {parsedData.length} pozycji
                </p>
                <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                  Pierwsze pozycje: {parsedData.slice(0, 3).map((i) => i.name).join(", ")}
                  {parsedData.length > 3 && "..."}
                </p>
              </div>
            )}
          </div>

          {/* Step 3: Import Button */}
          <Button
            onClick={handleImport}
            disabled={parsedData.length === 0 || isImporting}
            className="w-full gap-2"
          >
            {isImporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Importowanie...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Importuj {parsedData.length > 0 ? `${parsedData.length} pozycji` : ""}
              </>
            )}
          </Button>
        </div>

        <div className="border-t pt-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            <strong>Wymagane kolumny:</strong> name, category_name, unit, base_material_price, base_labor_price
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            <strong>Kategorie:</strong> Okablowanie, Rozdzielnice, Trasy Kablowe, Monitoring, Demontaże
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
