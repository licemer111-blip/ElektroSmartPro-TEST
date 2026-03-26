"use client";

import { useState, useEffect } from "react";
import { CommandPalette } from "./command-palette";

/**
 * Command Palette Provider
 * Handles Ctrl+K shortcut and renders the command palette
 */
export function CommandPaletteProvider() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return <CommandPalette isOpen={isOpen} onClose={() => setIsOpen(false)} />;
}
