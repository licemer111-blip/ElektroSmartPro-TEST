"use client";

import { createContext, useContext, ReactNode } from "react";

interface ToolsContextType {
  isPro: boolean;
}

const ToolsContext = createContext<ToolsContextType | undefined>(undefined);

interface ToolsProviderProps {
  children: ReactNode;
  isPro: boolean;
}

export function ToolsProvider({ children, isPro }: ToolsProviderProps) {
  return (
    <ToolsContext.Provider value={{ isPro }}>
      {children}
    </ToolsContext.Provider>
  );
}

/**
 * Hook to access PRO status in calculator pages
 */
export function useToolsAccess() {
  const context = useContext(ToolsContext);
  if (context === undefined) {
    throw new Error("useToolsAccess must be used within ToolsProvider");
  }
  return context;
}
