"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Image as ImageIcon, Trash2, Edit3, Eye, EyeOff, Camera, MapPin, Calendar,
} from "lucide-react";
import type { PortfolioItem } from "@/lib/types/database";

interface PortfolioCardProps {
  item: PortfolioItem;
  onEdit: (item: PortfolioItem) => void;
  onDelete: (id: string) => void;
  onDetail: (item: PortfolioItem) => void;
  onLightbox: (images: string[], index: number) => void;
  onToggleVisibility: (item: PortfolioItem) => void;
}

export function PortfolioCard({
  item, onEdit, onDelete, onDetail, onLightbox, onToggleVisibility,
}: PortfolioCardProps) {
  return (
    <Card className="overflow-hidden group hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 border-0 shadow-md bg-white dark:bg-slate-800/80">
      {/* Hero image */}
      <div
        className="relative h-52 bg-slate-100 dark:bg-slate-800 cursor-pointer overflow-hidden"
        onClick={() => onDetail(item)}
      >
        {item.images.length > 0 ? (
          <img
            src={item.images[0]}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2">
            <Camera className="w-10 h-10 text-slate-300 dark:text-slate-600" />
            <span className="text-xs text-slate-400">Brak zdjęć</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        {!item.is_public && (
          <Badge className="absolute top-2.5 left-2.5 bg-slate-900/70 backdrop-blur-sm text-white text-[10px] border-0">
            <EyeOff className="w-3 h-3 mr-1" />
            Ukryte
          </Badge>
        )}
        <Badge className="absolute top-2.5 right-2.5 bg-blue-600/80 backdrop-blur-sm text-white text-[10px] border-0">
          {item.category}
        </Badge>
        {item.images.length > 0 && (
          <div className="absolute bottom-2.5 right-2.5 bg-black/60 backdrop-blur-sm text-white rounded-full px-2 py-0.5 text-[10px] font-medium flex items-center gap-1">
            <ImageIcon className="w-3 h-3" />
            {item.images.length}
          </div>
        )}
        <div className="absolute bottom-0 left-0 right-0 p-3 pt-8">
          <h3 className="font-bold text-sm text-white drop-shadow-lg line-clamp-1">{item.title}</h3>
        </div>
      </div>

      {/* Thumbnail strip */}
      {item.images.length > 1 && (
        <div className="flex gap-1 px-2.5 py-2 bg-slate-50 dark:bg-slate-900/50 overflow-x-auto">
          {item.images.slice(0, 8).map((img, imgIdx) => (
            <button
              key={imgIdx}
              onClick={(e) => { e.stopPropagation(); onLightbox(item.images, imgIdx); }}
              className="flex-shrink-0 w-12 h-9 rounded overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all opacity-70 hover:opacity-100"
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
          {item.images.length > 8 && (
            <div className="flex-shrink-0 w-12 h-9 rounded bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
              <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400">+{item.images.length - 8}</span>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="p-3.5 space-y-2">
        {item.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{item.description}</p>
        )}
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
          {item.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-blue-500" />
              {item.location}
            </span>
          )}
          {item.completion_date && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-blue-500" />
              {new Date(item.completion_date).toLocaleDateString("pl-PL")}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => onToggleVisibility(item)}
            className="text-[10px] text-muted-foreground hover:text-slate-700 dark:hover:text-slate-300 flex items-center gap-1 transition-colors"
          >
            {item.is_public ? <Eye className="w-3 h-3 text-green-500" /> : <EyeOff className="w-3 h-3" />}
            {item.is_public ? "Publiczne" : "Ukryte"}
          </button>
          <div className="flex items-center gap-0.5">
            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-blue-50 dark:hover:bg-blue-950/30" onClick={() => onEdit(item)}>
              <Edit3 className="w-3.5 h-3.5 text-blue-600" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-red-50 dark:hover:bg-red-950/30" onClick={() => onDelete(item.id)}>
              <Trash2 className="w-3.5 h-3.5 text-red-500" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
