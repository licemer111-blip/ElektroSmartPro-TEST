"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Sparkles, AlertTriangle, Crown } from "lucide-react";
import { generateProCatalog } from "@/app/dashboard/settings/actions";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ProCatalogGeneratorButtonProps {
  isPro?: boolean;
}

export function ProCatalogGeneratorButton({ isPro = false }: ProCatalogGeneratorButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleGenerate = () => {
    startTransition(async () => {
      try {
        const result = await generateProCatalog();

        if (result.success) {
          toast({
            title: "✅ Baza PRO Wygenerowana!",
            description: `${result.message}\n\nWygenerowano ${result.count} pozycji obejmujących:\n• Standard Catalog (~350 pozycji)\n• Matrix Catalog (~583 pozycje)\n• Kable, Osprzęt, Rozdzielnice\n• Systemy bezpieczeństwa\n• Infrastruktura przemysłowa\n• Monitoring i Smart Home`,
            duration: 10000,
          });
          setIsOpen(false);
        } else {
          toast({
            title: "❌ Błąd generatora",
            description: result.error || "Nie udało się wygenerować katalogu PRO",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("PRO Catalog Generator Error:", error);
        toast({
          title: "❌ Błąd",
          description: "Wystąpił nieoczekiwany błąd podczas generowania",
          variant: "destructive",
        });
      }
    });
  };

  if (false) {
    return (
      <Button
        variant="outline"
        size="lg"
        className="w-full border-2 border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 dark:bg-amber-950/20 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-950/40"
        disabled
      >
        <Crown className="mr-2 h-5 w-5" />
        Generuj Bazę PRO (~606) - Wymaga PRO
      </Button>
    );
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="default"
          size="lg"
          className="w-full bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:via-indigo-700 hover:to-blue-700 text-white font-bold shadow-lg"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Generowanie...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              ⚡ GENERUJ BAZĘ PRO (~606)
            </>
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-xl">
            <AlertTriangle className="h-6 w-6 text-purple-600" />
            Potwierdzenie generacji Bazy PRO
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="text-base space-y-4 pt-4">
              <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                <div className="font-semibold text-purple-900 dark:text-purple-100 mb-2">
                  📦 Co zostanie wygenerowane?
                </div>
                <ul className="text-sm text-purple-800 dark:text-purple-200 space-y-1 list-disc list-inside">
                  <li><strong>Baza Podstawowa:</strong> ~794 pozycje (materiały, osprzęt, kable)</li>
                  <li><strong>Rozszerzenie PRO:</strong> ~250 pozycji (PPOŻ, SSWiN, KD, infrastruktura)</li>
                  <li><strong>Total:</strong> ~606 unikalnych pozycji katalogowych</li>
                </ul>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  ✨ Zawartość bazy:
                </div>
                <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                  <li>Kable energetyczne (YKY, YAKXS, YDY) do 240mm²</li>
                  <li>Osprzęt instalacyjny (Gniazda, Włączniki, Puszki)</li>
                  <li>Rozdzielnice i aparatura (MCB, MCCB, Styczniki)</li>
                  <li>Systemy bezpieczeństwa (Monitoring, Kontrola dostępu)</li>
                  <li>Smart Home i automatyka</li>
                  <li>Infrastruktura ICT (Fiber, UTP, Rack)</li>
                  <li>Demontaże i roboty dodatkowe</li>
                </ul>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                  ⚠️ Uwaga:
                </div>
                <ul className="text-sm text-amber-800 dark:text-amber-200 space-y-1 list-disc list-inside">
                  <li>Operacja może potrwać 20-30 sekund</li>
                  <li>Istniejące pozycje zostaną pominięte (bez duplikatów)</li>
                  <li>Proces składa się z 2 etapów (Standard + Matrix)</li>
                </ul>
              </div>

              <div className="text-center text-sm font-medium text-slate-700 dark:text-slate-300">
                Czy na pewno chcesz wygenerować pełną bazę PRO?
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>
            Anuluj
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleGenerate}
            disabled={isPending}
            className="bg-blue-600 text-white hover:bg-blue-700 shadow-sm border-transparent"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generowanie...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Tak, generuj Bazę PRO
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
