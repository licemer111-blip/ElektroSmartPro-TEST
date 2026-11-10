"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileText, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type PDFTemplateName = "klasyczny" | "elegancki" | "nowoczesny" | "korporacyjny" | "premium" | "zielony";

interface PDFTemplate {
  id: PDFTemplateName;
  name: string;
  subtitle: string;
  primary: string;
  paper: string;
  line: string;
}

const PDF_TEMPLATES: PDFTemplate[] = [
  {
    id: "klasyczny",
    name: "Klasyczny",
    subtitle: "Czarny, do inwestora i urzędu",
    primary: "#0f172a",
    paper: "#f8fafc",
    line: "#e2e8f0",
  },
  {
    id: "elegancki",
    name: "Elegancki",
    subtitle: "Ciemny nagłówek, złota linia",
    primary: "#1c1917",
    paper: "#fffbeb",
    line: "#b45309",
  },
  {
    id: "nowoczesny",
    name: "Nowoczesny",
    subtitle: "Niebieski, do biura",
    primary: "#1d4ed8",
    paper: "#eff6ff",
    line: "#93c5fd",
  },
  {
    id: "korporacyjny",
    name: "Korporacyjny",
    subtitle: "Granat, formalny",
    primary: "#0c2461",
    paper: "#f0f4ff",
    line: "#93c5fd",
  },
  {
    id: "premium",
    name: "Premium",
    subtitle: "Fiolet, więcej oddechu",
    primary: "#4c1d95",
    paper: "#faf5ff",
    line: "#c4b5fd",
  },
  {
    id: "zielony",
    name: "Zielony",
    subtitle: "Zieleń, dom i PV",
    primary: "#14532d",
    paper: "#f0fdf4",
    line: "#86efac",
  },
];

const STORAGE_KEY = "elektrosmart-pdf-template";

function TemplateCard({ template, selected, onSelect }: { template: PDFTemplate; selected: boolean; onSelect: () => void }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "text-left rounded-lg border bg-white dark:bg-slate-900 overflow-hidden transition-colors",
        selected
          ? "border-blue-500 ring-2 ring-blue-500/40"
          : "border-slate-200 dark:border-slate-700 hover:border-slate-400"
      )}
    >
      <div className="h-8 px-2 flex items-center justify-between" style={{ background: template.primary }}>
        <span className="text-[10px] font-semibold text-white">Kosztorys</span>
        <span className="text-[10px] text-white/80">brutto</span>
      </div>
      <div className="px-2 py-1.5 space-y-1" style={{ background: template.paper }}>
        <div className="h-1 rounded-full w-4/5" style={{ background: template.line }} />
        <div className="h-1 rounded-full w-3/5" style={{ background: template.line }} />
        <div className="h-1.5 rounded-sm w-2/5" style={{ background: template.primary }} />
      </div>
      <div className="px-2 py-1.5 border-t border-slate-100 dark:border-slate-800 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-xs font-semibold text-slate-800 dark:text-slate-100">{template.name}</div>
          <div className="text-[10px] text-slate-500 leading-snug">{template.subtitle}</div>
        </div>
        {selected ? <Check className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" /> : null}
      </div>
    </button>
  );
}

export function PDFTemplateInline() {
  const [selected, setSelected] = useState<PDFTemplateName>("klasyczny");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as PDFTemplateName | null;
    if (stored && PDF_TEMPLATES.some((t) => t.id === stored)) setSelected(stored);
  }, []);

  return (
    <div className="grid grid-cols-2 gap-2">
      {PDF_TEMPLATES.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          selected={selected === template.id}
          onSelect={() => {
            setSelected(template.id);
            localStorage.setItem(STORAGE_KEY, template.id);
          }}
        />
      ))}
    </div>
  );
}

interface PDFTemplateDialogProps {
  onTemplateChange?: (template: PDFTemplateName) => void;
  currentTemplate?: PDFTemplateName;
}

export function PDFTemplateDialog({ onTemplateChange, currentTemplate }: PDFTemplateDialogProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<PDFTemplateName>(currentTemplate || "klasyczny");

  useEffect(() => {
    if (!currentTemplate) {
      const stored = localStorage.getItem(STORAGE_KEY) as PDFTemplateName | null;
      if (stored && PDF_TEMPLATES.some((t) => t.id === stored)) setSelected(stored);
    }
  }, [currentTemplate]);

  useEffect(() => {
    if (currentTemplate) setSelected(currentTemplate);
  }, [currentTemplate]);

  const handleSelect = (templateId: PDFTemplateName) => {
    setSelected(templateId);
    localStorage.setItem(STORAGE_KEY, templateId);
    onTemplateChange?.(templateId);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="h-7 sm:h-8 text-[11px] sm:text-xs gap-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md flex-shrink-0"
        >
          <FileText className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Szablony PDF</span>
          <span className="sm:hidden">PDF</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Wygląd PDF dla klienta</DialogTitle>
          <DialogDescription>
            Zmienia kolor nagłówka i tabeli. Kwoty, VAT i kolejność pozycji zostają te same.
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {PDF_TEMPLATES.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              selected={selected === template.id}
              onSelect={() => handleSelect(template.id)}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
