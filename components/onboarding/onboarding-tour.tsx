"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, X } from "lucide-react";
import { TOUR_STEPS } from "./tour-steps";
import { createClient } from "@/utils/supabase/client";
import { cn } from "@/lib/utils";

interface OnboardingTourProps {
  onboardingCompleted?: boolean;
}

const COLOR_CLASSES = {
  indigo: {
    gradient: "from-indigo-500 to-blue-600",
    dot: "bg-indigo-500",
    btn: "bg-indigo-600 hover:bg-indigo-700 text-white",
    ring: "ring-indigo-400/70",
    spotlight: "rgba(99,102,241,0.25)",
  },
  orange: {
    gradient: "from-orange-500 to-amber-500",
    dot: "bg-orange-500",
    btn: "bg-orange-600 hover:bg-orange-700 text-white",
    ring: "ring-orange-400/70",
    spotlight: "rgba(249,115,22,0.25)",
  },
  blue: {
    gradient: "from-blue-500 to-indigo-500",
    dot: "bg-blue-500",
    btn: "bg-blue-600 hover:bg-blue-700 text-white",
    ring: "ring-blue-400/70",
    spotlight: "rgba(59,130,246,0.25)",
  },
  amber: {
    gradient: "from-amber-500 to-orange-500",
    dot: "bg-amber-500",
    btn: "bg-amber-600 hover:bg-amber-700 text-white",
    ring: "ring-amber-400/70",
    spotlight: "rgba(245,158,11,0.25)",
  },
  green: {
    gradient: "from-green-500 to-emerald-500",
    dot: "bg-green-500",
    btn: "bg-green-600 hover:bg-green-700 text-white",
    ring: "ring-green-400/70",
    spotlight: "rgba(34,197,94,0.25)",
  },
  violet: {
    gradient: "from-violet-500 to-purple-600",
    dot: "bg-violet-500",
    btn: "bg-violet-600 hover:bg-violet-700 text-white",
    ring: "ring-violet-400/70",
    spotlight: "rgba(139,92,246,0.25)",
  },
  rose: {
    gradient: "from-rose-500 to-pink-600",
    dot: "bg-rose-500",
    btn: "bg-rose-600 hover:bg-rose-700 text-white",
    ring: "ring-rose-400/70",
    spotlight: "rgba(244,63,94,0.25)",
  },
  teal: {
    gradient: "from-teal-500 to-cyan-600",
    dot: "bg-teal-500",
    btn: "bg-teal-600 hover:bg-teal-700 text-white",
    ring: "ring-teal-400/70",
    spotlight: "rgba(20,184,166,0.25)",
  },
} as const;

