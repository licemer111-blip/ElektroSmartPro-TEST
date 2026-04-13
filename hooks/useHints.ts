"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "elektrosmart_hints_enabled";

export function useHints() {
  const [hintsEnabled, setHintsEnabledState] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) {
      setHintsEnabledState(stored === "true");
    }
  }, []);

  const setHintsEnabled = useCallback((value: boolean) => {
    setHintsEnabledState(value);
    localStorage.setItem(STORAGE_KEY, String(value));
  }, []);

  const toggle = useCallback(() => {
    setHintsEnabled(!hintsEnabled);
  }, [hintsEnabled, setHintsEnabled]);

  return {
    hintsEnabled: mounted ? hintsEnabled : true,
    setHintsEnabled,
    toggle,
    mounted,
  };
}
