"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Users, Lock } from "lucide-react";
import type { DataVisibility, Team } from "@/lib/types/database";

export interface AssemblyEditFormProps {
  name: string;
  description: string;
  categoryId: string;
  buildingType: string;
  visibility: DataVisibility;
  categories: Array<{ id: string; name: string }>;
  userTeam?: Team | null;
  onNameChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onCategoryChange: (v: string) => void;
  onBuildingTypeChange: (v: string) => void;
  onVisibilityChange: (v: DataVisibility) => void;
}

const BUILDING_TYPES = ["Dom", "Biuro", "Sklep", "Przemysł"];

export function AssemblyEditForm({
  name,
  description,
  categoryId,
  buildingType,
  visibility,
  categories,
  userTeam,
  onNameChange,
  onDescriptionChange,
  onCategoryChange,
  onBuildingTypeChange,
  onVisibilityChange,
}: AssemblyEditFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="assembly-name">Nazwa zestawu <span className="text-red-500">*</span></Label>
        <Input
          id="assembly-name"
          name="assembly-name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="np. Punkt gniazda podtynkowego"
          className="mt-1"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="assembly-category">Kategoria</Label>
          <Select
            value={categoryId || "none"}
            onValueChange={(v) => onCategoryChange(v === "none" ? "" : v)}
          >
            <SelectTrigger id="assembly-category" className="mt-1">
              <SelectValue placeholder="Wybierz kategorię..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Bez kategorii</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="assembly-building">Typ obiektu</Label>
          <Select value={buildingType} onValueChange={onBuildingTypeChange}>
            <SelectTrigger id="assembly-building" className="mt-1">
              <SelectValue placeholder="Wybierz typ..." />
            </SelectTrigger>
            <SelectContent>
              {BUILDING_TYPES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="assembly-description">Opis (opcjonalnie)</Label>
        <Textarea
          id="assembly-description"
          name="assembly-description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Krótki opis zestawu..."
          className="mt-1"
          rows={2}
        />
      </div>

    </div>
  );
}
