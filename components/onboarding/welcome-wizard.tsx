"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Zap, Loader2, Building2, AlertCircle } from "lucide-react";
import { saveOnboardingProfile } from "@/app/dashboard/onboarding/actions";

const STORAGE_KEY = "es_onboarding_done";

interface WelcomeWizardProps {
  userId: string;
  hasCompanyName: boolean;
}

export function WelcomeWizard({ userId, hasCompanyName }: WelcomeWizardProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [companyName, setCompanyName] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const done = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
      if (!done && !hasCompanyName) {
        const t = setTimeout(() => setOpen(true), 800);
        return () => clearTimeout(t);
      }
    } catch {
      // ignore
    }
  }, [userId, hasCompanyName]);

  const markDone = () => {
    try {
      localStorage.setItem(`${STORAGE_KEY}_${userId}`, "true");
    } catch {
      // ignore
    }
  };

  const handleSave = () => {
    if (!companyName.trim()) return;
    setSaveError(null);
    startTransition(async () => {
      const result = await saveOnboardingProfile({ companyName: companyName.trim() });
      if (result.error) {
        setSaveError(result.error);
        return;
      }
      markDone();
      setOpen(false);
      router.refresh();
    });
  };

  const handleSkip = () => {
    markDone();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleSkip(); }}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden w-[calc(100vw-1.5rem)]">
        <DialogTitle className="sr-only">Witaj w ElektroSmart PRO</DialogTitle>
        <DialogDescription className="sr-only">Konfiguracja konta ElektroSmart PRO.</DialogDescription>

        {/* Accent bar */}
        <div className="h-1 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-t-lg" />

        <div className="px-5 py-6 space-y-5">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Witaj w ElektroSmart PRO! 👋
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Podaj nazwę firmy, aby pojawiała się na kosztorysach i PDF-ach.
            </p>
          </div>

          {/* Input */}
          <div className="space-y-1.5">
            <Label htmlFor="onb-company" className="text-sm font-medium">
              Nazwa firmy lub imię i nazwisko
            </Label>
            <Input
              id="onb-company"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="np. Elektro Nowak lub Jan Kowalski"
              className="h-11"
              autoFocus
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
            />
          </div>

          {saveError && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 dark:text-red-400">{saveError}</p>
            </div>
          )}

          {/* Info hint */}
          <div className="flex items-start gap-2.5 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900">
            <Zap className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Stawkę roboczą i region ustaw później w <strong>Ustawienia → KNR</strong>.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-1">
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="flex-1 h-10 text-slate-500"
              disabled={isPending}
            >
              Pomiń
            </Button>
            <Button
              onClick={handleSave}
              disabled={!companyName.trim() || isPending}
              className="flex-1 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white gap-2"
            >
              {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              Zapisz i zacznij
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
