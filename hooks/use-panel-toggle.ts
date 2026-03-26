"use client";

import { useState, useEffect } from "react";

export function usePanelToggle() {
  // Initialize state from localStorage
  const [isCatalogOpen, setIsCatalogOpen] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("elektrosmart-catalog-open");
      return saved !== null ? JSON.parse(saved) : true;
    }
    return true;
  });
  
  const [isSummaryOpen, setIsSummaryOpen] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("elektrosmart-summary-open");
      return saved !== null ? JSON.parse(saved) : true;
    }
    return true;
  });

  // Save to localStorage when state changes
  useEffect(() => {
    localStorage.setItem("elektrosmart-catalog-open", JSON.stringify(isCatalogOpen));
  }, [isCatalogOpen]);

  useEffect(() => {
    localStorage.setItem("elektrosmart-summary-open", JSON.stringify(isSummaryOpen));
  }, [isSummaryOpen]);

  const toggleCatalog = () => setIsCatalogOpen(!isCatalogOpen);
  const toggleSummary = () => setIsSummaryOpen(!isSummaryOpen);

  return {
    isCatalogOpen,
    isSummaryOpen,
    toggleCatalog,
    toggleSummary,
  };
}
