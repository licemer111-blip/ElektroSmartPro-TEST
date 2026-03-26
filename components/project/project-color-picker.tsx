"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { updateProjectColor } from "@/app/dashboard/projects/tags-actions";
import { PROJECT_COLORS } from "@/app/dashboard/projects/tags-constants";
import { Palette, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ProjectColorPickerProps {
  projectId: string;
  currentColor?: string | null;
  onColorChange?: (color: string | null) => void;
  compact?: boolean;
}

export function ProjectColorPicker({ 
  projectId, 
  currentColor, 
  onColorChange,
  compact = false 
}: ProjectColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string | null>(currentColor || null);

  const handleColorSelect = async (color: string | null) => {
    setLoading(true);
    try {
      const result = await updateProjectColor(projectId, color);
      if (result.error) {
        toast.error(result.error);
      } else {
        setSelectedColor(color);
        onColorChange?.(color);
        setOpen(false);
        toast.success(color ? "Kolor zmieniony!" : "Kolor usunięty");
      }
    } catch (error) {
      toast.error("Błąd podczas zmiany koloru");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={compact ? "h-6 px-2" : "h-7 px-2"}
        >
          {selectedColor ? (
            <div
              className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600"
              style={{ backgroundColor: selectedColor }}
            />
          ) : (
            <Palette className="w-3 h-3" />
          )}
          {!compact && <span className="text-xs ml-1">Kolor</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-3" align="start">
        <div className="space-y-3">
          <div className="font-medium text-sm">Wybierz kolor</div>
          
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-2">
                {PROJECT_COLORS.map((color) => (
                  <button
                    key={color.value}
                    className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all ${
                      selectedColor === color.value
                        ? "border-slate-900 dark:border-white scale-110"
                        : "border-transparent hover:scale-105"
                    }`}
                    style={{ backgroundColor: color.value }}
                    onClick={() => handleColorSelect(color.value)}
                    title={color.name}
                  >
                    {selectedColor === color.value && (
                      <Check className="w-4 h-4 text-white drop-shadow-md" />
                    )}
                  </button>
                ))}
              </div>
              
              {/* Remove color button */}
              {selectedColor && (
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => handleColorSelect(null)}
                >
                  <X className="w-3 h-3 mr-1" />
                  Usuń kolor
                </Button>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
