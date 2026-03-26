"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileBox, Check, ArrowRight, Loader2 } from "lucide-react";
import type { ProjectTemplate } from "@/app/dashboard/templates/actions";

export interface StepTemplateSelectionProps {
  templates: ProjectTemplate[];
  isLoading: boolean;
  selectedTemplate: string;
  onSelectTemplate: (id: string) => void;
  onConfirm: () => void;
  isCreating: boolean;
}

export function StepTemplateSelection({
  templates,
  isLoading,
  selectedTemplate,
  onSelectTemplate,
  onConfirm,
  isCreating,
}: StepTemplateSelectionProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-blue-500 mr-2" />
        <span className="text-sm text-muted-foreground">Ładowanie szablonów...</span>
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-muted-foreground">
        <FileBox className="w-8 h-8 mx-auto mb-2 text-slate-300 dark:text-slate-600" />
        <p>Brak szablonów. Utwórz projekt manualnie.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Wybierz szablon aby przyspieszyć tworzenie projektu. Możesz też pominąć i wypełnić ręcznie.
      </p>
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {templates.map((t) => {
          const itemCount = Array.isArray(t.items) ? t.items.length : 0;
          const isSelected = selectedTemplate === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelectTemplate(isSelected ? "none" : t.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg border-2 transition-all ${
                isSelected
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                  : "border-slate-200 dark:border-slate-700 hover:border-blue-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <FileBox className={`w-4 h-4 flex-shrink-0 ${isSelected ? "text-blue-600" : "text-slate-400"}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{t.name}</p>
                    {t.description && (
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">{t.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <Badge variant="secondary" className="text-[10px]">{itemCount} poz.</Badge>
                  {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {selectedTemplate && selectedTemplate !== "none" && (
        <Button
          type="button"
          onClick={onConfirm}
          disabled={isCreating}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2 mt-2"
          size="lg"
        >
          {isCreating ? (
            <><Loader2 className="w-4 h-4 animate-spin" />Tworzenie z szablonu...</>
          ) : (
            <><ArrowRight className="w-4 h-4" />Utwórz z wybranego szablonu</>
          )}
        </Button>
      )}
    </div>
  );
}
