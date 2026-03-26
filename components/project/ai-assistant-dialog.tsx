"use client";

import { useState, useEffect, useRef } from "react";
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
import { Sparkles, Loader2, CheckCircle2, AlertCircle, Wand2, Search, Trash2, AlertTriangle } from "lucide-react";
import { generateProjectItemsWithAI } from "@/app/dashboard/projects/[id]/ai-actions";
import { findDuplicatesWithAI, mergeDuplicates } from "@/app/dashboard/projects/[id]/duplicate-actions";
import { useModalStore } from "@/hooks/use-modal-store";
import { useToast } from "@/hooks/use-toast";
import { useSingleAiQuota } from "@/hooks/use-ai-quota";
import { QuotaBadge, QuotaBlocker } from "@/components/ui/quota-badge";
import { AI_FUNCTION_NAMES } from "@/lib/ai-quota-config";
import { VoiceInputButton } from "@/components/ui/voice-input-button";

interface AIAssistantDialogProps {
  projectId: string;
  isPro?: boolean;
  projectStatus?: string;
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
}

interface DuplicateGroup {
  masterItem: { id: string; name: string; quantity: number; unit: string; similarityScore: number };
  duplicates: Array<{ id: string; name: string; quantity: number; unit: string; similarityScore: number }>;
  totalWasted: number;
}

type TabType = "generate" | "duplicates";

