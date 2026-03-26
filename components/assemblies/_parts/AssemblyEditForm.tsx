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

      {userTeam && (
        <div className="pt-2 border-t">
          <Label htmlFor="assembly-visibility" className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4" />
            Udostępnij zespółowi
          </Label>
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center gap-2">
              {visibility === "team" ? (
                <>
                  <Users className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">
                    Widoczne dla: <strong>{userTeam.name}</strong>
                  </span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-slate-500" />
                  <span className="text-sm text-slate-600 dark:text-slate-400">Tylko dla mnie</span>
                </>
              )}
            </div>
            <Switch
              id="assembly-visibility"
              name="assembly-visibility"
              aria-label="Udostępnij zespółowi"
              checked={visibility === "team"}
              onCheckedChange={(checked) => onVisibilityChange(checked ? "team" : "personal")}
            />
          </div>
        </div>
      )}
    </div>
  );
}
