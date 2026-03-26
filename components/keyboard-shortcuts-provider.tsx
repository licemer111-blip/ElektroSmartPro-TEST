"use client";

import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";

/**
 * Global keyboard shortcuts provider
 * Add this to your layout to enable keyboard shortcuts throughout the app
 */
export function KeyboardShortcutsProvider() {
  useKeyboardShortcuts();
  
  return null; // This component doesn't render anything
}
