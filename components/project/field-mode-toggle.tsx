"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { Button } from "@/components/ui/button";
import { HardHat } from "lucide-react";
import { cn } from "@/lib/utils";

interface FieldModeContextType {
  isFieldMode: boolean;
  setFieldMode: (value: boolean) => void;
}

const FieldModeContext = createContext<FieldModeContextType>({
  isFieldMode: false,
  setFieldMode: () => {},
});

export function useFieldMode() {
  return useContext(FieldModeContext);
}

export function FieldModeProvider({ children }: { children: React.ReactNode }) {
  const [isFieldMode, setFieldMode] = useState(false);

  // Persist preference in localStorage
  useEffect(() => {
    const stored = localStorage.getItem("elektrosmart-field-mode");
    if (stored === "true") setFieldMode(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("elektrosmart-field-mode", String(isFieldMode));
    // Add/remove class on body for global styling
    if (isFieldMode) {
      document.body.classList.add("field-mode");
    } else {
      document.body.classList.remove("field-mode");
    }
  }, [isFieldMode]);

  return (
    <FieldModeContext.Provider value={{ isFieldMode, setFieldMode }}>
      {children}
    </FieldModeContext.Provider>
  );
}

export function FieldModeToggle({ className }: { className?: string }) {
  const { isFieldMode, setFieldMode } = useFieldMode();

  return (
    <Button
      variant={isFieldMode ? "default" : "outline"}
      size="sm"
      onClick={() => setFieldMode(!isFieldMode)}
      className={cn(
        "gap-1.5 transition-all",
        isFieldMode
          ? "bg-amber-600 hover:bg-amber-700 text-white border-amber-600 shadow-lg shadow-amber-500/30"
          : "border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30",
        className
      )}
      title={isFieldMode ? "Wyłącz tryb budowy" : "Włącz tryb budowy — duże przyciski, uproszczony widok"}
    >
      <HardHat className="w-4 h-4" />
      <span className="hidden sm:inline text-xs">{isFieldMode ? "Tryb budowy ON" : "Budowa"}</span>
    </Button>
  );
}
