"use client";

import React, { useEffect, useState } from "react";
import { PanelAiDialog } from "@/components/project/panel-ai-dialog";
import { PanelLoadConfigDialog } from "@/components/project/panel-load-config-dialog";
import { PanelClearConfirmDialog } from "@/components/project/panel-clear-confirm-dialog";
import { PanelViewerIndicator } from "@/components/project/panel-viewer-indicator";
import type { PanelState } from "@/components/project/rozdzielnica/usePanelReducer";
import type { PanelSection, PanelTemplate } from "@/components/project/panel-configurator-types";
import { Loader2, CheckCircle2, Zap, BookOpen, Calculator, Hammer, FileCheck } from "lucide-react";

// ─── AI Pricing Progress Dialog ──────────────────────────────────────────────

const PRICING_STEPS = [
  { icon: Zap,        label: "Łączenie z ES-Engine",           delay: 0 },
  { icon: BookOpen,   label: "Analiza urządzeń DIN (KNR 5-08)", delay: 1200 },
  { icon: Calculator, label: "Kalkulacja cen materiałów",       delay: 2800 },
  { icon: Hammer,     label: "Obliczanie robocizny (rbh)",      delay: 4200 },
  { icon: FileCheck,  label: "Finalizowanie wyceny...",          delay: 5600 },
] as const;

function AiPricingProgressDialog({ open }: { open: boolean }) {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (!open) { setVisibleCount(0); return; }
    setVisibleCount(1);
    const timers = PRICING_STEPS.slice(1).map((step, i) =>
      setTimeout(() => setVisibleCount(i + 2), step.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-8 w-full max-w-sm mx-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-slate-100 text-sm">ES-Engine Wycena</p>
            <p className="text-[11px] text-slate-400">Rozdzielnica elektryczna · ES-KNR 2026</p>
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {PRICING_STEPS.map((step, i) => {
            const StepIcon = step.icon;
            const isVisible = i < visibleCount;
            const isActive = i === visibleCount - 1;
            const isDone = i < visibleCount - 1;
            return (
              <div
                key={i}
                className={`flex items-center gap-3 transition-all duration-500 ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                }`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 transition-colors duration-300 ${
                  isDone ? "bg-emerald-100 dark:bg-emerald-900/30"
                  : isActive ? "bg-blue-100 dark:bg-blue-900/30"
                  : "bg-slate-100 dark:bg-slate-800"
                }`}>
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : isActive ? (
                    <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                  ) : (
                    <StepIcon className="w-3.5 h-3.5 text-slate-400" />
                  )}
                </div>
                <span className={`text-sm transition-colors duration-300 ${
                  isDone ? "text-emerald-600 dark:text-emerald-400 line-through opacity-60"
                  : isActive ? "text-slate-900 dark:text-slate-100 font-medium"
                  : "text-slate-400"
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Footer note */}
        <p className="text-[10px] text-slate-400 mt-6 text-center">
          Normy KNR 5-08 · Producent · Współczynnik regionalny
        </p>
      </div>
    </div>
  );
}

interface OnlineUser { userId: string; name: string; }

export interface ConfiguratorModalsProps {
  ps: PanelState;
  // callbacks
  setShowAiPanel: (v: boolean) => void;
  setAiDescription: (v: string) => void;
  handleAiGenerate: () => void;
  setShowLoadDialog: (v: boolean) => void;
  handleLoadConfig: (id: string) => Promise<void>;
  handleDeleteConfig: (id: string) => Promise<void>;
  applyTemplate: (t: PanelTemplate) => void;
  setShowClearConfirm: (v: boolean) => void;
  allModulesCount: number;
  allAccessoriesCount: number;
  setSections: React.Dispatch<React.SetStateAction<PanelSection[]>>;
  setSelectedUid: (uid: string | null) => void;
  toast: ReturnType<typeof import("@/hooks/use-toast").useToast>["toast"];
  // viewer state
  isReadOnly: boolean;
  isViewerMode: boolean;
  leaderName: string | null;
  syncOnlineUsers: OnlineUser[];
  stopFollowing: () => void;
  startFollowing: (userId: string) => void;
}

export function ConfiguratorModals({
  ps,
  setShowAiPanel, setAiDescription, handleAiGenerate,
  setShowLoadDialog, handleLoadConfig, handleDeleteConfig, applyTemplate,
  setShowClearConfirm, allModulesCount, allAccessoriesCount,
  setSections, setSelectedUid, toast,
  isReadOnly, isViewerMode, leaderName, syncOnlineUsers, stopFollowing, startFollowing,
}: ConfiguratorModalsProps) {
  return (
    <>
      <PanelAiDialog
        open={ps.showAiPanel}
        onOpenChange={setShowAiPanel}
        aiDescription={ps.aiDescription}
        setAiDescription={setAiDescription}
        aiGenerating={ps.aiGenerating}
        handleAiGenerate={handleAiGenerate}
      />

      <PanelLoadConfigDialog
        open={ps.showLoadDialog}
        onOpenChange={setShowLoadDialog}
        savedConfigs={ps.savedConfigs}
        handleLoadConfig={handleLoadConfig}
        handleDeleteConfig={handleDeleteConfig}
        applyTemplate={applyTemplate}
      />

      <PanelClearConfirmDialog
        open={ps.showClearConfirm}
        onOpenChange={setShowClearConfirm}
        allModulesCount={allModulesCount}
        allAccessoriesCount={allAccessoriesCount}
        setSections={setSections}
        setSelectedUid={setSelectedUid}
        toast={toast}
      />

      <PanelViewerIndicator
        isReadOnly={isReadOnly}
        isViewerMode={isViewerMode}
        leaderName={leaderName}
        syncOnlineUsers={syncOnlineUsers}
        stopFollowing={stopFollowing}
        startFollowing={startFollowing}
      />

      <AiPricingProgressDialog open={ps.isWycenLoading} />
    </>
  );
}