export function AIAssistantDialog({ projectId, isPro = false, projectStatus = "draft", externalOpen, onExternalOpenChange }: AIAssistantDialogProps) {
  const isFinal = projectStatus === "final";
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);

  // Sync with external (viewer) open state
  const prevExternalOpen = useRef<boolean | undefined>(undefined);
  useEffect(() => {
    if (externalOpen !== undefined && externalOpen !== prevExternalOpen.current) {
      prevExternalOpen.current = externalOpen;
      setIsOpen(externalOpen);
    }
  }, [externalOpen]);
  const [tab, setTab] = useState<TabType>("generate");
  const [userId, setUserId] = useState<string | null>(null);

  // Generate tab state
  const [description, setDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<{ success: boolean; addedCount?: number; error?: string } | null>(null);
  const { onOpen } = useModalStore();

  // Duplicates tab state
  const [isScanning, setIsScanning] = useState(false);
  const [isMerging, setIsMerging] = useState<string | null>(null);
  const [dupGroups, setDupGroups] = useState<DuplicateGroup[]>([]);
  const [dupScanned, setDupScanned] = useState(false);

  const { info: quotaInfo, refresh: refreshQuota } = useSingleAiQuota(userId, AI_FUNCTION_NAMES.generateItems);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  const exampleDescriptions = [
    "Mieszkanie 55m² - salon, sypialnia, kuchnia, łazienka. Gniazda podtynkowe, oświetlenie LED downlight, rozdzielnica 2x12 modułów",
    "Salon 25m² - 6 gniazd podtynkowych, 4 punkty oświetlenia LED downlight, 2 łączniki schodowe, przewody YDYp",
    "Łazienka - 2 gniazda IP44 z uziemieniem, oprawa LED IP65, wentylator z timerem, przewód YDYp 3x2,5mm²",
    "Kuchnia - 4 gniazda blat roboczy, 2 gniazda AGD (piekarnik, zmywarka), oświetlenie podszafkowe LED, osobne obwody",
  ];

  const handleGenerate = async () => {
    if (!description.trim()) return;
    setIsGenerating(true);
    setResult(null);
    try {
      const investmentContext = localStorage.getItem("es-investment-context") ?? undefined;
      const response = await generateProjectItemsWithAI(projectId, description, investmentContext);
      setResult(response);
      if (response.success) {
        void refreshQuota();
        setTimeout(() => { setIsOpen(false); setDescription(""); setResult(null); }, 2000);
      } else if (response.error?.includes("Premium")) {
        setIsOpen(false);
        onOpen('proModal');
      }
    } catch (error: unknown) {
      if (error instanceof Error && (error.message.includes("Failed to find Server Action") || error.message.includes("Server Action"))) {
        setResult({ success: false, error: "Strona wymaga odświeżenia. Odśwież stronę i spróbuj ponownie." });
      } else {
        setResult({ success: false, error: "Nieoczekiwany błąd. Spróbuj ponownie." });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDupScan = async () => {
    setIsScanning(true);
    setDupScanned(false);
    try {
      const response = await findDuplicatesWithAI(projectId);
      if (response.success && response.groups) {
        setDupGroups(response.groups);
        setDupScanned(true);
      }
    } catch {
      // scan failed silently
    } finally {
      setIsScanning(false);
    }
  };

  const handleDupMerge = async (masterItemId: string, duplicateIds: string[]) => {
    setIsMerging(masterItemId);
    try {
      const response = await mergeDuplicates(projectId, masterItemId, duplicateIds);
      if (response.success) {
        setDupGroups(prev => prev.filter(g => g.masterItem.id !== masterItemId));
      }
    } catch {
      // merge failed silently
    } finally {
      setIsMerging(null);
    }
  };

  const totalDuplicates = dupGroups.reduce((sum, g) => sum + g.duplicates.length, 0);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (open && isFinal) {
        toast({ title: "🔒 Projekt zablokowany", description: "Odblokuj projekt, aby używać ES-Engine", variant: "destructive" });
        return;
      }
      setIsOpen(open);
      onExternalOpenChange?.(open);
    }}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            if (isFinal) {
              e.preventDefault();
              toast({ title: "🔒 Projekt zablokowany", description: "Odblokuj projekt, aby używać ES-Engine", variant: "destructive" });
            }
          }}
          className={`h-7 sm:h-8 text-[11px] sm:text-xs gap-1.5 flex-shrink-0 rounded-md bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 ${isFinal ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>ES Assist</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Wand2 className="w-4 h-4 text-white" />
            </div>
            ES-Engine
            <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-900 dark:bg-slate-700 text-[9px] font-medium text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Napędzane przez ES-Engine
            </span>
            <QuotaBadge info={quotaInfo} className="ml-1" />
          </DialogTitle>
          <DialogDescription>
            {tab === "generate" ? "Opisz pomieszczenie — silnik inżynieryjny wygeneruje BOM" : "Znajdź i scal zduplikowane pozycje"}
          </DialogDescription>
        </DialogHeader>

        {/* Tab switcher */}
        <div className="flex gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <button
            onClick={() => setTab("generate")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              tab === "generate"
                ? "bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Generuj pozycje
          </button>
          <button
            onClick={() => setTab("duplicates")}
            className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
              tab === "duplicates"
                ? "bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700"
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            Duplikaty
          </button>
        </div>

        {/* Generate tab */}
        {tab === "generate" && (
          <div className="space-y-3">
            {quotaInfo?.isExhausted && (
              <QuotaBlocker info={quotaInfo} featureName="ES-Engine Generowania" />
            )}

            <div className="relative">
              <Textarea
                id="description"
                placeholder="np. Mieszkanie 55m² — salon, sypialnia, kuchnia, łazienka. Gniazda podtynkowe, oświetlenie LED, rozdzielnica 2x12 modułów..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="text-sm resize-none pr-10"
              />
              <div className="absolute bottom-2 right-2">
                <VoiceInputButton
                  onTranscript={(text) => setDescription((prev) => prev ? `${prev} ${text}` : text)}
                  disabled={isGenerating}
                  title="Nagraj opis głosem"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {exampleDescriptions.map((example, idx) => {
                const shortLabel = example.split(" - ")[0].split(" — ")[0];
                return (
                  <button
                    key={idx}
                    onClick={() => setDescription(example)}
                    className="text-[10px] px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-700 hover:bg-orange-50 dark:hover:bg-orange-950/30 hover:border-orange-400 text-slate-600 dark:text-slate-400 transition-colors whitespace-nowrap"
                  >
                    {shortLabel}
                  </button>
                );
              })}
            </div>

            {result && (
              <div className={`flex items-center gap-2 p-2.5 rounded-lg ${
                result.success ? "bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-200" : "bg-red-50 dark:bg-red-950/20 text-red-800 dark:text-red-200"
              }`}>
                {result.success ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                <p className="text-xs font-medium">{result.success ? `Dodano ${result.addedCount} pozycji!` : result.error}</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleGenerate}
                disabled={!description.trim() || isGenerating || quotaInfo?.isExhausted}
                className="flex-1 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
              >
                {isGenerating ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generowanie...</>) : (<><Sparkles className="w-4 h-4 mr-2" />Wygeneruj pozycje</>)}
              </Button>
              <Button variant="outline" onClick={() => { setIsOpen(false); setDescription(""); setResult(null); }} disabled={isGenerating}>
                Anuluj
              </Button>
            </div>
          </div>
        )}

        {/* Duplicates tab */}
        {tab === "duplicates" && (
          <div className="space-y-3">
            {!dupScanned ? (
              <>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  ES-Engine przeskanuje kosztorys i znajdzie podobne pozycje (np. &quot;Gniazdo podwójne&quot; i &quot;Gniazdko podwójne&quot;). Duplikaty można scalić — ilości się zsumują.
                </p>
                <Button
                  onClick={handleDupScan}
                  disabled={isScanning}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                >
                  {isScanning ? (<><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analizuję pozycje...</>) : (<><Search className="w-4 h-4 mr-2" />Skanuj kosztorys</>)}
                </Button>
              </>
            ) : dupGroups.length === 0 ? (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-green-50 dark:bg-green-950/20 text-green-800 dark:text-green-200">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <p className="text-xs font-medium">Nie znaleziono duplikatów — kosztorys jest czysty!</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-orange-50 dark:bg-orange-950/20 text-orange-800 dark:text-orange-200">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <p className="text-xs font-medium">Znaleziono {totalDuplicates} duplikatów w {dupGroups.length} grupach</p>
                </div>

                <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                  {dupGroups.map((group) => (
                    <div key={group.masterItem.id} className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div className="flex items-start gap-2 mb-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">{group.masterItem.name}</p>
                          <p className="text-[10px] text-slate-500">{group.masterItem.quantity} {group.masterItem.unit}</p>
                        </div>
                      </div>
                      {group.duplicates.map((dup) => (
                        <div key={dup.id} className="pl-5 py-0.5 border-l-2 border-orange-300 dark:border-orange-700 ml-1">
                          <p className="text-[10px] text-slate-600 dark:text-slate-400 truncate">
                            {dup.name} · {dup.quantity} {dup.unit} · {Math.round(dup.similarityScore * 100)}%
                          </p>
                        </div>
                      ))}
                      <Button
                        size="sm"
                        onClick={() => handleDupMerge(group.masterItem.id, group.duplicates.map(d => d.id))}
                        disabled={isMerging !== null}
                        className="w-full mt-2 h-7 text-[11px] bg-red-600 hover:bg-red-700 text-white"
                      >
                        {isMerging === group.masterItem.id ? (<><Loader2 className="w-3 h-3 mr-1.5 animate-spin" />Scalanie...</>) : (<><Trash2 className="w-3 h-3 mr-1.5" />Scal i usuń duplikaty</>)}
                      </Button>
                    </div>
                  ))}
                </div>
              </>
            )}

            {dupScanned && (
              <Button variant="outline" size="sm" onClick={handleDupScan} disabled={isScanning} className="w-full">
                Skanuj ponownie
              </Button>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
