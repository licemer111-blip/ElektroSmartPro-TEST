"use client";

import { useState, useCallback, useTransition, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import type { ProjectWithRelations, Profile } from "@/lib/types/database";
import { updateProjectRegion } from "@/app/dashboard/projects/[id]/actions";
import { updateUserRegion } from "@/app/dashboard/settings/region-actions";
import { createClient } from "@/utils/supabase/client";
import { notifyDataChanged } from "@/hooks/use-synced-action";
import { useToast } from "@/hooks/use-toast";

interface Region {
  id: string;
  name: string;
  slug: string;
  price_modifier: number;
}

interface UseProjectPricingOptions {
  project: ProjectWithRelations;
  profile: Profile | null;
  regions: Region[];
  isReadOnly?: boolean;
}

export interface UseProjectPricingResult {
  liveHourlyRate: number;
  liveRegionId: string;
  setLiveRegionId: (id: string) => void;
  isRegionPending: boolean;
  currentRegion: Region | null | undefined;
  useCustomRates: boolean;
  handleRegionChange: (regionId: string) => void;
}

export function useProjectPricing({ project, profile, regions, isReadOnly = false }: UseProjectPricingOptions) {
  const { toast } = useToast();
  const router = useRouter();

  const [useCustomRates, setUseCustomRates] = useState<boolean>(
    profile?.use_custom_rates ?? false
  );

  const [liveHourlyRate, setLiveHourlyRate] = useState<number>(
    project.default_hourly_rate ?? 0
  );

  const [liveRegionId, setLiveRegionId] = useState<string>(project.region_id ?? "");
  const liveRegionIdRef = useRef(liveRegionId);
  const [isRegionPending, startRegionTransition] = useTransition();

  liveRegionIdRef.current = liveRegionId;

  // On mount: if Settings changed region while this page was unmounted, bust router cache
  useEffect(() => {
    try {
      const pendingUuid = localStorage.getItem("es-pending-region-uuid");
      if (pendingUuid && pendingUuid !== project.region_id) {
        localStorage.removeItem("es-pending-region-uuid");
        localStorage.removeItem("es-pending-region-slug");
        router.refresh();
      } else if (pendingUuid) {
        localStorage.removeItem("es-pending-region-uuid");
        localStorage.removeItem("es-pending-region-slug");
      }
    } catch { /* localStorage unavailable */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync liveRegionId when project.region_id changes (e.g. after router.refresh() or KNR Settings change)
  useEffect(() => {
    const incoming = project.region_id ?? "";
    if (incoming !== liveRegionIdRef.current) {
      setLiveRegionId(incoming);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.region_id]);

  const currentRegion = regions.find(r => r.id === liveRegionId);

  const handleRegionChange = useCallback((regionUuid: string) => {
    if (isReadOnly) return;
    setLiveRegionId(regionUuid);
    startRegionTransition(async () => {
      const regionSlug = regions.find(r => r.id === regionUuid)?.slug ?? "";
      const [projectResult] = await Promise.all([
        updateProjectRegion(project.id, regionUuid),
        updateUserRegion(regionUuid), // empty string = Brak korekty, handled by updateUserRegion
      ]);
      if (projectResult?.error) {
        toast({ title: "Błąd", description: projectResult.error, variant: "destructive" });
        setLiveRegionId(project.region_id ?? "");
      } else {
        notifyDataChanged("region-changed");
        const detail = { regionUuid, regionSlug, source: "kreator" };
        window.dispatchEvent(new CustomEvent("region-changed-global", { detail }));
        // Cross-tab sync: notify KNR Settings open in another tab
        try {
          const bc = new BroadcastChannel("es-region-sync");
          bc.postMessage(detail);
          bc.close();
        } catch { /* BroadcastChannel unavailable */ }
      }
    });
  }, [isReadOnly, project.id, project.region_id, regions, toast]);

  // Cross-tab sync: when region changes in Centrum Kalkulacji, update Kreator live + persist to project
  useEffect(() => {
    const handler = (e: Event) => {
      const { regionUuid, regionSlug, source } = (e as CustomEvent<{ regionUuid?: string; regionSlug?: string; source?: string }>).detail;
      // Ignore events originating from this hook to avoid feedback loops
      if (source === "kreator") return;
      // KNR Settings sends slug — resolve to UUID via regions array
      let resolvedUuid = regionUuid ?? "";
      if (!resolvedUuid && regionSlug) {
        resolvedUuid = regions.find(r => r.slug === regionSlug)?.id ?? "";
      }
      // Use ref to always read current value — avoids stale closure bug
      if (resolvedUuid === liveRegionIdRef.current) return;
      setLiveRegionId(resolvedUuid);
      // Persist region to the project so it's consistent after page reload
      if (!isReadOnly) {
        updateProjectRegion(project.id, resolvedUuid).catch(() => {
          // Non-critical — UI already updated, silently ignore
        });
      }
    };
    window.addEventListener("region-changed-global", handler);

    // Cross-tab sync via BroadcastChannel (KNR settings in another tab)
    let bc: BroadcastChannel | null = null;
    try {
      bc = new BroadcastChannel("es-region-sync");
      bc.onmessage = (e: MessageEvent<{ regionUuid?: string; regionSlug?: string; source?: string }>) => {
        const { regionUuid, regionSlug, source } = e.data;
        if (source === "kreator") return;
        let resolvedUuid = regionUuid ?? "";
        if (!resolvedUuid && regionSlug) {
          resolvedUuid = regions.find(r => r.slug === regionSlug)?.id ?? "";
        }
        if (resolvedUuid === liveRegionIdRef.current) return;
        setLiveRegionId(resolvedUuid);
        // Also fire same-tab event so other components on this page update too
        window.dispatchEvent(
          new CustomEvent("region-changed-global", {
            detail: { regionUuid: resolvedUuid, regionSlug: regionSlug ?? "", source: "knr" },
          })
        );
        if (!isReadOnly) {
          updateProjectRegion(project.id, resolvedUuid).catch(() => {});
        }
      };
    } catch {
      // BroadcastChannel not supported — same-tab only
    }

    return () => {
      window.removeEventListener("region-changed-global", handler);
      bc?.close();
    };
  // Stable deps only — liveRegionId read via ref to avoid re-registering on every change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReadOnly, project.id, regions]);

  // Cross-tab sync: when Tryb Własny toggled in Centrum Kalkulacji, update Kreator badge instantly
  useEffect(() => {
    const handler = (e: Event) => {
      const { useCustomRates: newVal } = (e as CustomEvent<{ useCustomRates: boolean }>).detail;
      setUseCustomRates(newVal);
    };
    window.addEventListener("custom-mode-changed", handler);
    return () => window.removeEventListener("custom-mode-changed", handler);
  }, []);

  // Realtime: subscribe to project row changes (rate_source, default_hourly_rate)
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`project-live-${project.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "projects", filter: `id=eq.${project.id}` },
        (payload) => {
          const updated = payload.new as { default_hourly_rate?: number; region_id?: string };
          if (typeof updated.default_hourly_rate === "number") {
            setLiveHourlyRate(updated.default_hourly_rate);
          }
          if ("region_id" in updated && (updated.region_id ?? "") !== liveRegionIdRef.current) {
            setLiveRegionId(updated.region_id ?? "");
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id]);

  return {
    liveHourlyRate,
    liveRegionId,
    setLiveRegionId,
    isRegionPending,
    currentRegion,
    useCustomRates,
    handleRegionChange,
  };
}