export function OnboardingTour({ onboardingCompleted }: OnboardingTourProps) {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (onboardingCompleted) return;
    if (typeof window !== "undefined" && sessionStorage.getItem("onboarding_dismissed")) return;
    const timer = setTimeout(() => setActive(true), 1800);
    return () => clearTimeout(timer);
  }, [onboardingCompleted]);

  useEffect(() => {
    if (!active) return;
    const currentStep = TOUR_STEPS[step];
    if (!currentStep?.targetSelector) {
      setTargetRect(null);
      return;
    }
    const el = document.querySelector(currentStep.targetSelector);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    } else {
      setTargetRect(null);
    }
  }, [step, active]);

  const dismiss = useCallback(async () => {
    setActive(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("onboarding_dismissed", "1");
    }
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("profiles").update({ onboarding_completed: true }).eq("id", user.id);
      }
    } catch {
      // ignore
    }
  }, []);

  const nextStep = () => {
    if (step < TOUR_STEPS.length - 1) setStep(step + 1);
    else dismiss();
  };

  const prevStep = () => { if (step > 0) setStep(step - 1); };

  if (!active) return null;

  const currentStep = TOUR_STEPS[step];
  const colors = COLOR_CLASSES[currentStep.color];
  const isCenter = !targetRect || currentStep.position === "center";
  const isLastStep = step === TOUR_STEPS.length - 1;

  // Tooltip position
  let tooltipStyle: React.CSSProperties = {};
  if (targetRect && !isCenter) {
    const W = 320;
    const pad = 14;
    const vW = typeof window !== "undefined" ? window.innerWidth : 1200;
    const vH = typeof window !== "undefined" ? window.innerHeight : 800;
    let left = targetRect.left + targetRect.width / 2 - W / 2;
    left = Math.max(12, Math.min(left, vW - W - 12));
    switch (currentStep.position) {
      case "bottom":
        tooltipStyle = { position: "fixed", top: Math.min(targetRect.bottom + pad, vH - 280), left };
        break;
      case "top":
        tooltipStyle = { position: "fixed", bottom: vH - targetRect.top + pad, left };
        break;
      case "right":
        tooltipStyle = { position: "fixed", top: targetRect.top, left: Math.min(targetRect.right + pad, vW - W - 12) };
        break;
      case "left":
        tooltipStyle = { position: "fixed", top: targetRect.top, right: vW - targetRect.left + pad };
        break;
    }
  }

  return (
    <>
      {/* Overlay layer */}
      <div className="fixed inset-0 z-[9998] pointer-events-none">
        {/* Full backdrop for center steps */}
        {isCenter && (
          <div className="absolute inset-0 bg-black/60 pointer-events-auto" onClick={dismiss} />
        )}
        {/* Spotlight for targeted steps */}
        {targetRect && !isCenter && (
          <>
            <div className="absolute inset-0 pointer-events-auto" onClick={dismiss} />
            <div
              className={cn("absolute rounded-xl ring-2 pointer-events-none", colors.ring)}
              style={{
                position: "fixed",
                top: targetRect.top - 6,
                left: targetRect.left - 6,
                width: targetRect.width + 12,
                height: targetRect.height + 12,
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
                zIndex: 9999,
              }}
            />
          </>
        )}
      </div>

      {/* Tooltip card */}
      <div
        className={cn(
          "fixed z-[10000] w-[320px] max-w-[calc(100vw-24px)]",
          "rounded-2xl bg-white dark:bg-slate-900 shadow-2xl",
          "border border-slate-200 dark:border-slate-700",
          "animate-in fade-in slide-in-from-bottom-3 duration-300",
          isCenter && "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        )}
        style={!isCenter ? tooltipStyle : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Colored gradient accent bar */}
        <div className={cn("h-1.5 rounded-t-2xl bg-gradient-to-r", colors.gradient)} />

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-3 pb-0">
          <div className="flex items-center gap-2">
            <span className="text-lg leading-none">{currentStep.emoji}</span>
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
              Krok {step + 1} z {TOUR_STEPS.length}
            </span>
          </div>
          <button
            onClick={dismiss}
            className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            aria-label="Zamknij przewodnik"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 pt-2 pb-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1.5 leading-snug">
            {currentStep.title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed whitespace-pre-line">
            {currentStep.description}
          </p>
          {currentStep.ctaLabel && currentStep.ctaHref && (
            <Link href={currentStep.ctaHref} onClick={dismiss} className="block mt-3">
              <span className={cn(
                "flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-lg text-xs font-semibold transition-colors",
                colors.btn
              )}>
                {currentStep.ctaLabel}
                <ChevronRight className="w-3 h-3" />
              </span>
            </Link>
          )}
        </div>

        {/* Footer: dots + navigation */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 dark:border-slate-800">
          {/* Step dots */}
          <div className="flex items-center gap-1">
            {TOUR_STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-200",
                  i === step
                    ? cn("w-4", colors.dot)
                    : "w-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600"
                )}
                aria-label={`Krok ${i + 1}`}
              />
            ))}
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={dismiss}
              className="h-7 px-2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              Pomiń
            </button>
            {step > 0 && (
              <Button variant="outline" size="sm" onClick={prevStep} className="h-7 w-7 p-0">
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
            )}
            <button
              onClick={nextStep}
              className={cn("h-7 px-3 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors", colors.btn)}
            >
              {isLastStep ? "Gotowe ✓" : "Dalej"}
              {!isLastStep && <ChevronRight className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
