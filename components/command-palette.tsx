"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  FolderKanban, 
  Package, 
  Wrench,
  FileText,
  Settings,
  LayoutDashboard,
  Clock,
  Sparkles,
  List,
  User,
  Bot,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

interface SearchResult {
  id: string;
  title: string;
  subtitle?: string;
  type: 'project' | 'catalog' | 'page' | 'recent' | 'item';
  url: string;
  icon: React.ReactNode;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isSearching, setIsSearching] = useState(false);

  // Quick actions (always visible)
  const quickActions: SearchResult[] = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      subtitle: 'Przejdź do głównego dashboardu',
      type: 'page',
      url: '/dashboard',
      icon: <LayoutDashboard className="w-4 h-4" />,
    },
    {
      id: 'catalog',
      title: 'Katalog',
      subtitle: 'Przeglądaj katalog pozycji',
      type: 'page',
      url: '/dashboard/catalog',
      icon: <Package className="w-4 h-4" />,
    },
    {
      id: 'tools',
      title: 'Narzędzia',
      subtitle: 'Kalkulatory elektryczne',
      type: 'page',
      url: '/dashboard/tools',
      icon: <Wrench className="w-4 h-4" />,
    },
    {
      id: 'invoices',
      title: 'Faktury',
      subtitle: 'Zarządzaj fakturami',
      type: 'page',
      url: '/dashboard/invoices',
      icon: <FileText className="w-4 h-4" />,
    },
    {
      id: 'settings',
      title: 'Ustawienia',
      subtitle: 'Konfiguracja konta i subskrypcji',
      type: 'page',
      url: '/dashboard/settings',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  // Search function
  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      const recentProjects = getRecentProjects();
      setResults([...quickActions, ...recentProjects]);
      return;
    }

    setIsSearching(true);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setResults(quickActions);
        return;
      }

      const searchLower = searchQuery.toLowerCase();

      // Search projects by name OR client_name (parallel)
      const [{ data: projectsByName }, { data: projectsByClient }] = await Promise.all([
        supabase
          .from('projects')
          .select('id, name, status, client_name')
          .eq('user_id', user.id)
          .ilike('name', `%${searchQuery}%`)
          .limit(5),
        supabase
          .from('projects')
          .select('id, name, status, client_name')
          .eq('user_id', user.id)
          .ilike('client_name', `%${searchQuery}%`)
          .limit(5),
      ]);

      // Merge + deduplicate projects
      const projectMap = new Map<string, { id: string; name: string; status: string; client_name: string | null }>();
      for (const p of [...(projectsByName || []), ...(projectsByClient || [])]) {
        if (!projectMap.has(p.id)) projectMap.set(p.id, p);
      }
      const projectResults: SearchResult[] = Array.from(projectMap.values()).slice(0, 6).map(p => ({
        id: p.id,
        title: p.name,
        subtitle: p.client_name ? `Klient: ${p.client_name} · ${getStatusLabel(p.status)}` : getStatusLabel(p.status),
        type: 'project' as const,
        url: `/dashboard/projects/${p.id}`,
        icon: <FolderKanban className="w-4 h-4" />,
      }));

      // Search catalog items
      const { data: catalogItems } = await supabase
        .from('catalog_items')
        .select('id, name, unit, base_material_price, base_labor_price')
        .or(`user_id.eq.${user.id},user_id.is.null`)
        .ilike('name', `%${searchQuery}%`)
        .limit(4);

      const catalogResults: SearchResult[] = (catalogItems || []).map(item => ({
        id: item.id,
        title: item.name,
        subtitle: `${item.unit} · ${((item.base_material_price || 0) + (item.base_labor_price || 0)).toFixed(2)} zł`,
        type: 'catalog' as const,
        url: `/dashboard/catalog?search=${encodeURIComponent(searchQuery)}`,
        icon: <Package className="w-4 h-4" />,
      }));

      // Search project_items across ALL user projects — group by project
      const { data: projectItems } = await supabase
        .from('project_items')
        .select('id, name, unit, quantity, project_id, projects!inner(id, name, user_id)')
        .eq('projects.user_id', user.id)
        .ilike('name', `%${searchQuery}%`)
        .is('is_assembly_child', false)
        .limit(10);

      // Deduplicate by project_id — show each project once with count
      const itemsByProject = new Map<string, { projectName: string; count: number; firstName: string; projectId: string }>();
      for (const item of (projectItems || [])) {
        const proj = item.projects as unknown as { id: string; name: string };
        const existing = itemsByProject.get(item.project_id);
        if (existing) {
          existing.count++;
        } else {
          itemsByProject.set(item.project_id, { projectName: proj?.name ?? '', count: 1, firstName: item.name, projectId: item.project_id });
        }
      }
      const itemResults: SearchResult[] = Array.from(itemsByProject.values()).map(({ projectName, count, firstName, projectId }) => ({
        id: `item-proj-${projectId}`,
        title: firstName + (count > 1 ? ` (+${count - 1} więcej)` : ''),
        subtitle: `Projekt: ${projectName}`,
        type: 'item' as const,
        url: `/dashboard/projects/${projectId}`,
        icon: <List className="w-4 h-4" />,
      }));

      // Filter quick actions
      const filteredActions = quickActions.filter(
        action =>
          action.title.toLowerCase().includes(searchLower) ||
          action.subtitle?.toLowerCase().includes(searchLower)
      );

      setResults([...filteredActions, ...projectResults, ...itemResults, ...catalogResults]);
    } catch (error) {
      console.error('Search error:', error);
      setResults(quickActions);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Get recent projects from localStorage
  const getRecentProjects = (): SearchResult[] => {
    try {
      const stored = localStorage.getItem("recentProjects");
      if (!stored) return [];

      const projects = JSON.parse(stored);
      return projects.slice(0, 3).map((p: { id: string; name: string; status: string }) => ({
        id: p.id,
        title: p.name,
        subtitle: getStatusLabel(p.status),
        type: 'recent',
        url: `/dashboard/projects/${p.id}`,
        icon: <Clock className="w-4 h-4" />,
      }));
    } catch (error) {
      return [];
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'draft': return 'Wersja robocza';
      case 'final': return 'Ukończony';
      case 'archived': return 'Zarchiwizowany';
      default: return status;
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query, performSearch]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        handleSelect(results[selectedIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex]);

  // Reset on open/close
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      performSearch("");
    }
  }, [isOpen, performSearch]);

  const handleSelect = (result: SearchResult) => {
    onClose();
    router.push(result.url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0">
        <DialogTitle className="sr-only">Paleta poleceń</DialogTitle>
        <DialogDescription className="sr-only">Szybkie wyszukiwanie i nawigacja po aplikacji.</DialogDescription>
        {/* Search Input */}
        <div className="flex items-center border-b px-4 py-3">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <Input
            id="command-palette-search"
            name="command-palette-search"
            aria-label="Szybkie wyszukiwanie"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Szukaj projektów, pozycji, stron..."
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-base"
            autoFocus
          />
          {isSearching && (
            <div className="animate-spin ml-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
            </div>
          )}
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto">
          {!isSearching && query && results.length === 0 ? (
            <div className="p-6 text-center space-y-3">
              <Search className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-600" />
              <div>
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Brak wyników dla „{query}"</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Spróbuj innej frazy lub zapytaj ES-Engine</p>
              </div>
              <button
                onClick={() => { onClose(); router.push(`/dashboard/projects?ai=true&q=${encodeURIComponent(query)}`); }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-medium hover:from-purple-700 hover:to-blue-700 transition-all shadow-sm"
              >
                <Bot className="w-3.5 h-3.5" />
                Zapytaj ES-Engine o &bdquo;{query}&rdquo;
              </button>
            </div>
          ) : (
            <div>
              {results.map((result, index) => {
                const isRecent = result.type === 'recent';
                const prevType = index > 0 ? results[index - 1].type : null;
                const typeChanged = prevType !== result.type;

                const groupLabel: Record<string, string> = {
                  page: query ? 'Strony' : 'Szybkie akcje',
                  recent: 'Ostatnio otwarte',
                  project: 'Projekty',
                  item: 'Pozycje w projektach',
                  catalog: 'Katalog',
                };

                const iconColor: Record<string, string> = {
                  page: 'text-slate-500 dark:text-slate-400',
                  recent: 'text-slate-400',
                  project: 'text-blue-600 dark:text-blue-400',
                  item: 'text-emerald-600 dark:text-emerald-400',
                  catalog: 'text-orange-500 dark:text-orange-400',
                };

                return (
                  <div key={result.id}>
                    {typeChanged && (
                      <div className={`px-3 py-1.5 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest ${index > 0 ? 'mt-2 border-t border-slate-100 dark:border-slate-800 pt-2' : ''}`}>
                        {groupLabel[result.type] ?? result.type}
                      </div>
                    )}
                    <button
                      onClick={() => handleSelect(result)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                        index === selectedIndex
                          ? 'bg-blue-50 dark:bg-blue-950/30 ring-1 ring-blue-200 dark:ring-blue-800'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className={`flex-shrink-0 ${iconColor[result.type] ?? 'text-slate-500'}`}>
                        {result.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {result.title}
                        </div>
                        {result.subtitle && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {result.subtitle}
                          </div>
                        )}
                      </div>
                      {isRecent && (
                        <span className="text-[10px] text-slate-400 flex-shrink-0">Ostatnio</span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t px-4 py-2 flex items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border">↑↓</kbd>
            <span>Nawigacja</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border">Enter</kbd>
            <span>Wybierz</span>
          </div>
          <div className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded border">Esc</kbd>
            <span>Zamknij</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
