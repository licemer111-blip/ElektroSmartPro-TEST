"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EstimateTable } from "@/components/project/estimate-table";
import { ProjectMaterialsList } from "@/components/project/project-materials-list";
import { ProjectDocumentsSection } from "@/components/project/project-documents-section";
import { ProjectSettings } from "@/components/project/project-settings";
import { RentownoscTab } from "@/components/project/rentownosc-tab";
import { ProjectPhotoGallery } from "@/components/project/project-photo-gallery";
import { AddUserAssemblyDialog } from "@/components/project/add-user-assembly-dialog";
import { QuickItemDialog } from "@/components/project/quick-item-dialog";
import { CatalogMobileTrigger } from "@/components/project/catalog-mobile-trigger";
import { ProjectControlPanel } from "@/components/project/project-control-panel";
import { PriceAlertBanner } from "@/components/project/price-alert-banner";
import { NormDivergenceBanner } from "@/components/project/_parts/NormDivergenceBanner";
import { ProjectPricingModeControl } from "@/components/project/_parts/ProjectPricingModeControl";
import {
  Eye,
  FileText, Package, BarChart3, Mic, Camera, Settings2, MapPin,
} from "lucide-react";
import { formatRegionCorrection, getRegionById } from "@/lib/config/regions";
import { useToast } from "@/hooks/use-toast";
import type { ProjectWithRelations, ProjectItem, Profile, CatalogCategory, CatalogItem } from "@/lib/types/database";
import type { ProjectTab } from "@/components/project/project-view-client";
import dynamic from "next/dynamic";
import React, { useCallback, useMemo, useRef } from "react";

const ProjectNotes = dynamic(
  () => import("@/components/project/project-notes").then((m) => ({ default: m.ProjectNotes })),
  { ssr: false }
);

// Static — defined outside component to avoid new array reference on every render
const TAB_CONFIG = [
  { id: "estimate", label: "Kosztorysy", shortLabel: "Koszt.", icon: FileText, lockedWhenFinal: false },
  { id: "materials", label: "Do wyceny", shortLabel: "Wycena", icon: Package, lockedWhenFinal: true },
  { id: "rentownosc", label: "Rentowność", shortLabel: "Rent.", icon: BarChart3, lockedWhenFinal: false },
  { id: "notes", label: "Notatki", shortLabel: "Notat.", icon: Mic, lockedWhenFinal: true },
  { id: "photos", label: "Zdjęcia", shortLabel: "Foto", icon: Camera, lockedWhenFinal: true },
  { id: "settings", label: "Ustawienia PDF", shortLabel: "PDF", icon: Settings2, lockedWhenFinal: true },
] as const;

interface Region {
  id: string;
  name: string;
  slug: string;
  price_modifier: number;
}

export interface ProjectTabContainerProps {
  activeTab: ProjectTab;
  project: ProjectWithRelations;
  items: ProjectItem[];
  profile: Profile | null;
  projectId: string;
  userId: string;
  isPro: boolean;
  currentAssemblyCount: number;
  categories: CatalogCategory[];
  catalogItemsByCategory: { categoryId: string; items: CatalogItem[] }[];
  regions: Region[];
  isReadOnly: boolean;
  isFinal: boolean;
  // pricing state
  liveHourlyRate: number;
  liveRegionId: string;
  isRegionPending: boolean;
  currentRegion: Region | null | undefined;
  useCustomRates: boolean;
  handleRegionChange: (id: string) => void;
  // view state
  colorMode: boolean;
  setColorMode: (v: boolean) => void;
  compactView: boolean;
  setCompactView: (v: boolean) => void;
  summaryCollapsed: boolean;
  toggleSummary: () => void;
  onSelectedIdsChange: (ids: Set<string>) => void;
  handleTabChange: (tab: ProjectTab) => void;
  // doc settings (Pult 5-w-1)
  liveShowKnr: boolean;
  liveBruttoMode: boolean;
  liveShowLaborHours: boolean;
  liveExpertColoring: boolean;
  /** Zestaw Engine v2 (2026-05-04): per-project toggle, drives EstimateTable + auto-expand gating. */
  liveAutoDetectZestawy: boolean;
  onBruttoModeChange: (v: boolean) => void;
  onLaborHoursChange: (v: boolean) => void;
  onKnrChange: (v: boolean) => void;
  onAutoDetectZestawyChange: (v: boolean) => void;
  liveVatRate: number;
  onVatRateChange: (v: number) => void;
}

