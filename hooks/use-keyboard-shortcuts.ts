import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface KeyboardShortcutsConfig {
  onNewProject?: () => void;
  onSaveProject?: () => void;
  onSearch?: () => void;
  onExportPDF?: () => void;
  onExportExcel?: () => void;
}

/**
 * Global keyboard shortcuts hook
 * 
 * Available shortcuts:
 * - Ctrl+K - Global search (to be implemented)
 * - Ctrl+N - New project (from anywhere)
 * - Ctrl+S - Save project as final (on project page)
 * - Ctrl+P - Download PDF (on project page)
 * - Ctrl+E - Export to Excel (on project page)
 * - / - Focus search (on catalog/search pages)
 */
export function useKeyboardShortcuts(config: KeyboardShortcutsConfig = {}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Get active element to check if we're in an input
      const activeElement = document.activeElement;
      const isInInput = 
        activeElement?.tagName === 'INPUT' ||
        activeElement?.tagName === 'TEXTAREA' ||
        activeElement?.getAttribute('contenteditable') === 'true';

      // Don't trigger shortcuts if we're typing (except Ctrl+K which is handled by CommandPalette)
      if (isInInput) return;

      // Ctrl+N - New project (from anywhere)
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        if (config.onNewProject) {
          config.onNewProject();
        } else {
          // Trigger new project button click
          const newProjectButton = document.querySelector('[data-new-project-trigger]') as HTMLElement;
          if (newProjectButton) {
            newProjectButton.click();
          }
        }
        return;
      }

      // Ctrl+S - Save project as final (on project pages)
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (pathname?.includes('/dashboard/projects/')) {
          if (config.onSaveProject) {
            config.onSaveProject();
          } else {
            // Trigger save button
            const saveButton = document.querySelector('[data-save-project]') as HTMLElement;
            if (saveButton && !saveButton.hasAttribute('disabled')) {
              saveButton.click();
            }
          }
        }
        return;
      }

      // Ctrl+P - Download PDF (on project pages)
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        if (pathname?.includes('/dashboard/projects/')) {
          e.preventDefault();
          if (config.onExportPDF) {
            config.onExportPDF();
          } else {
            // Trigger PDF download
            const pdfButton = document.querySelector('[data-export-pdf]') as HTMLElement;
            if (pdfButton && !pdfButton.hasAttribute('disabled')) {
              pdfButton.click();
            }
          }
        }
        return;
      }

      // Ctrl+E - Export to Excel (on project pages)
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        if (pathname?.includes('/dashboard/projects/')) {
          e.preventDefault();
          if (config.onExportExcel) {
            config.onExportExcel();
          } else {
            // Trigger Excel export
            const excelButton = document.querySelector('[data-export-excel]') as HTMLElement;
            if (excelButton) {
              excelButton.click();
            }
          }
        }
        return;
      }

      // / - Focus search (on catalog/search pages)
      if (e.key === '/' && !isInInput) {
        if (pathname?.includes('/catalog') || pathname?.includes('/market')) {
          e.preventDefault();
          const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
          if (searchInput) {
            searchInput.focus();
          }
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [config, router, pathname]);
}
