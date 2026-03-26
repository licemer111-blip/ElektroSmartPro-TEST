/**
 * panel-state-store.ts — Global in-memory singleton for PanelConfigurator state.
 *
 * Survives tab switches because it lives outside React component lifecycle.
 * Shared between the toolbar modal and the /dashboard/panel-configurator page.
 *
 * Cross-tab sync: BroadcastChannel "panel-state-sync" propagates writes to all
 * open tabs. Incoming messages are applied silently (no re-broadcast) to avoid loops.
 */

import type { PanelSection } from "@/components/project/panel-configurator-types";
import type { Manufacturer } from "@/components/project/panel-configurator-types";

export interface PanelSnapshot {
  sections: PanelSection[];
  panelName: string;
  selectedManufacturerId: string;
  customCoefficient: number;
  currentConfigId: string | null;
  linkedItemId: string | null;
  updatedAt: number;
}

type Listener = () => void;

interface BroadcastMessage {
  projectId: string;
  snapshot: PanelSnapshot;
}

const DEFAULT_SNAPSHOT: Omit<PanelSnapshot, "updatedAt"> = {
  sections: [],
  panelName: "",
  selectedManufacturerId: "default",
  customCoefficient: 1.0,
  currentConfigId: null,
  linkedItemId: null,
};

const LAST_PROJECT_KEY = "es_panel_last_project_id";

/**
 * Strip React components (icon: forwardRef) from DinModule before BroadcastChannel.postMessage.
 * Structured clone algorithm cannot serialize Symbol(react.forward_ref) — DataCloneError.
 * Icon is a UI-only concern and not needed for cross-tab state sync.
 */
function serializeForBroadcast(snapshot: PanelSnapshot): PanelSnapshot {
  const stripIcon = <T extends { module: { icon: unknown } }>(rm: T) => ({
    ...rm,
    module: { ...rm.module, icon: undefined },
  });
  return {
    ...snapshot,
    sections: snapshot.sections.map(section => ({
      ...section,
      modules:     section.modules.map(stripIcon),
      accessories: section.accessories.map(stripIcon),
    })) as PanelSnapshot['sections'],
  };
}

class PanelStateStore {
  private store = new Map<string, PanelSnapshot>();
  private listeners = new Map<string, Set<Listener>>();
  private channel: BroadcastChannel | null = null;

  constructor() {
    // BroadcastChannel only available in browser
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      this.channel = new BroadcastChannel("panel-state-sync");
      this.channel.onmessage = (event: MessageEvent<BroadcastMessage>) => {
        const { projectId, snapshot } = event.data;
        // Apply silently — do NOT re-broadcast to avoid infinite loop
        this.applyRemote(projectId, snapshot);
      };
    }
  }

  /** Apply snapshot received from another tab (no broadcast, no lastProject update) */
  private applyRemote(projectId: string, snapshot: PanelSnapshot) {
    const current = this.store.get(projectId);
    // Only apply if the incoming snapshot is newer
    if (current && current.updatedAt >= snapshot.updatedAt) return;
    this.store.set(projectId, snapshot);
    this.notify(projectId);
  }

  get(projectId: string): PanelSnapshot | null {
    return this.store.get(projectId) ?? null;
  }

  set(projectId: string, patch: Partial<Omit<PanelSnapshot, "updatedAt">>) {
    const current = this.store.get(projectId) ?? { ...DEFAULT_SNAPSHOT, updatedAt: 0 };
    const next: PanelSnapshot = { ...current, ...patch, updatedAt: Date.now() };
    this.store.set(projectId, next);
    this.notify(projectId);
    // Broadcast to other tabs — strip React components (icon) before postMessage
    // BroadcastChannel uses structured clone which cannot serialize forwardRef symbols
    try {
      this.channel?.postMessage({ projectId, snapshot: serializeForBroadcast(next) } satisfies BroadcastMessage);
    } catch { /* non-critical — cross-tab sync degraded gracefully */ }
  }

  setLinkedItemId(projectId: string, itemId: string | null) {
    this.set(projectId, { linkedItemId: itemId });
  }

  /** Persist the last active projectId so the stand-alone page can restore it */
  setLastActiveProject(projectId: string) {
    try { localStorage.setItem(LAST_PROJECT_KEY, projectId); } catch { /* ignore */ }
  }

  getLastActiveProject(): string | null {
    try { return localStorage.getItem(LAST_PROJECT_KEY); } catch { return null; }
  }

  subscribe(projectId: string, listener: Listener): () => void {
    if (!this.listeners.has(projectId)) {
      this.listeners.set(projectId, new Set());
    }
    this.listeners.get(projectId)!.add(listener);
    return () => {
      this.listeners.get(projectId)?.delete(listener);
    };
  }

  private notify(projectId: string) {
    this.listeners.get(projectId)?.forEach((fn) => fn());
  }

  clear(projectId: string) {
    this.store.delete(projectId);
    this.notify(projectId);
    this.channel?.postMessage({ projectId, snapshot: { ...DEFAULT_SNAPSHOT, updatedAt: Date.now() } } satisfies BroadcastMessage);
  }
}

export const panelStateStore = new PanelStateStore();