export function ProjectTabContainer({
  activeTab, project, items, profile,
  projectId, userId, isPro, currentAssemblyCount,
  categories, catalogItemsByCategory, regions,
  isReadOnly, isFinal,
  liveHourlyRate, liveRegionId,
  isRegionPending, currentRegion, useCustomRates, handleRegionChange,
  colorMode, setColorMode, compactView, setCompactView,
  summaryCollapsed, toggleSummary, onSelectedIdsChange, handleTabChange,
  liveShowKnr, liveBruttoMode, liveShowLaborHours, liveExpertColoring, liveAutoDetectZestawy,
  onBruttoModeChange, onLaborHoursChange, onKnrChange, onAutoDetectZestawyChange,
  liveVatRate, onVatRateChange,
}: ProjectTabContainerProps) {
  const { toast } = useToast();

  // ─── Stable refs to break inline-callback identity churn ──────────────────────
  const compactViewRef = useRef(compactView);
  const colorModeRef = useRef(colorMode);
  compactViewRef.current = compactView;
  colorModeRef.current = colorMode;

  const handleToggleCompact = useCallback(() => setCompactView(!compactViewRef.current), [setCompactView]);
  const handleToggleColor = useCallback(() => setColorMode(!colorModeRef.current), [setColorMode]);

  const pricingModeControl = useMemo(() => (
    <ProjectPricingModeControl
      liveRegionId={liveRegionId}
      isRegionPending={isRegionPending}
      isFinal={isFinal}
      isReadOnly={isReadOnly}
      useCustomRates={useCustomRates}
      regions={regions}
      onRegionChange={handleRegionChange}
    />
  ), [liveRegionId, isRegionPending, isFinal, isReadOnly, useCustomRates, regions, handleRegionChange]);

  const tabNav = useMemo(() => (
    <div className="flex flex-col gap-1.5 min-w-0 w-full">
      {pricingModeControl}
      <div className="flex items-center gap-0.5 sm:gap-1 p-0.5 sm:p-1 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900/50 overflow-x-auto flex-nowrap">
        {TAB_CONFIG.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (isFinal && tab.lockedWhenFinal) {
                  toast({ title: "🔒 Projekt zablokowany", description: "Odblokuj projekt, aby przejść do tej zakładki", variant: "destructive" });
                  return;
                }
                handleTabChange(tab.id as ProjectTab);
              }}
              className={`inline-flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-3.5 py-1.5 sm:py-2 rounded-lg font-medium transition-all text-[11px] sm:text-sm flex-shrink-0 ${
                isFinal && tab.lockedWhenFinal
                  ? "opacity-40 cursor-not-allowed text-blue-600/50 dark:text-blue-400/50"
                  : isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-blue-600/70 dark:text-blue-400/70 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-100/60 dark:hover:bg-blue-900/40"
              }`}
            >
              <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" />
              <span className="sm:hidden">{tab.shortLabel}</span>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  ), [pricingModeControl, activeTab, isFinal, toast, handleTabChange]);

  // ─── Memoized JSX slots passed to EstimateTable ──────────────────────────────────────────
  const regionSlug = currentRegion?.id ?? null;
  const localRegion = getRegionById(regionSlug ?? undefined);
  const regionMult = localRegion?.multiplier ?? currentRegion?.price_modifier ?? 1.0;
  const filterBarExtra = useMemo(() => {
    if (!currentRegion || regionMult === 1.0) return null;
    const pct = Math.round((regionMult - 1) * 100);
    const sign = pct >= 0 ? "+" : "";
    const isExpensive = regionMult >= 1.05;
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold ${
          isExpensive
            ? "bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-950/20 dark:border-orange-800 dark:text-orange-400"
            : "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-400"
        }`}
        title={`Korekta regionalna: ${formatRegionCorrection(regionSlug)}`}
      >
        <MapPin className="w-3 h-3 flex-shrink-0" />
        <span>{currentRegion.name}</span>
        <span className="font-mono">{sign}{pct}%</span>
      </div>
    );
  }, [currentRegion, regionMult, regionSlug]);

  const toolbarExtra = useMemo(() => (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 w-full">
      {!isReadOnly && (
        <>
          <div className="grid grid-cols-3 gap-1.5 w-full lg:hidden">
            <CatalogMobileTrigger
              projectId={projectId}
              categories={categories}
              catalogItemsByCategory={catalogItemsByCategory}
              isPro={isPro}
              projectStatus={project.status}
              className="bg-blue-600 text-white hover:bg-blue-700 shadow-sm border-transparent h-8 text-xs w-full justify-center"
            />
            <QuickItemDialog
              projectId={projectId}
              projectStatus={project.status}
              className="w-full justify-center"
            />
            <AddUserAssemblyDialog
              projectId={projectId}
              isPro={isPro}
              currentAssemblyCount={currentAssemblyCount}
              projectStatus={project.status}
              className="w-full justify-center"
              showOnboardingPulse={false}
            />
          </div>
          <div className="hidden lg:flex flex-col gap-1 w-[148px] flex-shrink-0 ml-auto">
            <AddUserAssemblyDialog
              projectId={projectId}
              isPro={isPro}
              currentAssemblyCount={currentAssemblyCount}
              projectStatus={project.status}
              className="w-full justify-center"
              showOnboardingPulse={false}
            />
            <QuickItemDialog
              projectId={projectId}
              projectStatus={project.status}
              className="w-full justify-center"
            />
          </div>
        </>
      )}
    </div>
  ), [isReadOnly, projectId, categories, catalogItemsByCategory, isPro, project.status, currentAssemblyCount,
      items.length, compactView, colorMode, handleToggleCompact, handleToggleColor]);

  return (
    <>
      {/* Read-only banner */}
      {isReadOnly && (
        <div className="mb-3 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-sm font-medium select-none">
          <Eye className="w-4 h-4 flex-shrink-0" />
          <span>Tryb podglądu — masz dostęp tylko do odczytu. Edycja, dodawanie i usuwanie pozycji są zablokowane.</span>
        </div>
      )}

      {/* KONFIGURACJA — always visible on all tabs */}
      <PriceAlertBanner
        projectId={project.id}
        projectUpdatedAt={project.updated_at ?? project.created_at}
        isFinal={project.status === "final"}
        isReadOnly={isReadOnly}
      />
      <ProjectControlPanel
        projectId={project.id}
        vatRate={liveVatRate}
        showKnr={liveShowKnr}
        bruttoMode={liveBruttoMode}
        expertColoring={liveExpertColoring}
        showLaborHours={liveShowLaborHours}
        autoDetectZestawy={liveAutoDetectZestawy}
        isFinal={isFinal}
        isReadOnly={isReadOnly}
        onColorModeChange={setColorMode}
        onBruttoModeChange={onBruttoModeChange}
        onLaborHoursChange={onLaborHoursChange}
        onKnrChange={onKnrChange}
        onVatRateChange={onVatRateChange}
        onAutoDetectZestawyChange={onAutoDetectZestawyChange}
      />

      {/* ESTIMATE TAB */}
      {activeTab === "estimate" && (
        <div className="space-y-3">
          <NormDivergenceBanner items={items} />
          <Card className="p-3 sm:p-4 md:p-6 bg-white dark:bg-slate-900 shadow-lg md:shadow-md rounded-xl">
            <EstimateTable
              projectId={project.id}
              items={items}
              materialsOwnedByCustomer={project.materials_owned_by_customer}
              isPro={profile?.is_pro || false}
              colorMode={colorMode}
              onColorModeChange={setColorMode}
              adjustmentPercentage={project.adjustment_percentage || 0}
              projectStatus={project.status}
              showLaborHoursInPdf={liveShowLaborHours}
              showKnrInPdf={liveShowKnr}
              bruttoMode={liveBruttoMode}
              vatRate={project.vat_rate}
              isReadOnly={isReadOnly}
              onSelectedIdsChange={onSelectedIdsChange}
              regionModifier={currentRegion?.price_modifier ?? 1.0}
              regionName={currentRegion?.name}
              compactViewControlled={compactView}
              onCompactViewChange={setCompactView}
              filterBarExtra={filterBarExtra}
              toolbarExtra={toolbarExtra}
              tabsSection={tabNav}
              useCustomRates={useCustomRates}
              rateIsSet={liveHourlyRate > 0}
              objectTypeSlug={project.object_types?.slug ?? null}
              projectLaborRate={liveHourlyRate}
              matMarkupMult={1 + (project.mat_markup_pct || 0) / 100}
              labMarkupMult={1 + (project.lab_markup_pct || 0) / 100}
              complexityFactor={project.complexity_factor || 1.0}
              autoDetectZestawy={liveAutoDetectZestawy}
            />
          </Card>
        </div>
      )}

      {activeTab === "materials" && (
        <Card className="h-full p-4 md:p-6 bg-white dark:bg-slate-900 shadow-lg md:shadow-md rounded-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">{tabNav}</div>
          <div className="space-y-6">
            <ProjectDocumentsSection projectId={projectId} />
            <ProjectMaterialsList
              items={items}
              isPro={isPro}
              materialsOwnedByCustomer={project.materials_owned_by_customer}
            />
          </div>
        </Card>
      )}

      {activeTab === "notes" && (
        <Card className="h-full p-4 md:p-6 bg-white dark:bg-slate-900 shadow-lg md:shadow-md rounded-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">{tabNav}</div>
          <ProjectNotes projectId={projectId} initialNotes={project.notes} />
        </Card>
      )}

      {activeTab === "photos" && (
        <Card className="h-full p-4 md:p-6 bg-white dark:bg-slate-900 shadow-lg md:shadow-md rounded-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">{tabNav}</div>
          <ProjectPhotoGallery projectId={projectId} />
        </Card>
      )}

      {activeTab === "rentownosc" && (
        <Card className="h-full p-4 md:p-6 bg-white dark:bg-slate-900 shadow-lg md:shadow-md rounded-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">{tabNav}</div>
          <RentownoscTab projectId={projectId} isPro={isPro} />
        </Card>
      )}

      {activeTab === "settings" && (
        <Card className="h-full p-4 md:p-6 bg-white dark:bg-slate-900 shadow-lg md:shadow-md rounded-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">{tabNav}</div>
          <ProjectSettings project={project} isPro={isPro} />
        </Card>
      )}
    </>
  );
}
