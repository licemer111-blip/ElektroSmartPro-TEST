"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Loader2, CheckCircle, Send, Sparkles, Check, ChevronLeft } from "lucide-react";
import { VoiceInputButton } from "@/components/ui/voice-input-button";
import { cn } from "@/lib/utils";
import { sendProjectEmail } from "@/app/dashboard/projects/[id]/email-actions";
import { getProjectDocsSummary, type ProjectDocSummary } from "@/app/dashboard/projects/[id]/document-actions";
import { EMAIL_TEMPLATES } from "@/lib/email-templates";
import { useToast } from "@/hooks/use-toast";

// Visual email template definitions (mirrors server-side palettes)
const VISUAL_TEMPLATES = [
  {
    id: "klasyczny",
    name: "Klasyczny",
    description: "Elegancki szary — neutralny i profesjonalny",
    headerGradient: "linear-gradient(135deg, #475569, #64748b, #94a3b8)",
    accent: "#64748b",
    swatches: ["#475569", "#64748b", "#94a3b8"],
  },
  {
    id: "nowoczesny",
    name: "Nowoczesny",
    description: "Turkusowy — świeży i nowoczesny",
    headerGradient: "linear-gradient(135deg, #0d9488, #14b8a6, #5eead4)",
    accent: "#0d9488",
    swatches: ["#0d9488", "#14b8a6", "#5eead4"],
  },
  {
    id: "elegancki",
    name: "Elegancki",
    description: "Ciemny granat ze złotym akcentem",
    headerGradient: "linear-gradient(135deg, #1e293b, #334155, #475569)",
    accent: "#b8860b",
    swatches: ["#1e293b", "#334155", "#b8860b"],
  },
  {
    id: "korporacyjny",
    name: "Korporacyjny",
    description: "Niebieski — biznesowy i solidny",
    headerGradient: "linear-gradient(135deg, #1e3a5f, #2563eb, #3b82f6)",
    accent: "#2563eb",
    swatches: ["#1e3a5f", "#2563eb", "#3b82f6"],
  },
  {
    id: "premium",
    name: "Premium",
    description: "Fioletowy — wyrazisty i ekskluzywny",
    headerGradient: "linear-gradient(135deg, #4c1d95, #7c3aed, #a78bfa)",
    accent: "#7c3aed",
    swatches: ["#4c1d95", "#7c3aed", "#a78bfa"],
  },
];

interface SendEmailDialogProps {
  projectId: string;
  projectName: string;
  projectTotal: number;
  projectStatus?: string;
  disabled?: boolean;
  triggerLabel?: string;
  userProfile?: {
    full_name?: string;
    company_name?: string;
    phone?: string;
    email?: string;
  };
}

