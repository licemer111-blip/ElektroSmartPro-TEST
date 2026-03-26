"use client";

import { useState, useCallback } from "react";

const STORAGE_KEY = "elektrosmart_summary_collapsed";

export function useSummaryCollapse() {
  const [summaryCollapsed, setSummaryCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(STORAGE_KEY) === "true";
    }
    return false;
  });

  const toggleSummary = useCallback(() => {
    setSummaryCollapsed(prev => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
    queueMicrotask(() => window.dispatchEvent(new Event("summary-toggled")));
  }, []);

  return { summaryCollapsed, toggleSummary };
}
