"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { useSingleAiQuota } from "@/hooks/use-ai-quota";
import { QuotaBadge, QuotaBlocker } from "@/components/ui/quota-badge";
import { AI_FUNCTION_NAMES } from "@/lib/ai-quota-config";
import { VoiceInputButton } from "@/components/ui/voice-input-button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, CheckCircle2, AlertCircle, Boxes, Users, Lock } from "lucide-react";
import { generateAssembliesWithAI } from "@/app/dashboard/assemblies/ai-actions";
import { useModalStore } from "@/hooks/use-modal-store";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import type { Team, DataVisibility } from "@/lib/types/database";

interface AIAssemblyGeneratorDialogProps {
  isPro?: boolean;
  userTeam?: Team | null;
  triggerClassName?: string;
}

export function AIAssemblyGeneratorDialog({ isPro = false, userTeam, triggerClassName }: AIAssemblyGeneratorDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<DataVisibility>("personal");
  const [result, setResult] = useState<{
    success: boolean;
    createdCount?: number;
    error?: string;
  } | null>(null);
  const { onOpen } = useModalStore();
  const router = useRouter();

  const { info: quotaInfo, refresh: refreshQuota } = useSingleAiQuota(userId, AI_FUNCTION_NAMES.aiAssemblies);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  const exampleDescriptions = [
    "Punkt gniazda pojedynczego - puszka podtynkowa, przewód YDYp 3x2,5mm² 15mb, gniazdo z uziemieniem + montaż i kucie bruzd",
    "Punkt gniazda podwójnego - puszka głęboka, przewód YDYp 3x2,5mm² 15mb, gniazdo podwójne + montaż",
    "Punkt oświetleniowy LED - przewód YDYp 3x1,5mm² 12mb, łącznik pojedynczy, oprawa LED downlight + montaż",
    "Punkt oświetlenia schodowego - przewód YDYp 3x1,5mm² 25mb, 2x łącznik schodowy, oprawa LED + montaż",
    "Rozdzielnica mieszkaniowa 2x12 - obudowa, wyłączniki B16, RCD 40A/30mA, ogranicznik przepięć, szyna N/PE + montaż i pomiary",
    "Punkt gniazda DATA - przewód UTP kat.6 20mb, gniazdo RJ45, puszka podtynkowa + montaż",
    "Kompletna instalacja łazienki - 2 gniazda IP44, oprawa LED IP65, wentylator z timerem, przewody + montaż",
  ];

  const handleGenerate = async () => {
    if (!description.trim()) return;

    setIsGenerating(true);
    setResult(null);

    try {
      const response = await generateAssembliesWithAI({
        description,
        visibility,
        team_id: visibility === "team" && userTeam?.id ? userTeam.id : undefined,
      });

      setResult(response);

      if (response.success) {
        void refreshQuota();
        setTimeout(() => {
          setIsOpen(false);
          setDescription("");
          setResult(null);
          router.refresh(); // Refresh to show new assemblies
        }, 2000);
      } else if (response.error?.includes("Premium")) {
        // Show upgrade prompt for non-premium users
        setIsOpen(false); // Close AI dialog first
        onOpen('proModal'); // Open main PRO modal
      }
    } catch (error) {
      setResult({
        success: false,
        error: "Nieoczekiwany błąd",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <button
          className={triggerClassName ?? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-sm h-9 text-xs font-semibold gap-1.5 px-4 rounded-md inline-flex items-center justify-center"}
        >
          ES Generator
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Boxes className="w-4 h-4 text-white" />
            </div>
            ES Generator Zestawów
            <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900 dark:bg-slate-700 text-[9px] font-medium text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ES-Intelligence v2.1
            </span>
            <QuotaBadge info={quotaInfo} className="ml-1" />
          </DialogTitle>
          <DialogDescription>
            Opisz typ instalacji — silnik inżynieryjny wygeneruje 3-5 zestawów z materiałami i robocizną
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {quotaInfo?.isExhausted && (
            <QuotaBlocker info={quotaInfo} featureName="ES Generator Zestawów" />
          )}

          {/* Description Input */}
          <div className="relative">
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder='np. Punkt gniazdkowy — puszka + przewód + gniazdo + montaż...'
              rows={4}
              className="text-sm resize-none pr-10"
              disabled={isGenerating}
            />
            <div className="absolute bottom-2 right-2">
              <VoiceInputButton
                onTranscript={(text) => setDescription((prev) => prev ? `${prev} ${text}` : text)}
                disabled={isGenerating}
                title="Nagraj opis głosem"
              />
            </div>
          </div>

          {/* Templates — compact chips */}
          <div className="flex flex-wrap gap-1.5">
            {exampleDescriptions.slice(0, 5).map((example, idx) => {
              const shortLabel = example.split(" - ")[0].split(" — ")[0];
              return (
                <button
                  key={idx}
                  onClick={() => setDescription(example)}
                  disabled={isGenerating}
                  className="text-[10px] px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-orange-50 dark:hover:bg-orange-950/30 hover:border-orange-400 text-slate-600 dark:text-slate-400 transition-colors whitespace-nowrap disabled:opacity-50"
                >
                  {shortLabel}
                </button>
              );
            })}
          </div>

          {/* Team Visibility Toggle */}
          {userTeam && (
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2">
                {visibility === "team" ? (
                  <Users className="w-3.5 h-3.5 text-blue-500" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span className="text-xs text-slate-600 dark:text-slate-400">
                  {visibility === "team" ? `Zespół: ${userTeam.name}` : "Tylko dla mnie"}
                </span>
              </div>
              <Switch
                checked={visibility === "team"}
                onCheckedChange={(checked) => setVisibility(checked ? "team" : "personal")}
                disabled={isGenerating}
              />
            </div>
          )}

          {/* Result Display */}
          {result && (
            <div className={`flex items-center gap-2 p-2.5 rounded-lg ${
              result.success ? "bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-200" : "bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-200"
            }`}>
              {result.success ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
              <p className="text-xs font-medium">{result.success ? `Utworzono ${result.createdCount} zestawów!` : result.error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !description.trim() || quotaInfo?.isExhausted}
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            >
              {isGenerating ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generowanie...</>) : (<><Sparkles className="w-4 h-4 mr-2" />Wygeneruj zestawy</>)}
            </Button>
            <Button variant="outline" onClick={() => { setIsOpen(false); setDescription(""); setResult(null); }} disabled={isGenerating}>
              Anuluj
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
