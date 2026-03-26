"use client";

import { useRef, useState } from "react";
import { ChevronRight, Trash2, Edit, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SwipeableRowProps {
  children: React.ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  disabled?: boolean;
}

export function SwipeableRow({ 
  children, 
  onEdit, 
  onDelete, 
  onDuplicate,
  disabled = false 
}: SwipeableRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const currentX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (disabled) return;
    setIsDragging(true);
    startX.current = e.touches[0].clientX - translateX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || disabled) return;
    currentX.current = e.touches[0].clientX - startX.current;
    
    // Ограничиваем свайп
    const maxSwipe = -120;
    const minSwipe = 120;
    
    if (currentX.current < maxSwipe) {
      setTranslateX(maxSwipe);
    } else if (currentX.current > minSwipe) {
      setTranslateX(minSwipe);
    } else {
      setTranslateX(currentX.current);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging || disabled) return;
    setIsDragging(false);
    
    // Определяем действие по положению
    const threshold = 60;
    
    if (translateX < -threshold) {
      // Свайп влево - действия
      setTranslateX(-120);
    } else if (translateX > threshold) {
      // Свайп вправо - редактирование
      setTranslateX(120);
      onEdit?.();
      setTimeout(() => setTranslateX(0), 300);
    } else {
      // Возвращаем в центр
      setTranslateX(0);
    }
  };

  const handleActionClick = (action: () => void) => {
    action();
    setTranslateX(0);
  };

  return (
    <div className="relative overflow-hidden">
      {/* Фоновые кнопки действий */}
      <div 
        className={cn(
          "absolute inset-y-0 left-0 flex items-center pl-2 bg-blue-500 transition-transform duration-300",
          translateX > 0 ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ width: "120px" }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => handleActionClick(() => onEdit?.())}
          className="h-8 w-8 text-white hover:bg-blue-600"
        >
          <Edit className="h-4 w-4" />
        </Button>
      </div>

      <div 
        className={cn(
          "absolute inset-y-0 right-0 flex items-center justify-end pr-2 bg-red-500 transition-transform duration-300",
          translateX < 0 ? "translate-x-0" : "translate-x-full"
        )}
        style={{ width: "120px" }}
      >
        <div className="flex gap-1">
          {onDuplicate && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleActionClick(() => onDuplicate?.())}
              className="h-8 w-8 text-white hover:bg-red-600"
            >
              <Copy className="h-4 w-4" />
            </Button>
          )}
          {onDelete && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleActionClick(() => onDelete?.())}
              className="h-8 w-8 text-white hover:bg-red-600"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Основной контент */}
      <div
        ref={rowRef}
        className={cn(
          "relative bg-background transition-transform duration-300 touch-pan-y",
          isDragging && "cursor-grabbing"
        )}
        style={{
          transform: `translateX(${translateX}px)`,
          transition: isDragging ? "none" : "transform 300ms"
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
        
        {/* Индикатор свайпа */}
        {Math.abs(translateX) > 10 && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-30">
            <ChevronRight className={cn(
              "h-4 w-4 text-muted-foreground transition-transform",
              translateX < 0 && "rotate-180"
            )} />
          </div>
        )}
      </div>
    </div>
  );
}
