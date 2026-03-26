"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Zap, Sparkles, CheckCircle2 } from "lucide-react";
import { useEstimateWizard } from "./wizard-steps/useEstimateWizard";
import { StepObjectType } from "./wizard-steps/StepObjectType";
import { StepDetails } from "./wizard-steps/StepDetails";
import { StepReview } from "./wizard-steps/StepReview";

interface QuickEstimateWizardProps {
  regions: { id: string; name: string }[];
  objectTypes: { id: string; name: string; default_vat_rate: number }[];
  isPro?: boolean;
}

export function QuickEstimateWizard({ regions, objectTypes, isPro = false }: QuickEstimateWizardProps) {
  const { state, actions, meta } = useEstimateWizard({ regions, objectTypes, isPro });
  const { step, selectedType, area, areaInput, rooms, roomsInput, defaultsApplied,
    projectName, regionId, standard, items, creating, generating, aiUsed, aiLimit,
    viewMode, zakres, conditionalFields, openAccordion, manualVatRate, vatRate, totals } = state;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Info banner */}
      <div className="rounded-xl border border-orange-200 dark:border-orange-900/50 bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50 dark:from-orange-950/30 dark:via-amber-950/20 dark:to-yellow-950/10 p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-500/20">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-orange-800 dark:text-orange-300">Szybka Wycena — ElektroSmart Core</h3>
            <p className="text-xs text-orange-700/80 dark:text-orange-400/70 mt-0.5">
              Automatycznie generuj kosztorys na podstawie typu obiektu, powierzchni i standardu wykonania.
              Silnik inżynieryjny ElektroSmart Engine v2.1 dobiera pozycje i ilości z 6-poziomowej bazy ES-KNR 2026 — Ty możesz je dostosować przed utworzeniem projektu.
            </p>
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-orange-100 to-amber-100 dark:from-orange-900/30 dark:to-amber-900/30 text-orange-700 dark:text-orange-300 text-sm font-medium mb-3">
          <Zap className="w-4 h-4" />
          Szybka Wycena w 60 sekund
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Kreator Szybkiej Wyceny</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Wygeneruj kosztorys automatycznie na podstawie parametrów obiektu
        </p>
        {aiUsed !== null && (
          <Badge
            variant="outline"
            className={`mt-2 gap-1 text-[10px] border ${
              aiLimit !== null && aiUsed >= aiLimit
                ? "bg-red-50 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-700"
                : aiLimit !== null && aiUsed >= aiLimit - 2
                  ? "bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-700"
                  : "bg-orange-50 text-orange-700 border-orange-300 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-700"
            }`}
          >
            <Sparkles className="w-3 h-3" />
            Użyto: {aiUsed}/{aiLimit ?? (isPro ? 100 : 5)} prób AI
          </Badge>
        )}
      </div>

      {/* Progress steps */}
      <div className="flex items-center justify-center gap-1">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              s === step ? "bg-orange-500 text-white scale-110 shadow-lg shadow-orange-500/30" :
              s < step ? "bg-emerald-500 text-white" :
              "bg-slate-200 dark:bg-slate-700 text-slate-500"
            }`}>
              {s < step ? <CheckCircle2 className="w-4 h-4" /> : s}
            </div>
            {s < 3 && (
              <div className={`w-8 h-0.5 ${s < step ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-700"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <StepObjectType
          selectedType={selectedType}
          setSelectedType={actions.setSelectedType}
          setArea={actions.setArea}
          setAreaInput={actions.setAreaInput}
          setRooms={actions.setRooms}
          setRoomsInput={actions.setRoomsInput}
          setDefaultsApplied={actions.setDefaultsApplied}
          defaultsApplied={defaultsApplied}
          setStep={actions.setStep}
        />
      )}

      {/* Step 2 */}
      {step === 2 && (
        <StepDetails
          selectedType={selectedType}
          area={area}
          areaInput={areaInput}
          rooms={rooms}
          roomsInput={roomsInput}
          projectName={projectName}
          regionId={regionId}
          standard={standard}
          zakres={zakres}
          conditionalFields={conditionalFields}
          openAccordion={openAccordion}
          generating={generating}
          regions={regions}
          setArea={actions.setArea}
          setAreaInput={actions.setAreaInput}
          setRooms={actions.setRooms}
          setRoomsInput={actions.setRoomsInput}
          setProjectName={actions.setProjectName}
          setRegionId={actions.setRegionId}
          setStandard={actions.setStandard}
          setZakres={actions.setZakres}
          setConditionalFields={actions.setConditionalFields}
          setOpenAccordion={actions.setOpenAccordion}
          setStep={actions.setStep}
          handleGenerateItems={actions.handleGenerateItems}
        />
      )}

      {/* Step 3 */}
      {step === 3 && (
        <StepReview
          items={items}
          vatRate={vatRate}
          totals={totals}
          viewMode={viewMode}
          creating={creating}
          wasFallback={state.wasFallback}
          isPro={isPro}
          formatCurrency={actions.formatCurrency}
          setViewMode={actions.setViewMode}
          setManualVatRate={actions.setManualVatRate}
          setStep={actions.setStep}
          handleReset={actions.handleReset}
          handleCreate={actions.handleCreate}
          updateItemQuantity={actions.updateItemQuantity}
          removeItem={actions.removeItem}
        />
      )}
    </div>
  );
}
