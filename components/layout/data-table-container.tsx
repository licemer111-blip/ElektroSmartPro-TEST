import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface DataTableContainerProps {
  children: React.ReactNode;
  maxHeight?: string;
  className?: string;
}

/**
 * Global Data Table Container Component
 * Ensures consistent table styling with sticky headers and scroll
 * 
 * Features:
 * - Sticky header
 * - Scrollable content
 * - Consistent borders and backgrounds
 * - High-density mode ready
 */
export function DataTableContainer({ 
  children, 
  maxHeight = "600px",
  className 
}: DataTableContainerProps) {
  return (
    <Card className={cn(
      "border-slate-200 dark:border-slate-800/40 bg-white dark:bg-slate-900/50 backdrop-blur-sm",
      className
    )}>
      <div 
        className="overflow-x-auto overflow-y-auto"
        style={{ maxHeight }}
      >
        {children}
      </div>
    </Card>
  );
}
