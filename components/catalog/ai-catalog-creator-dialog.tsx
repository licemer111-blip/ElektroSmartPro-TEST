"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Loader2, CheckCircle2, AlertCircle, PackagePlus, Users, Lock } from "lucide-react";
import { generateCatalogItemsWithAI } from "@/app/dashboard/catalog/ai-catalog-actions";
import { useModalStore } from "@/hooks/use-modal-store";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import type { Team, DataVisibility } from "@/lib/types/database";

interface AICatalogCreatorDialogProps {
  isPro: boolean;
  triggerClassName?: string;
  userTeam?: Team | null;
}

export function AICatalogCreatorDialog({ isPro, triggerClassName, userTeam }: AICatalogCreatorDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [remainingRequests, setRemainingRequests] = useState<number | null>(null);
  const [visibility, setVisibility] = useState<DataVisibility>("personal");
  const [result, setResult] = useState<{
    success: boolean;
    createdCount?: number;
    error?: string;
  } | null>(null);
  const { onOpen } = useModalStore();
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      loadRemainingRequests();
    }
  }, [isOpen]);

  const loadRemainingRequests = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data: usageCount } = await supabase.rpc('get_monthly_ai_usage', {
        p_user_id: user.id,
        p_feature: 'catalog_creator'
      });

      if (usageCount !== null) {
        setRemainingRequests(100 - usageCount);
      }
    } catch (error) {
      console.error("Failed to load remaining requests:", error);
    }
  };

  const exampleDescriptions = [
    "Montaż gniazd — gniazdo pojedyncze, podwójne, hermetyczne IP44, puszka podtynkowa Ø60, montaż osprzętu podtynkowego",
    "Prace kablowe — układanie YDYp 3×1,5 i 3×2,5mm² w tynku i na tynku, kucie bruzd w cegle/betonie, zaprawianie",
    "Łączniki i sterowanie — łącznik pojedynczy, schodowy, krzyżowy, ściemniacz LED, czujnik ruchu PIR, przycisk dzwonkowy",
    "Montaż rozdzielnicy — MCB B16/B25, RCD 40A/30mA, RCBO, SPD T2, szyna N/PE, okablowanie wewnętrzne, opisy",
    "Pomiary i odbiory — rezystancja izolacji, impedancja pętli zwarcia, prąd RCD, protokół E01/E02, sprawdzenie ciągłości PE",
    "Oświetlenie LED — downlight Ø150/Ø200, panel 60×60, oprawa liniowa, awaryjna 3h, ewakuacyjna EXIT, kinkiet IP44",
    "Osprzęt łazienkowy IP44/IP65 — gniazdo hermetyczne, łącznik hermetyczny, oprawa IP65, wentylator z timerem/czujnikiem",
  ];

  const handleGenerate = async () => {
    if (!description.trim()) return;

    setIsGenerating(true);
    setResult(null);

    try {
      const response = await generateCatalogItemsWithAI({
        description,
        visibility,
        team_id: visibility === "team" && userTeam?.id ? userTeam.id : undefined,
      });

      setResult(response);

      if (response.success) {
        // Reload remaining requests
        loadRemainingRequests();
        // Close dialog after 2 seconds on success and refresh page
        setTimeout(() => {
          setIsOpen(false);
          setDescription("");
          setResult(null);
          router.refresh(); // Refresh to show new catalog items
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
          className={triggerClassName ?? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-md w-full sm:w-auto text-xs sm:text-sm inline-flex items-center justify-center"}
        >
          ES Creator
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <PackagePlus className="w-4 h-4 text-white" />
            </div>
            ES Creator Pozycji
            <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900 dark:bg-slate-700 text-[9px] font-medium text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ES-Intelligence v2.1
            </span>
          </DialogTitle>
          <DialogDescription>
            Opisz kategorię — silnik inżynieryjny wygeneruje 5-15 pozycji z cenami
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Remaining Requests — compact inline */}
          {remainingRequests !== null && remainingRequests <= 10 && (
            <p className={`text-[10px] font-medium px-2 py-1 rounded-md ${
              remainingRequests > 0
                ? "bg-orange-50 dark:bg-orange-950/20 text-orange-700 dark:text-orange-300"
                : "bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-300"
            }`}>
              {remainingRequests > 0 ? `⚠️ Zostało ${remainingRequests} / 100 żądań` : "❌ Osiągnięto limit 100 żądań"}
            </p>
          )}

          {/* Description Input */}
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder='np. Montaż osprzętu podtynkowego — gniazda, łączniki, puszki, kucie bruzd, pomiary...'
            rows={4}
            className="text-sm resize-none"
            disabled={isGenerating}
          />

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
              <p className="text-xs font-medium">{result.success ? `Utworzono ${result.createdCount} pozycji!` : result.error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={handleGenerate}
              disabled={!description.trim() || isGenerating}
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            >
              {isGenerating ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generowanie...</>) : (<><Sparkles className="w-4 h-4 mr-2" />Wygeneruj pozycje</>)}
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
