import { cn } from "@/lib/utils";

interface PageContainerProps {
  children: React.ReactNode;
  maxWidth?: "lg" | "xl" | "2xl" | "full";
  className?: string;
}

/**
 * Global Page Container Component
 * Ensures consistent max-width and padding across all pages
 * 
 * Usage:
 * - Dashboard pages: maxWidth="xl" (1280px)
 * - Forms/Settings: maxWidth="lg" (1024px)
 * - Full-width: maxWidth="full"
 */
export function PageContainer({ 
  children, 
  maxWidth = "xl",
  className 
}: PageContainerProps) {
  const maxWidthClasses = {
    lg: "max-w-4xl",      // 1024px - Forms, Settings
    xl: "max-w-7xl",      // 1280px - Dashboard pages
    "2xl": "max-w-screen-2xl", // 1536px - Special cases
    full: "max-w-full",   // No limit
  };

  return (
    <div className={cn(
      "mx-auto px-4 md:px-8 py-6",
      maxWidthClasses[maxWidth],
      className
    )}>
      {children}
    </div>
  );
}
