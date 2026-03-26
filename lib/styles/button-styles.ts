/**
 * Global Button Styles System
 * Ensures consistent button styling across all pages
 */

export const buttonStyles = {
  // Primary Action Button (Main CTAs)
  primary: "bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white shadow-md hover:shadow-lg hover:shadow-blue-500/50 transition-colors duration-200",
  
  // Secondary Button
  secondary: "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 transition-colors duration-100",
  
  // Outline Button
  outline: "border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors duration-100",
  
  // Ghost Button
  ghost: "hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-100",
  
  // Destructive Button
  destructive: "bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg hover:shadow-red-500/50 transition-colors duration-200",
  
  // Icon Button (Compact)
  icon: "h-8 w-8 p-0 transition-colors duration-100",
  
  // Icon Button with Color
  iconEdit: "h-8 w-8 p-0 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-100",
  iconDelete: "h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors duration-100",
  iconView: "h-8 w-8 p-0 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-100",
} as const;

/**
 * Badge Variants
 * Consistent badge styling for status, categories, etc.
 */
export const badgeVariants = {
  // Default (Neutral)
  default: "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700",
  
  // Primary (Blue)
  primary: "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800",
  
  // Success (Green)
  success: "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800",
  
  // Warning (Yellow)
  warning: "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-yellow-100 dark:bg-yellow-950/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800",
  
  // Danger (Red)
  danger: "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800",
  
  // Info (Indigo)
  info: "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-indigo-100 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800",
  
  // Pro (Gradient)
  pro: "inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm",
} as const;

/**
 * Input Styles
 * Consistent input field styling
 */
export const inputStyles = {
  base: "rounded-lg border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-100",
  error: "rounded-lg border-red-300 dark:border-red-700 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-red-500 focus:border-transparent",
} as const;
