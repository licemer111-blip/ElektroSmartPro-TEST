"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Settings, Loader2, Trash2, Copy, Check } from "lucide-react";
import type { Team } from "@/lib/types/database";

interface TeamSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team: Team;
  settingsName: string;
  settingsDescription: string;
  savingSettings: boolean;
  deletingTeam: boolean;
  copiedId: boolean;
  isOwner: boolean;
  setSettingsName: (v: string) => void;
  setSettingsDescription: (v: string) => void;
  onSave: () => void;
  onDelete: () => void;
  onCopyTeamId: () => void;
}

export function TeamSettingsDialog({
  open, onOpenChange, team, settingsName, settingsDescription,
  savingSettings, deletingTeam, copiedId, isOwner,
  setSettingsName, setSettingsDescription,
  onSave, onDelete, onCopyTeamId,
}: TeamSettingsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <Settings className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            </div>
            Ustawienia zespołu
          </DialogTitle>
          <DialogDescription>Edytuj nazwę i opis zespołu.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="settings-name">Nazwa zespołu *</Label>
            <Input
              id="settings-name"
              name="settings-name"
              value={settingsName}
              onChange={(e) => setSettingsName(e.target.value)}
              placeholder="np. ElektroBudowa Sp. z o.o."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-description">Opis (opcjonalnie)</Label>
            <Textarea
              id="settings-description"
              name="settings-description"
              value={settingsDescription}
              onChange={(e) => setSettingsDescription(e.target.value)}
              placeholder="Krótki opis zespołu..."
              rows={3}
            />
          </div>
          <div className="space-y-2 border-t pt-3">
            <Label htmlFor="team-id-display" className="text-xs text-muted-foreground">ID zespołu</Label>
            <div className="flex gap-2">
              <Input id="team-id-display" name="team-id-display" value={team.id} readOnly aria-label="Identyfikator zespołu" className="font-mono text-xs bg-muted" />
              <Button variant="outline" size="sm" onClick={onCopyTeamId} className="flex-shrink-0">
                {copiedId ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {isOwner && (
            <div className="flex gap-2 flex-1">
              <Button
                type="button"
                variant="destructive"
                onClick={onDelete}
                disabled={savingSettings || deletingTeam}
                size="sm"
              >
                {deletingTeam ? (
                  <><Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />Usuwanie...</>
                ) : (
                  <><Trash2 className="w-3.5 h-3.5 mr-1.5" />Usuń zespół</>
                )}
              </Button>
            </div>
          )}
          <div className="flex gap-2 sm:ml-auto">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={savingSettings || deletingTeam}
            >
              Anuluj
            </Button>
            <Button
              onClick={onSave}
              disabled={savingSettings || deletingTeam}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {savingSettings ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Zapisywanie...</>
              ) : "Zapisz zmiany"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
