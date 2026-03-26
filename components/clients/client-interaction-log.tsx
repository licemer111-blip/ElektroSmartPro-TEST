"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PolishDatePicker } from "@/components/ui/polish-date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Phone, Mail, Calendar, MessageSquare, FileText, Plus, Clock,
  Trash2, Bell, CheckCircle2,
} from "lucide-react";

interface Interaction {
  id: string;
  type: "call" | "email" | "meeting" | "note" | "reminder";
  title: string;
  description: string;
  date: string;
  completed?: boolean;
}

interface ClientInteractionLogProps {
  clientId: string;
  clientName: string;
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  call: { label: "Telefon", icon: <Phone className="w-3.5 h-3.5" />, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30" },
  email: { label: "E-mail", icon: <Mail className="w-3.5 h-3.5" />, color: "text-indigo-600", bg: "bg-indigo-100 dark:bg-indigo-900/30" },
  meeting: { label: "Spotkanie", icon: <Calendar className="w-3.5 h-3.5" />, color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
  note: { label: "Notatka", icon: <FileText className="w-3.5 h-3.5" />, color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/30" },
  reminder: { label: "Przypomnienie", icon: <Bell className="w-3.5 h-3.5" />, color: "text-rose-600", bg: "bg-rose-100 dark:bg-rose-900/30" },
};

const STORAGE_KEY = "elektrosmart_client_interactions";

function getStoredInteractions(clientId: string): Interaction[] {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    return all[clientId] || [];
  } catch {
    return [];
  }
}

function setStoredInteractions(clientId: string, interactions: Interaction[]) {
  try {
    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    all[clientId] = interactions;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {}
}

export function ClientInteractionLog({ clientId, clientName }: ClientInteractionLogProps) {
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [addOpen, setAddOpen] = useState(false);
  const [newType, setNewType] = useState<Interaction["type"]>("call");
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);

  useEffect(() => {
    setInteractions(getStoredInteractions(clientId));
  }, [clientId]);

  const saveInteraction = () => {
    if (!newTitle.trim()) return;
    const interaction: Interaction = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type: newType,
      title: newTitle.trim(),
      description: newDesc.trim(),
      date: newDate,
      completed: newType !== "reminder",
    };
    const updated = [interaction, ...interactions];
    setInteractions(updated);
    setStoredInteractions(clientId, updated);
    setAddOpen(false);
    setNewTitle("");
    setNewDesc("");
    setNewType("call");
    setNewDate(new Date().toISOString().split("T")[0]);
  };

  const deleteInteraction = (id: string) => {
    const updated = interactions.filter((i) => i.id !== id);
    setInteractions(updated);
    setStoredInteractions(clientId, updated);
  };

  const toggleReminder = (id: string) => {
    const updated = interactions.map((i) =>
      i.id === id ? { ...i, completed: !i.completed } : i
    );
    setInteractions(updated);
    setStoredInteractions(clientId, updated);
  };

  const pendingReminders = interactions.filter(
    (i) => i.type === "reminder" && !i.completed
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            Historia kontaktów
          </CardTitle>
          <Button
            onClick={() => setAddOpen(true)}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Dodaj
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Pending reminders */}
        {pendingReminders.length > 0 && (
          <div className="rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20 p-3 mb-3">
            <p className="text-[10px] font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Bell className="w-3 h-3" />
              Aktywne przypomnienia ({pendingReminders.length})
            </p>
            {pendingReminders.map((r) => (
              <div key={r.id} className="flex items-center justify-between gap-2 py-1">
                <div className="flex items-center gap-2 min-w-0">
                  <button
                    onClick={() => toggleReminder(r.id)}
                    className="w-4 h-4 rounded border border-rose-300 hover:bg-rose-200 transition-colors flex-shrink-0"
                  />
                  <span className="text-xs font-medium truncate">{r.title}</span>
                  <span className="text-[10px] text-muted-foreground">{r.date}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Timeline */}
        {interactions.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-20" />
            <p className="text-sm">Brak wpisów</p>
            <p className="text-xs mt-1">Dodaj notatki z rozmów, spotkań, e-maili</p>
          </div>
        ) : (
          <div className="relative space-y-0">
            {/* Timeline line */}
            <div className="absolute left-4 top-2 bottom-2 w-px bg-slate-200 dark:bg-slate-700" />

            {interactions.map((interaction) => {
              const config = TYPE_CONFIG[interaction.type] || TYPE_CONFIG.note;
              return (
                <div key={interaction.id} className="relative flex gap-3 group py-2">
                  {/* Icon */}
                  <div className={`w-8 h-8 rounded-full ${config.bg} flex items-center justify-center flex-shrink-0 z-10 ${config.color} ${
                    interaction.type === "reminder" && interaction.completed ? "opacity-50" : ""
                  }`}>
                    {interaction.type === "reminder" && interaction.completed ? (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    ) : (
                      config.icon
                    )}
                  </div>

                  {/* Content */}
                  <div className={`flex-1 min-w-0 pb-2 ${
                    interaction.type === "reminder" && interaction.completed ? "opacity-50" : ""
                  }`}>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">{interaction.title}</span>
                      <Badge variant="outline" className="text-[9px] h-4 px-1">
                        {config.label}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 ml-auto">
                        <Clock className="w-2.5 h-2.5" />
                        {interaction.date}
                      </span>
                      <button
                        onClick={() => deleteInteraction(interaction.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-red-500"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    {interaction.description && (
                      <p className="text-[11px] text-muted-foreground mt-0.5 whitespace-pre-wrap">
                        {interaction.description}
                      </p>
                    )}
                    {interaction.type === "reminder" && !interaction.completed && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => toggleReminder(interaction.id)}
                        className="mt-1 h-6 text-[10px] text-emerald-600 border-emerald-200"
                      >
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Oznacz jako wykonane
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Add interaction dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nowy wpis kontaktowy</DialogTitle>
            <DialogDescription className="sr-only">Formularz dodawania nowego wpisu w historii kontaktu z klientem.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <label htmlFor="interaction-type" className="text-xs font-medium">Typ</label>
              <Select value={newType} onValueChange={(v) => setNewType(v as Interaction["type"])}>
                <SelectTrigger id="interaction-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>
                      <span className="flex items-center gap-2">
                        {cfg.icon} {cfg.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="interaction-title" className="text-xs font-medium">Tytuł *</label>
              <Input
                id="interaction-title"
                name="interaction-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={newType === "call" ? "np. Rozmowa o wycenie" : newType === "reminder" ? "np. Zadzwonić w piątek" : "Tytuł wpisu"}
                onKeyDown={(e) => { if (e.key === "Enter" && newTitle.trim()) saveInteraction(); }}
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium">Data</label>
              <PolishDatePicker
                value={newDate}
                onChange={(iso) => setNewDate(iso)}
              />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="interaction-desc" className="text-xs font-medium">Opis (opcjonalnie)</label>
              <Textarea
                id="interaction-desc"
                name="interaction-desc"
                aria-label="Opis interakcji"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Szczegóły rozmowy, ustalenia, notatki..."
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Anuluj</Button>
            <Button
              onClick={saveInteraction}
              disabled={!newTitle.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Zapisz
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
