"use client";

import { useState, useEffect, useCallback } from "react";
import { DEFAULT_CALIBRATION, type EngineCalibration } from "@/app/dashboard/settings/knr-calculator/_parts/KnrEngineCalibration";

const LS_KEY = "es-engine-calibration";

function loadFromStorage(): EngineCalibration {
  if (typeof window === "undefined") return DEFAULT_CALIBRATION;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return DEFAULT_CALIBRATION;
    const parsed = JSON.parse(raw) as Partial<EngineCalibration>;
    return { ...DEFAULT_CALIBRATION, ...parsed };
  } catch {
    return DEFAULT_CALIBRATION;
  }
}

/**
 * Persists ES-Engine calibration settings in localStorage.
 * Use this in KnrClient (settings page) instead of plain useState.
 */
export function useEngineCalibration() {
  const [calibration, setCalibrationState] = useState<EngineCalibration>(DEFAULT_CALIBRATION);

  // Hydrate from localStorage on mount
  useEffect(() => {
    setCalibrationState(loadFromStorage());
  }, []);

  const setCalibration = useCallback((next: EngineCalibration) => {
    setCalibrationState(next);
    try {
      window.localStorage.setItem(LS_KEY, JSON.stringify(next));
    } catch {
      // localStorage may be unavailable (private browsing, quota exceeded)
    }
  }, []);

  return { calibration, setCalibration };
}

/**
 * Reads autoLearning flag from localStorage without a React state.
 * Safe to call inside non-hook contexts (callbacks, useCallback closures).
 */
export function getAutoLearning(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return DEFAULT_CALIBRATION.autoLearning;
    const parsed = JSON.parse(raw) as Partial<EngineCalibration>;
    return parsed.autoLearning ?? DEFAULT_CALIBRATION.autoLearning;
  } catch {
    return DEFAULT_CALIBRATION.autoLearning;
  }
}
