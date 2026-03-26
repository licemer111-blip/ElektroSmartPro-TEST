import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
  variant?: "default" | "outline" | "ghost";
}

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: EmptyStateAction;
  variant?: "default" | "circuit" | "blueprint";
  className?: string;
}

/**
 * Professional Empty State Component
 * 
 * Used to show helpful messages when there's no data
 * Improves First-Time User Experience (FTUX)
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = "default",
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center",
        "p-12 rounded-xl border-2 border-dashed",
        "bg-slate-50/50 dark:bg-slate-900/20",
        "border-slate-300 dark:border-slate-800",
        "text-center",
        className
      )}
    >
      {/* Icon */}
      <div className="mb-6 relative">
        {/* Background glow */}
        <div className="absolute inset-0 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-2xl" />
        
        {/* Icon container */}
        <div className="relative bg-slate-100 dark:bg-slate-800/50 rounded-2xl p-6">
          <Icon className="w-12 h-12 text-slate-400 dark:text-slate-500" strokeWidth={1.5} />
        </div>
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
        {title}
      </h3>

      {/* Description */}
      <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mb-6 leading-relaxed">
        {description}
      </p>

      {/* Action Button */}
      {action && (
        <Button
          onClick={action.onClick}
          variant={action.variant || "default"}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all"
        >
          {action.icon && <action.icon className="w-4 h-4 mr-2" />}
          {action.label}
        </Button>
      )}
    </div>
  );
}