export function SendEmailDialog({
  projectId,
  projectName,
  projectTotal,
  projectStatus = "draft",
  disabled = false,
  triggerLabel,
  userProfile,
}: SendEmailDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"compose" | "templates">("compose");
  const [selectedTemplate, setSelectedTemplate] = useState("professional");
  const [visualTemplate, setVisualTemplate] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("email-visual-template") || "klasyczny";
    }
    return "klasyczny";
  });
  const [docsSummary, setDocsSummary] = useState<ProjectDocSummary>({ calculators: 0, panelPdfs: 0, panelWidok: 0, panelSchemat: 0, other: [] });

  // Fetch project documents summary when dialog opens
  useEffect(() => {
    if (!open) return;
    getProjectDocsSummary(projectId)
      .then(setDocsSummary)
      .catch(() => setDocsSummary({ calculators: 0, panelPdfs: 0, panelWidok: 0, panelSchemat: 0, other: [] }));
  }, [open, projectId]);

  const [formData, setFormData] = useState({
    recipientEmail: "",
    recipientName: "",
    senderName: userProfile?.full_name || "",
    subject: "",
    body: "",
  });

  // Load template when selected
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = EMAIL_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setFormData({
        ...formData,
        subject: template.subject,
        body: template.body,
      });
    }
    setView("compose");
  };

  const handleSend = async () => {
    if (!formData.recipientEmail || !formData.recipientName || !formData.senderName) {
      toast({
        title: "Błąd",
        description: "Wypełnij wszystkie wymagane pola (odbiorca, email, wysyłający)",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const result = await sendProjectEmail({
        projectId,
        recipientEmail: formData.recipientEmail,
        recipientName: formData.recipientName,
        senderName: formData.senderName,
        subject: formData.subject,
        body: formData.body,
        templateType: selectedTemplate,
        visualTemplate,
      });

      if (result.success) {
        toast({
          title: "✅ Email wysłany!",
          description: `Oferta wysłana do ${formData.recipientName}`,
        });
        
        setOpen(false);
        router.refresh();
        
        // Reset form
        setFormData({
          recipientEmail: "",
          recipientName: "",
          senderName: userProfile?.full_name || "",
          subject: "",
          body: "",
        });
        setSelectedTemplate("professional");
        // Don't reset visual template — it's a persistent preference
      } else {
        toast({
          title: "Błąd",
          description: result.error || "Nie udało się wysłać emaila",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Wystąpił nieoczekiwany błąd",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const currentTemplate = EMAIL_TEMPLATES.find(t => t.id === selectedTemplate);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          size="sm"
          className="w-full h-8 text-xs gap-1.5 rounded-md bg-blue-600 text-white hover:bg-blue-700 border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-[1.02] hover:shadow-lg hover:shadow-blue-500/40"
          disabled={disabled}
          title={disabled ? "Zapisz projekt jako finalny, aby wysłać ofertę" : "Wyślij ofertę do klienta"}
        >
          <Mail className="h-3.5 w-3.5" />
          {triggerLabel || "Wyślij email"}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-3xl max-h-[90vh] overflow-y-auto p-0">
        {/* Blue header */}
        <div className="bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 px-6 py-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2.5 text-white">
              <div className="bg-white/15 p-1.5 rounded-lg">
                <Mail className="w-4 h-4 text-white" />
              </div>
              <span className="text-base font-semibold">Wyślij ofertę emailem</span>
            </DialogTitle>
            <DialogDescription className="text-blue-100 text-xs mt-1 pl-[34px]">
              Projekt: <span className="font-semibold text-white">{projectName}</span> — {projectTotal.toFixed(2)} PLN
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* View toggle */}
        <div className="px-5 pt-4 pb-0">
          <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              onClick={() => setView("compose")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all",
                view === "compose"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              )}
            >
              <Mail className="h-3.5 w-3.5" />
              Utwórz email
            </button>
            <button
              onClick={() => setView("templates")}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all",
                view === "templates"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              )}
            >
              <Sparkles className="h-3.5 w-3.5" />
              Szablony emaila
            </button>
          </div>
        </div>

        {/* COMPOSE VIEW */}
        {view === "compose" && (
          <div className="px-5 py-4 space-y-4">
            {/* Current templates indicator */}
            <div
              className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              onClick={() => setView("templates")}
            >
              <div className="flex items-center gap-3">
                {/* Visual template mini swatch */}
                {(() => {
                  const vt = VISUAL_TEMPLATES.find(v => v.id === visualTemplate);
                  return vt ? (
                    <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-700 shadow-sm">
                      <div className="h-5 w-full" style={{ background: vt.headerGradient }} />
                      <div className="h-4 w-full bg-white dark:bg-slate-900 flex items-center px-1">
                        <div className="w-1 h-2 rounded-full" style={{ background: vt.accent }} />
                        <div className="flex-1 ml-0.5 h-0.5 rounded-full bg-slate-200 dark:bg-slate-700" />
                      </div>
                    </div>
                  ) : null;
                })()}
                <div>
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <span>{currentTemplate?.icon}</span>
                    {currentTemplate?.name || "Wybierz szablon"}
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 font-normal">
                      · {VISUAL_TEMPLATES.find(v => v.id === visualTemplate)?.name || "Klasyczny"}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">{currentTemplate?.description}</div>
                </div>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-[11px] text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                Zmień
              </Button>
            </div>

            {/* Sender */}
            <div className="space-y-2">
              <Label htmlFor="senderName" className="text-xs">
                Wysyłający (Twoje imię) <span className="text-red-500">*</span>
              </Label>
              <Input
                id="senderName"
                name="senderName"
                required
                value={formData.senderName}
                onChange={(e) => setFormData({ ...formData, senderName: e.target.value })}
                placeholder="np. Adam Nowak"
                className="h-9"
              />
              <p className="text-[10px] text-muted-foreground">
                Pojawi się w podpisie emaila nad nazwą firmy
              </p>
            </div>

            {/* Recipient Info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="recipientName" className="text-xs">
                  Klient (odbiorca) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="recipientName"
                  name="recipientName"
                  required
                  value={formData.recipientName}
                  onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                  placeholder="np. Jan Kowalski"
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipientEmail" className="text-xs">
                  Email odbiorcy <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="recipientEmail"
                  name="recipientEmail"
                  type="email"
                  required
                  value={formData.recipientEmail}
                  onChange={(e) => setFormData({ ...formData, recipientEmail: e.target.value })}
                  placeholder="np. jan.kowalski@firma.pl"
                  className="h-9"
                />
              </div>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-xs">Temat emaila</Label>
              <Input
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="np. Oferta - Instalacja elektryczna"
                className="h-9"
              />
              <p className="text-[10px] text-muted-foreground">
                Zmienne: {"{{clientName}}"}, {"{{projectName}}"}, {"{{totalAmount}}"} — zostaną automatycznie wypełnione
              </p>
            </div>

            {/* Body */}
            <div className="space-y-2">
              <Label htmlFor="body" className="text-xs">Treść emaila</Label>
              <div className="relative">
                <Textarea
                  id="body"
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  placeholder="Treść wiadomości..."
                  rows={10}
                  className="font-mono text-xs leading-relaxed pr-10"
                />
                <div className="absolute bottom-2 right-2">
                  <VoiceInputButton
                    onTranscript={(text) => setFormData((prev) => ({ ...prev, body: prev.body ? `${prev.body} ${text}` : text }))}
                    title="Dyktuj treść emaila głosem"
                  />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">
                **tekst** = pogrubienie. Zmienne: clientName, projectName, totalAmount, userName, companyName, userEmail, userPhone
              </p>
            </div>

            {/* Attachments info */}
            <div className="flex items-start gap-2.5 p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-[11px] font-semibold text-emerald-900 dark:text-emerald-100">Automatyczne załączniki</p>
                <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mb-1">Wszystkie dokumenty projektu zostaną dołączone do wiadomości</p>
                <div className="text-[10px] text-emerald-700 dark:text-emerald-300 space-y-0.5">
                  <p>📄 Kosztorys PDF (z logo firmy)</p>
                  <p>📊 Kosztorys Excel (.xlsx)</p>
                  {docsSummary.panelPdfs > 0 && (
                    <p>⚡ Rozdzielnica — PDF ({docsSummary.panelPdfs})</p>
                  )}
                  {docsSummary.panelWidok > 0 && (
                    <p>🖼️ Rozdzielnica — Widok SVG ({docsSummary.panelWidok})</p>
                  )}
                  {docsSummary.panelSchemat > 0 && (
                    <p>� Rozdzielnica — Schemat ({docsSummary.panelSchemat})</p>
                  )}
                  {docsSummary.calculators > 0 && (
                    <p>🔬 Obliczenia inżynierskie — PDF ({docsSummary.calculators})</p>
                  )}
                  {docsSummary.other.length > 0 && (
                    <p>📎 Inne dokumenty ({docsSummary.other.length})</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TEMPLATES VIEW — Visual email design selection */}
        {view === "templates" && (
          <div className="px-5 py-4">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Wygląd emaila</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Wybierz styl wizualny wiadomości — tak będzie wyglądał email w skrzynce klienta
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {VISUAL_TEMPLATES.map((vt) => {
                const isSelected = visualTemplate === vt.id;
                return (
                  <button
                    key={vt.id}
                    onClick={() => {
                      setVisualTemplate(vt.id);
                      localStorage.setItem("email-visual-template", vt.id);
                    }}
                    className={cn(
                      "group relative flex flex-col rounded-xl border-2 overflow-hidden transition-all hover:shadow-lg text-left",
                      isSelected
                        ? "border-blue-400 dark:border-blue-500 ring-2 ring-blue-300 dark:ring-blue-600 shadow-md"
                        : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                    )}
                  >
                    {/* Mini email preview */}
                    <div className="relative">
                      {/* Header gradient */}
                      <div
                        className="h-16 w-full"
                        style={{ background: vt.headerGradient }}
                      >
                        {/* Fake logo box */}
                        <div className="flex items-center justify-center h-full">
                          <div className="bg-white/90 rounded px-2 py-1 shadow-sm">
                            <div className="w-8 h-3 rounded-sm" style={{ background: vt.accent, opacity: 0.6 }} />
                          </div>
                        </div>
                      </div>
                      {/* Fake content area */}
                      <div className="bg-white dark:bg-slate-900 px-2.5 py-2">
                        <div className="w-full h-1 rounded-full bg-slate-200 dark:bg-slate-700 mb-1.5" />
                        <div className="flex items-center gap-1 mb-1.5">
                          <div className="w-1 h-4 rounded-full" style={{ background: vt.accent }} />
                          <div className="flex-1 space-y-1">
                            <div className="w-full h-1 rounded-full bg-slate-100 dark:bg-slate-800" />
                            <div className="w-3/4 h-1 rounded-full bg-slate-100 dark:bg-slate-800" />
                          </div>
                        </div>
                        {/* Fake attachment */}
                        <div className="flex items-center gap-1 mt-1.5">
                          <div className="w-3 h-3 rounded" style={{ background: vt.accent, opacity: 0.3 }} />
                          <div className="flex-1 h-1 rounded-full bg-slate-100 dark:bg-slate-800" />
                        </div>
                      </div>
                    </div>

                    {/* Label + swatches */}
                    <div className="px-2.5 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-slate-700 dark:text-slate-200 truncate">{vt.name}</span>
                        {isSelected && (
                          <div className="bg-blue-500 text-white rounded-full p-0.5 flex-shrink-0">
                            <Check className="w-2.5 h-2.5" strokeWidth={3} />
                          </div>
                        )}
                      </div>
                      <div className="flex gap-1 mt-1">
                        {vt.swatches.map((c, i) => (
                          <div key={i} className="w-3 h-3 rounded-full border border-white dark:border-slate-700 shadow-sm" style={{ background: c }} />
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Text template selection below */}
            <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Treść wiadomości</h3>
              <div className="grid gap-2">
                {EMAIL_TEMPLATES.map((template) => {
                  const isSelected = selectedTemplate === template.id;
                  return (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template.id)}
                      className={cn(
                        "flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-all",
                        isSelected
                          ? "border-blue-300 dark:border-blue-600 bg-blue-50/50 dark:bg-blue-950/20"
                          : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900"
                      )}
                    >
                      <span className="text-base flex-shrink-0">{template.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">{template.name}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{template.description}</div>
                      </div>
                      {isSelected && (
                        <div className="bg-blue-500 text-white rounded-full p-0.5 flex-shrink-0">
                          <Check className="w-3 h-3" strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-4 flex justify-center">
              <Button variant="ghost" size="sm" onClick={() => setView("compose")} className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 gap-1.5">
                <ChevronLeft className="w-3.5 h-3.5" />
                Wróć do edycji
              </Button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" className="text-xs h-8" onClick={() => setOpen(false)} disabled={loading}>
            Anuluj
          </Button>
          <Button 
            onClick={handleSend} 
            disabled={loading}
            size="sm"
            className="h-8 text-xs bg-blue-600 text-white hover:bg-blue-700 shadow-sm border-transparent disabled:opacity-50 gap-1.5"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Wysyłanie...
              </>
            ) : (
              <>
                <Send className="h-3.5 w-3.5" />
                Wyślij email
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
