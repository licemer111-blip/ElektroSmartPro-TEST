"use client";

import { useEffect } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface LightboxCarouselProps {
  images: string[];
  index: number;
  onClose: () => void;
  onChange: (idx: number) => void;
}

export function LightboxCarousel({ images, index, onClose, onChange }: LightboxCarouselProps) {
  const prev = () => onChange(index > 0 ? index - 1 : images.length - 1);
  const next = () => onChange(index < images.length - 1 ? index + 1 : 0);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-sm flex items-center justify-center" onClick={onClose}>
      <button className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors z-10">
        <X className="w-5 h-5" />
      </button>

      <div className="absolute top-4 left-4 bg-white/10 backdrop-blur-sm text-white rounded-full px-3 py-1.5 text-sm font-medium z-10">
        {index + 1} / {images.length}
      </div>

      <div className="max-w-[90vw] max-h-[85vh] relative" onClick={e => e.stopPropagation()}>
        <img
          src={images[index]}
          alt={`Zdjęcie ${index + 1}`}
          className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
        />
      </div>

      {images.length > 1 && (
        <>
          <button
            onClick={e => { e.stopPropagation(); prev(); }}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/25 text-white rounded-full flex items-center justify-center transition-colors z-10"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={e => { e.stopPropagation(); next(); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 hover:bg-white/25 text-white rounded-full flex items-center justify-center transition-colors z-10"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}

      {images.length > 1 && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/50 backdrop-blur-sm rounded-xl px-3 py-2 max-w-[80vw] overflow-x-auto z-10"
          onClick={e => e.stopPropagation()}
        >
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => onChange(idx)}
              className={`flex-shrink-0 w-14 h-10 rounded-md overflow-hidden border-2 transition-all ${idx === index ? "border-white shadow-lg opacity-100" : "border-transparent opacity-40 hover:opacity-70"}`}
            >
              <img src={img} alt="" className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
