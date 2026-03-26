"use client";

import React, { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  CheckCircle2, XCircle, Download, FolderPlus, Zap, ChevronDown, ChevronUp,
  CheckSquare, Square, Save,
} from "lucide-react";
import type { ExtractedMaterial } from "@/app/dashboard/ai-lab/actions";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AnalysisResultsProps {
  materials: ExtractedMaterial[];
  selectedMaterials: Set<number>;
  rawText: string;
  error: string;
  isRawOpen: boolean;
  onToggleRaw: (open: boolean) => void;
  onToggleSelect: (index: number) => void;
  onToggleSelectAll: () => void;
  onExportToExcel: () => void;
  onAddToProject: () => void;
  onOpenQuickEstimate: () => void;
  onClear: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const AnalysisResults = React.memo(function AnalysisResults({
  materials,
  selectedMaterials,
  rawText,
  error,
  isRawOpen,
  onToggleRaw,
  onToggleSelect,
  onToggleSelectAll,
  onExportToExcel,
  onAddToProject,
  onOpenQuickEstimate,
  onClear,
}: AnalysisResultsProps) {
  const allSelected = useMemo(
    () => materials.length > 0 && selectedMaterials.size === materials.length,
    [materials.length, selectedMaterials.size],
  );

  const rawJson = useMemo(() => JSON.stringify(materials, null, 2), [materials]);

  if (!materials.length && !error) return null;

  return (
    <Card className="mt-4 hover:shadow-md transition-shadow">
      <CardHeader className="p-4 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {materials.length > 0 ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              Wyniki Analizy
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4 text-red-600" />
              Błąd Analizy
            </>
          )}
        </CardTitle>
        <CardDescription className="text-xs">
          {materials.length > 0
            ? `AI zidentyfikowało ${materials.length} pozycji w dokumencie`
            : "Wystąpił problem podczas przetwarzania pliku"}
        </CardDescription>
      </CardHeader>

      <CardContent className="p-4 pt-0">
        {error ? (
          <div className="bg-red-50 dark:bg-red-950/30 p-4 rounded-md">
            <p className="text-sm text-red-900 dark:text-red-100 font-medium">{error}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2">
              <Button onClick={onToggleSelectAll} variant="outline" size="sm" className="gap-2">
                {allSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                {allSelected ? "Odznacz wszystko" : "Zaznacz wszystko"}
              </Button>
              <Button onClick={onExportToExcel} variant="default" size="sm" className="gap-2 bg-green-600 hover:bg-green-700 text-white">
                <Download className="w-4 h-4" />
                Eksportuj do Excel
              </Button>
              <Button onClick={onAddToProject} variant="default" size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700 text-white" disabled={selectedMaterials.size === 0}>
                <FolderPlus className="w-4 h-4" />
                Dodaj do Projektu ({selectedMaterials.size})
              </Button>
              <Button onClick={onOpenQuickEstimate} variant="default" size="sm" className="gap-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white">
                <Zap className="w-4 h-4" />
                Szybka Wycena
              </Button>
              <Button onClick={onClear} variant="ghost" size="sm" className="gap-2 text-slate-600 hover:text-red-600">
                <XCircle className="w-4 h-4" />
                Wyczyść
              </Button>
              <div className="ml-auto flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                <Save className="w-3.5 h-3.5" />
                <span>Zapisano automatycznie</span>
              </div>
            </div>

            {/* Materials Table */}
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={allSelected}
                        onCheckedChange={onToggleSelectAll}
                        className="mx-auto"
                      />
                    </TableHead>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Nazwa Materiału</TableHead>
                    <TableHead className="text-right">Ilość</TableHead>
                    <TableHead className="text-center">Jednostka</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {materials.map((material, index) => (
                    <TableRow
                      key={index}
                      className={`cursor-pointer transition-colors ${
                        selectedMaterials.has(index)
                          ? "bg-blue-50 dark:bg-blue-950/30"
                          : "hover:bg-slate-50 dark:hover:bg-slate-900/50"
                      }`}
                      onClick={() => onToggleSelect(index)}
                    >
                      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedMaterials.has(index)}
                          onCheckedChange={() => onToggleSelect(index)}
                          className="mx-auto"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>{material.name}</TableCell>
                      <TableCell className="text-right">{material.quantity}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{material.unit}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Raw JSON debug */}
            <Collapsible open={isRawOpen} onOpenChange={onToggleRaw}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  {isRawOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  Pokaż Raw JSON (debug)
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-2">
                <pre className="bg-slate-950 text-green-400 p-4 rounded-md text-xs overflow-x-auto">
                  {rawJson}
                </pre>
              </CollapsibleContent>
            </Collapsible>

            {/* Raw text from document */}
            {rawText && (
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="gap-2">
                    <ChevronDown className="w-4 h-4" />
                    Pokaż Wyciąg z dokumentu (pierwsze 1000 znaków)
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <pre className="bg-slate-100 dark:bg-slate-900 p-4 rounded-md text-xs overflow-x-auto whitespace-pre-wrap">
                    {rawText}
                  </pre>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
