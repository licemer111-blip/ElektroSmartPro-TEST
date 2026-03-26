"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogTitle,
} from "@/components/ui/dialog";
import {
  Edit3, Trash2, MapPin, Calendar, Camera,
  ChevronLeft, ChevronRight, ZoomIn,
} from "lucide-react";
import type { PortfolioItem } from "@/lib/types/database";

interface PortfolioDetailDialogProps {
  item: PortfolioItem | null;
  onClose: () => void;
  onEdit: (item: PortfolioItem) => void;
  onDelete: (id: string) => void;
  onLightbox: (images: string[], index: number) => void;
}

export function PortfolioDetailDialog({
  item, onClose, onEdit, onDelete, onLightbox,
}: PortfolioDetailDialogProps) {
  const [imageIdx, setImageIdx] = useState(0);

  if (!item) return null;

  return (
    <Dialog open={!!item} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <DialogTitle className="sr-only">{item.title}</DialogTitle>
        <DialogDescription className="sr-only">Szczegóły realizacji z portfolio.</DialogDescription>
        <div>
          {item.images.length > 0 && (
            <div className="relative">
              <button
                onClick={() => onLightbox(item.images, imageIdx)}
                className="w-full h-72 sm:h-96 overflow-hidden cursor-zoom-in group block"
              >
                <img
                  src={item.images[imageIdx]}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-white rounded-lg px-2.5 py-1 text-xs font-medium flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <ZoomIn className="w-3.5 h-3.5" />
                  Powiększ
                </div>
              </button>
              {item.images.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); setImageIdx(prev => prev > 0 ? prev - 1 : item.images.length - 1); }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-colors z-10"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); setImageIdx(prev => prev < item.images.length - 1 ? prev + 1 : 0); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/60 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-black/80 transition-colors z-10"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white rounded-full px-2.5 py-0.5 text-xs font-medium">
                    {imageIdx + 1}/{item.images.length}
                  </div>
                </>
              )}
            </div>
          )}

          {item.images.length > 1 && (
            <div className="flex gap-1.5 px-4 py-2.5 bg-slate-50 dark:bg-slate-900/50 overflow-x-auto">
              {item.images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setImageIdx(idx)}
                  className={`flex-shrink-0 w-16 h-12 rounded-md overflow-hidden border-2 transition-all ${idx === imageIdx ? "border-blue-500 shadow-md opacity-100" : "border-transparent opacity-50 hover:opacity-80"}`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          <div className="p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{item.title}</h2>
              <Badge className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-0 shrink-0 text-xs">
                {item.category}
              </Badge>
            </div>
            {item.description && (
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{item.description}</p>
            )}
            <div className="flex items-center flex-wrap gap-4 pt-2 border-t border-slate-100 dark:border-slate-700">
              {item.location && (
                <span className="flex items-center gap-1.5 text-sm text-slate-500">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  {item.location}
                </span>
              )}
              {item.completion_date && (
                <span className="flex items-center gap-1.5 text-sm text-slate-500">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  {new Date(item.completion_date).toLocaleDateString("pl-PL", { year: "numeric", month: "long" })}
                </span>
              )}
              {item.images.length > 0 && (
                <span className="flex items-center gap-1.5 text-sm text-slate-500">
                  <Camera className="w-4 h-4 text-blue-500" />
                  {item.images.length} zdjęć
                </span>
              )}
            </div>
            <div className="flex gap-2 pt-2">
              <Button size="sm" variant="outline" className="gap-1.5"
                onClick={() => { onClose(); onEdit(item); }}>
                <Edit3 className="w-3.5 h-3.5" />
                Edytuj
              </Button>
              <Button size="sm" variant="outline" className="gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={() => { onClose(); onDelete(item.id); }}>
                <Trash2 className="w-3.5 h-3.5" />
                Usuń
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
