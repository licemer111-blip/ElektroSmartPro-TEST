/**
 * Global Style Constants
 * 
 * Ensures consistency across the entire application
 * Use these constants instead of hardcoding values
 */

export const GLOBAL_STYLES = {
  // Container Widths
  container: {
    xl: "max-w-7xl",      // 1280px - Dashboard pages
    lg: "max-w-6xl",      // 1152px - Tables, forms
    md: "max-w-4xl",      // 896px - Content pages
    sm: "max-w-3xl",      // 768px - Narrow content
  },

  // Padding & Spacing
  spacing: {
    page: "px-4 sm:px-6 lg:px-8 py-8",
    section: "py-16 px-4",
    card: {
      sm: "p-4",
      md: "p-6",
      lg: "p-8",
    },
  },

  // Border Radius
  radius: {
    sm: "rounded-lg",     // 8px
    md: "rounded-xl",     // 12px
    lg: "rounded-2xl",    // 16px
    full: "rounded-full",
  },

  // Background Colors (Dark Theme)
  bg: {
    page: "bg-slate-950",
    card: "bg-slate-900/50 backdrop-blur-md",
    cardSolid: "bg-slate-900",
    hover: "hover:bg-slate-800/50",
    active: "bg-slate-800",
  },

  // Border Colors
  border: {
    default: "border-slate-800",
    light: "border-slate-700",
    focus: "border-indigo-500",
  },

  // Text Colors
  text: {
    primary: "text-white",
    secondary: "text-slate-200",
    muted: "text-slate-400",
    disabled: "text-slate-600",
  },

  // Button Styles
  button: {
    primary: "bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-md rounded-xl transition-all duration-200",
    secondary: "bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-all duration-200",
    outline: "border border-slate-700 text-slate-200 hover:bg-slate-800 rounded-xl transition-all duration-200",
    ghost: "hover:bg-slate-800/50 text-slate-200 rounded-xl transition-all duration-200",
    destructive: "bg-red-600 hover:bg-red-700 text-white rounded-xl transition-all duration-200",
  },

  // Card Styles
  card: {
    default: "bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-xl",
    hover: "hover:shadow-lg hover:border-indigo-500/50 transition-all duration-200",
    selected: "border-indigo-500 shadow-lg shadow-indigo-500/20 ring-2 ring-indigo-500/30",
  },

  // Typography
  typography: {
    h1: "text-3xl font-bold text-white",
    h2: "text-2xl font-bold text-white",
    h3: "text-xl font-semibold text-white",
    h4: "text-lg font-semibold text-white",
    body: "text-sm text-slate-200",
    caption: "text-xs text-slate-400",
  },

  // Transitions
  transition: {
    fast: "transition-all duration-100",
    normal: "transition-all duration-200",
    slow: "transition-all duration-300",
  },
} as const;

/**
 * Helper function to combine global styles
 */
export function combineStyles(...styles: string[]): string {
  return styles.filter(Boolean).join(" ");
}
