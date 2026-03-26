"use client";

import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Users, X, UserCircle2 } from "lucide-react";
import { useCollaborativeCursors } from "@/hooks/useCollaborativeCursors";

// UI State РґР»СЏ СЃРёРЅС…СЂРѕРЅРёР·Р°С†РёРё РјРµР¶РґСѓ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏРјРё
export type UIStatePayload = {
  catalogOpen?: boolean;
  expandedCategories?: string[];
  catalogSearchTerm?: string;
  catalogViewMode?: "card" | "list";
  catalogCreateDialogOpen?: boolean;
  catalogScrollTop?: number;
  catalogEditDialogOpen?: boolean;
  catalogEditItemId?: string | null;
  openDialog?: string | null;
  assemblyViewMode?: "list" | "create";
  assemblySelectedId?: string | null;
  assemblyQuantity?: number;
  assemblyDetailOpen?: boolean;
  colorMode?: boolean;
  filterType?: "all" | "materials" | "labor";
  estimateSearchOpen?: boolean;
  estimateSearchQuery?: string;
  estimateSortBy?: "name" | "price" | "date";
  estimateSortOrder?: "asc" | "desc";
  estimateLegendOpen?: boolean;
  estimateEditItemId?: string | null;
  mainScrollTop?: number;
  coPilotActive?: boolean;
  headerAiAssistantOpen?: boolean;
  headerAiImportOpen?: boolean;
  headerAiPricerOpen?: boolean;
  headerMembersOpen?: boolean;
  headerPanelOpen?: boolean;
  headerDocsOpen?: boolean;
  headerPortalOpen?: boolean;
  // Pult 5-w-1 live state (ProjectControlPanel)
  liveVatRate?: number;
  liveBruttoMode?: boolean;
  liveShowKnr?: boolean;
  liveShowLaborHours?: boolean;
  liveExpertColoring?: boolean;
  // Region (Województwo) modifier
  liveRegionId?: string;
  // Layout toggles
  compactView?: boolean;
  summaryCollapsed?: boolean;
};

