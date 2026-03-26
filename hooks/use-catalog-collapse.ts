"use client";

import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "elektrosmart_catalog_collapsed";

export function useCatalogCollapse() {
  const [catalogCollapsed, setCatalogCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem(STORAGE_KEY) === "true";
    }
    return false;
  });

  useEffect(() => {
    const onToggled = () => {
      setCatalogCollapsed(localStorage.getItem(STORAGE_KEY) === "true");
    };
    window.addEventListener("catalog-toggled", onToggled);
    return () => window.removeEventListener("catalog-toggled", onToggled);
  }, []);

  const toggleCatalog = useCallback(() => {
    setCatalogCollapsed(prev => {
      const next = !prev;
      localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
    queueMicrotask(() => window.dispatchEvent(new Event("catalog-toggled")));
  }, []);

  return { catalogCollapsed, toggleCatalog };
}
