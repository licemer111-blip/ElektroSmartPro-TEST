"use client";

import { useState, useEffect } from "react";

export type DataSourceMode = "own" | "engine" | "hybrid";

const STORAGE_KEY = "es_search_mode_v1";
const DEFAULT_MODE: DataSourceMode = "hybrid";

export function useSearchMode() {
  const [mode, setModeState] = useState<DataSourceMode>(DEFAULT_MODE);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as DataSourceMode | null;
      if (stored && (["own", "engine", "hybrid"] as DataSourceMode[]).includes(stored)) {
        setModeState(stored);
      }
    } catch {}
  }, []);

  const setMode = (newMode: DataSourceMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem(STORAGE_KEY, newMode);
    } catch {}
  };

  return { mode, setMode };
}
