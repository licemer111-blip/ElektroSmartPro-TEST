"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileBox } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import type { ProjectTemplate } from "@/app/dashboard/templates/actions";
import type { ObjectType } from "@/lib/types/database";

export interface StepBasicInfoProps {
  templates: ProjectTemplate[];
  isLoadingTemplates: boolean;
  selectedTemplate: string;
  onTemplateChange: (v: string) => void;
  selectedObjectType: string;
  onObjectTypeChange: (v: string) => void;
  objectTypes: ObjectType[];
  hasError: boolean;
}

export function StepBasicInfo({
  templates,
  isLoadingTemplates,
  selectedTemplate,
  onTemplateChange,
  selectedObjectType,
  onObjectTypeChange,
  objectTypes,
  hasError,
}: StepBasicInfoProps) {
  return (
    <div className="space-y-3">
      {/* Optional template */}
      {templates.length > 0 && (
        <div className="space-y-1.5">
          <Label htmlFor="project-template" className="text-xs flex items-center gap-1.5 text-muted-foreground">
            <FileBox className="w-3.5 h-3.5 text-indigo-500" />
            Szablon (opcjonalnie)
          </Label>
          <Select value={selectedTemplate} onValueChange={onTemplateChange}>
            <SelectTrigger id="project-template" className="h-9 text-sm">
              <SelectValue placeholder="Bez szablonu..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Bez szablonu</SelectItem>
              {templates.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name} ({Array.isArray(t.items) ? t.items.length : 0} poz.)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Project name */}
      <div className="space-y-1.5">
        <Label htmlFor="name" className="text-xs">
          Nazwa projektu <span className="text-red-500">*</span>
        </Label>
        <Input
          id="name"
          name="name"
          autoComplete="off"
          placeholder="np. Mieszkanie ul. Kwiatowa 15"
          required
          maxLength={100}
          autoFocus
          className="h-9 text-sm"
        />
      </div>

      {/* Object type */}
      <div className="space-y-1.5">
        <Label htmlFor="object_type_id" className="text-xs">
          Typ obiektu <span className="text-red-500">*</span>
        </Label>
        <Select
          name="object_type_id"
          required
          onValueChange={onObjectTypeChange}
          value={selectedObjectType}
        >
          <SelectTrigger
            id="object_type_id"
            className={`h-9 text-sm ${!selectedObjectType && hasError ? "border-red-500" : ""}`}
          >
            <SelectValue placeholder="Wybierz..." />
          </SelectTrigger>
          <SelectContent>
            {objectTypes.length === 0 ? (
              <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                Brak typów obiektów
              </div>
            ) : (
              objectTypes
                .filter((type) => {
                  const n = type.name.toLowerCase();
                  return (
                    n.includes("mieszkan") || n.includes("dom") ||
                    n.includes("biuro") || n.includes("lokal") ||
                    n.includes("przemys") || n.includes("hala")
                  );
                })
                .map((type) => {
                  const n = type.name.toLowerCase();
                  let displayName: string;
                  if (n.includes("mieszkan") || n.includes("dom")) displayName = "Mieszkanie / Dom";
                  else if (n.includes("biuro") || n.includes("lokal")) displayName = "Biuro / Lokale";
                  else if (n.includes("przemys") || n.includes("hala")) displayName = "Przemysł / Hala";
                  else if (n.includes("sklep") || n.includes("uslug")) displayName = "Sklep / Lokal usługowy";
                  else displayName = type.name.replace(/\s*\(VAT[^)]*\)/gi, "").trim();
                  return (
                    <SelectItem key={type.id} value={type.id}>
                      {displayName}
                    </SelectItem>
                  );
                })
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Client data */}
      <div className="space-y-2 pt-3 border-t border-slate-200 dark:border-slate-700">
        <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          Dane Inwestora / Klienta
          <span className="font-normal text-muted-foreground ml-1.5">— opcjonalne, do PDF</span>
        </p>
        <Input id="client_name" name="client_name" placeholder="Imię i Nazwisko / Nazwa Firmy" maxLength={200} className="h-9 text-sm" />
        <div className="grid grid-cols-2 gap-2">
          <Input id="client_address" name="client_address" placeholder="Adres klienta" maxLength={300} className="h-9 text-sm" />
          <Input id="client_nip" name="client_nip" placeholder="NIP (opcjonalnie)" maxLength={20} className="h-9 text-sm" />
        </div>
      </div>
    </div>
  );
}
