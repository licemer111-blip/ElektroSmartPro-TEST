import { useState, useCallback, useEffect } from "react";

export interface HistoryAction {
  type: "add" | "edit" | "delete";
  itemId: string;
  itemData: Record<string, unknown>; // Previous state for undo
  timestamp: number;
}

interface UseHistoryOptions {
  maxHistory?: number; // Maximum history size
  projectId: string;
}

export function useHistory({ maxHistory = 50, projectId }: UseHistoryOptions) {
  const [history, setHistory] = useState<HistoryAction[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);

  // Load history from localStorage on mount
  useEffect(() => {
    const storageKey = `project-history-${projectId}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setHistory(parsed.history || []);
        setCurrentIndex(parsed.currentIndex ?? -1);
      } catch {
        // ignore parse error
      }
    }
  }, [projectId]);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    const storageKey = `project-history-${projectId}`;
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        history,
        currentIndex,
      })
    );
  }, [history, currentIndex, projectId]);

  const addAction = useCallback(
    (action: HistoryAction) => {
      setHistory((prev) => {
        // Remove any actions after current index (we're creating a new branch)
        const newHistory = prev.slice(0, currentIndex + 1);
        
        // Add new action
        newHistory.push(action);
        
        // Limit history size
        if (newHistory.length > maxHistory) {
          return newHistory.slice(-maxHistory);
        }
        
        return newHistory;
      });
      
      setCurrentIndex((prev) => Math.min(prev + 1, maxHistory - 1));
    },
    [currentIndex, maxHistory]
  );

  const undo = useCallback((): HistoryAction | null => {
    if (currentIndex < 0) return null;
    
    const action = history[currentIndex];
    setCurrentIndex((prev) => prev - 1);
    
    return action;
  }, [currentIndex, history]);

  const redo = useCallback((): HistoryAction | null => {
    if (currentIndex >= history.length - 1) return null;
    
    const action = history[currentIndex + 1];
    setCurrentIndex((prev) => prev + 1);
    
    return action;
  }, [currentIndex, history]);

  const canUndo = currentIndex >= 0;
  const canRedo = currentIndex < history.length - 1;

  const clearHistory = useCallback(() => {
    setHistory([]);
    setCurrentIndex(-1);
    const storageKey = `project-history-${projectId}`;
    localStorage.removeItem(storageKey);
  }, [projectId]);

  return {
    addAction,
    undo,
    redo,
    canUndo,
    canRedo,
    clearHistory,
    history,
    currentIndex,
  };
}
