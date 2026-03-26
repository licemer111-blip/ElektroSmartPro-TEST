/**
 * Global Table Styles System
 * Ensures consistent high-density styling across all tables
 */

export const tableStyles = {
  // Table Header (Sticky)
  header: "sticky top-0 z-10 bg-slate-50 dark:bg-slate-900 border-b-2 border-slate-200 dark:border-slate-800",
  
  // Header Cell (Compact)
  headerCell: "py-2 px-3 text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300",
  
  // Body Row (Hover effect)
  row: "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-200 dark:border-slate-800/40",
  
  // Body Cell (Compact)
  cell: "py-2 px-3 text-sm text-slate-900 dark:text-slate-100",
  
  // Cell variants
  cellMuted: "py-2 px-3 text-sm text-slate-600 dark:text-slate-400",
  cellMono: "py-2 px-3 text-sm font-mono text-slate-900 dark:text-slate-100",
  cellRight: "py-2 px-3 text-sm text-right text-slate-900 dark:text-slate-100",
  
  // Empty state
  empty: "py-12 text-center text-sm text-slate-500 dark:text-slate-500",
} as const;

/**
 * Badge Styles for Categories/Status
 */
export const badgeStyles = {
  default: "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
  primary: "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300",
  success: "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300",
  warning: "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-300",
  danger: "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-300",
} as const;

/**
 * Action Button Styles (Compact)
 */
export const actionButtonStyles = {
  base: "h-7 w-7 p-0 transition-all duration-100",
  edit: "h-7 w-7 p-0 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:text-blue-600 dark:hover:text-blue-400",
  delete: "h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20",
  view: "h-7 w-7 p-0 hover:bg-slate-100 dark:hover:bg-slate-800",
} as const;
