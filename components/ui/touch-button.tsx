import React from "react";
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TouchButtonProps extends ButtonProps {
  children: React.ReactNode;
  ensureMinSize?: boolean;
}

export function TouchButton({ 
  children, 
  className, 
  ensureMinSize = true,
  ...props 
}: TouchButtonProps) {
  return (
    <Button
      className={cn(
        // Минимальный размер для touch targets (44px)
        ensureMinSize && "min-h-[44px] min-w-[44px]",
        // Улучшения для мобильных
        "active:scale-95 transition-transform duration-150",
        "touch-manipulation", // Отключает 300ms задержку
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
}

// Специальная кнопка для иконок
export function TouchIconButton({ 
  children, 
  className, 
  ...props 
}: ButtonProps) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "h-11 w-11 min-h-[44px] min-w-[44px]", // 44px для touch
        "active:scale-95 transition-transform duration-150",
        "touch-manipulation",
        className
      )}
      {...props}
    >
      {children}
    </Button>
  );
}