export function CollaboratorCursors({
  projectId,
  userId,
  onTabSync,
  activeTab: externalActiveTab,
  onUIStateSync,
  uiState: externalUIState,
  isExternalSync,
}: {
  projectId: string;
  userId: string;
  onTabSync?: (tab: string) => void;
  activeTab?: string;
  onUIStateSync?: (state: UIStatePayload) => void;
  uiState?: UIStatePayload;
  isExternalSync?: boolean;
}) {
  const pathname = usePathname();

  const {
    cursors,
    onlineUsers,
    clickRipples,
    followMode,
    followingUserId,
    showUserList,
    myScroll,
    setShowUserList,
    setFollowMode,
    setFollowingUserId,
    startFollowing,
    getDisplayName,
  } = useCollaborativeCursors({
    projectId,
    userId,
    onTabSync,
    activeTab: externalActiveTab,
    onUIStateSync,
    uiState: externalUIState,
    isExternalSync,
  });

  const onlineCount = Object.keys(onlineUsers).length;
  const onlineUsersList = Object.values(onlineUsers);
  const followedUserName = followingUserId ? getDisplayName(followingUserId) : null;

  return (
    <>
      {/* Follow Mode Control Panel */}
      {onlineCount > 0 && (
        <div className="pointer-events-auto fixed bottom-6 right-6 z-[10000]">
          {/* User Selection Popup */}
          <AnimatePresence>
            {showUserList && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                className="absolute bottom-full right-0 mb-2 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden min-w-[200px]"
              >
                <div className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide">
                      Wspo&#322;pracownicy online
                    </span>
                    <button
                      onClick={() => setShowUserList(false)}
                      className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="py-1">
                  {onlineUsersList.map((user) => (
                    <button
                      key={user.userId}
                      onClick={() => startFollowing(user.userId)}
                      className={`w-full px-3 py-2 flex items-center gap-3 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors ${followingUserId === user.userId ? "bg-blue-50 dark:bg-blue-900/30" : ""}`}
                    >
                      <div className="relative">
                        <UserCircle2 className="w-8 h-8 text-blue-500" />
                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-800" />
                      </div>
                      <div className="text-left flex-1">
                        <div className="text-sm font-medium text-slate-800 dark:text-slate-200">
                          {getDisplayName(user.userId)}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {cursors[user.userId]?.activeTab || "estimate"}
                        </div>
                      </div>
                      {followingUserId === user.userId && (
                        <Eye className="w-4 h-4 text-blue-500" />
                      )}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2"
          >
            {followMode === "following" && followedUserName && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-blue-600 text-white px-3 py-2 rounded-l-full flex items-center gap-2 shadow-lg"
              >
                <Eye className="w-4 h-4" />
                <span className="text-sm font-medium max-w-[100px] truncate">
                  {followedUserName}
                </span>
                <button
                  onClick={() => { setFollowMode("off"); setFollowingUserId(null); }}
                  className="hover:bg-blue-700 p-1 rounded-full transition-colors"
                  title="Przesta&#324; obserwowa&#263;"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.div>
            )}

            <button
              onClick={() => {
                if (followMode === "following") {
                  setFollowMode("off");
                  setFollowingUserId(null);
                } else {
                  setShowUserList(!showUserList);
                }
              }}
              className={`
                flex items-center gap-2 px-4 py-2.5
                ${followMode === "following" && followedUserName ? "rounded-r-full" : "rounded-full"}
                font-medium text-sm shadow-lg transition-all duration-200
                ${followMode === "following"
                  ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                  : "bg-slate-700 hover:bg-slate-800 text-slate-200"
                }
              `}
              title={followMode === "following" ? "Kliknij aby zako&#324;czy&#263; obserwowanie" : "Kliknij aby wybra&#263; kogo obserwowa&#263;"}
            >
              {followMode === "following" ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4" />
              )}
              <span className="font-semibold">
                {followMode === "following" ? "Following" : "Independent"}
              </span>
              <span className="flex items-center gap-1 text-xs opacity-75">
                <Users className="w-3 h-3" />
                {onlineCount}
              </span>
            </button>
          </motion.div>
        </div>
      )}

      {/* Kursory partnerow */}
      {Object.entries(cursors).map(([key, cursor]) => {
        if (cursor.route !== pathname) return null;
        const displayX = cursor.x - myScroll.x;
        const displayY = cursor.y - myScroll.y;
        if (
          displayX < -50 || displayY < -50 ||
          displayX > window.innerWidth + 50 ||
          displayY > window.innerHeight + 50
        ) return null;
        return (
          <div
            key={key}
            className="pointer-events-none fixed z-[9999]"
            style={{
              left: displayX,
              top: displayY,
              transform: "translate3d(0,0,0)",
              transition: "left 80ms ease-out, top 80ms ease-out",
              willChange: "left, top",
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="drop-shadow-md">
              <path
                d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
                fill="#2563EB"
                stroke="white"
                strokeWidth="1.5"
              />
            </svg>
            <span className="absolute left-3 top-4 rounded bg-blue-600 px-1.5 py-0.5 text-[10px] text-white whitespace-nowrap shadow-lg">
              User
            </span>
          </div>
        );
      })}

      {/* Click Ripples */}
      <AnimatePresence>
        {clickRipples.map((ripple) => {
          const displayX = ripple.x - myScroll.x;
          const displayY = ripple.y - myScroll.y;
          if (
            displayX < -50 || displayY < -50 ||
            displayX > window.innerWidth + 50 ||
            displayY > window.innerHeight + 50
          ) return null;
          return (
            <motion.div
              key={ripple.id}
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 3, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="pointer-events-none fixed z-[9999]"
              style={{ left: displayX - 20, top: displayY - 20 }}
            >
              <div className="w-10 h-10 rounded-full border-4 border-blue-500" />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </>
  );
}