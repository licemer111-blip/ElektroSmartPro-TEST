import { ChevronRight, LucideIcon } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Breadcrumb {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  breadcrumbs?: Breadcrumb[];
  action?: React.ReactNode;
  className?: string;
}

/**
 * Global Page Header Component
 * Ensures consistent header structure across all pages
 * 
 * Structure: Breadcrumbs -> Icon + Title -> Description -> Action Button
 */
export function PageHeader({
  title,
  description,
  icon: Icon,
  breadcrumbs,
  action,
  className
}: PageHeaderProps) {
  return (
    <div className={cn("mb-8", className)}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-4">
          {breadcrumbs.map((crumb, index) => (
            <div key={index} className="flex items-center gap-2">
              {index > 0 && <ChevronRight className="w-3 h-3" />}
              {crumb.href ? (
                <Link 
                  href={crumb.href}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className="text-slate-900 dark:text-slate-100 font-medium">
                  {crumb.label}
                </span>
              )}
            </div>
          ))}
        </nav>
      )}

      {/* Title Section */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 md:gap-4">
          {/* Icon */}
          {Icon && (
            <div className="p-2 md:p-3 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 shadow-lg shadow-blue-500/20">
              <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
          )}

          {/* Title & Description */}
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              {title}
            </h1>
            {description && (
              <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 mt-1 md:mt-1.5 max-w-2xl">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Action Button */}
        {action && (
          <div className="flex-shrink-0">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}
