"use client";

// ═══════════════════════════════════════════════════════════════════
// _parts/PortfolioSection.tsx — Premium portfolio gallery with lightbox
// ═══════════════════════════════════════════════════════════════════

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Camera, Star, MapPin, Calendar, ChevronLeft, ChevronRight, X, Image as ImageIcon } from "lucide-react";

interface PortfolioItem {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  completion_date: string | null;
  category: string;
  images: string[];
}

// ── Lightbox ──────────────────────────────────────────────────────

function ImageLightbox({
  images,
  initialIndex,
  title,
  onClose,
}: {
  images: string[];
  initialIndex: number;
  title: string;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(initialIndex);

  const goPrev = useCallback(() => setIdx((i) => (i > 0 ? i - 1 : images.length - 1)), [images.length]);
  const goNext = useCallback(() => setIdx((i) => (i < images.length - 1 ? i + 1 : 0)), [images.length]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose, goPrev, goNext]);

  return (
    <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold truncate max-w-[200px] sm:max-w-none">{title}</span>
          <span className="text-xs text-white/60">{idx + 1} / {images.length}</span>
        </div>
        <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-2 relative min-h-0">
        <Image
          src={images[idx]}
          alt={`${title} — ${idx + 1}`}
          width={1200}
          height={900}
          unoptimized
          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
        />
        {images.length > 1 && (
          <>
            <button
              onClick={goPrev}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-sm text-white transition-all"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button
              onClick={goNext}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 p-2 sm:p-3 rounded-full bg-white/10 hover:bg-white/25 backdrop-blur-sm text-white transition-all"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </>
        )}
      </div>

      {images.length > 1 && (
        <div className="flex items-center justify-center gap-2 px-4 py-3 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`flex-shrink-0 w-16 h-12 sm:w-20 sm:h-14 rounded-lg overflow-hidden border-2 transition-all ${
                i === idx ? "border-white shadow-lg scale-105" : "border-transparent opacity-50 hover:opacity-80"
              }`}
            >
              <Image src={img} alt="" width={80} height={56} unoptimized className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Portfolio Section ─────────────────────────────────────────────

const BG_PATTERN =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE4YzEuNjU2IDAgMyAxLjM0NCAzIDN2MWMwIDEuNjU2LTEuMzQ0IDMtMyAzaC0xYy0xLjY1NiAwLTMtMS4zNDQtMy0zdi0xYzAtMS42NTYgMS4zNDQtMyAzLTNoMXptLTEyIDBjMS42NTYgMCAzIDEuMzQ0IDMgM3YxYzAgMS42NTYtMS4zNDQgMy0zIDNoLTFjLTEuNjU2IDAtMy0xLjM0NC0zLTN2LTFjMC0xLjY1NiAxLjM0NC0zIDMtM2gxeiIvPjwvZz48L2c+PC9zdmc+";

export function PortfolioSection({ items, companyName }: { items: PortfolioItem[]; companyName: string }) {
  const [lightbox, setLightbox] = useState<{ images: string[]; index: number; title: string } | null>(null);
  const [activeCards, setActiveCards] = useState<Record<string, number>>({});
  const totalPhotos = items.reduce((s, i) => s + i.images.length, 0);

  const setCardImage = (itemId: string, idx: number) =>
    setActiveCards((prev) => ({ ...prev, [itemId]: idx }));

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 text-white p-6 sm:p-8 shadow-xl">
          <div
            className="absolute inset-0 opacity-40"
            style={{ backgroundImage: `url('${BG_PATTERN}')` }}
          />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm">
                <Award className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold tracking-tight">Nasze realizacje</h2>
                <p className="text-blue-200 text-xs sm:text-sm mt-0.5">{companyName} — portfolio wykonanych prac</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 mt-4">
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5">
                <Camera className="w-3.5 h-3.5 text-blue-300" />
                <span className="text-xs font-medium">
                  {items.length}{" "}
                  {items.length === 1 ? "projekt" : items.length < 5 ? "projekty" : "projektów"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-blue-300" />
                <span className="text-xs font-medium">{totalPhotos} zdjęć</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-full px-3 py-1.5">
                <Star className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-xs font-medium">Sprawdzony wykonawca</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 gap-4">
          {items.map((item) => {
            const activeIdx = activeCards[item.id] || 0;
            const activeImage = item.images[activeIdx] || item.images[0];
            return (
              <Card key={item.id} className="border-0 shadow-lg bg-white dark:bg-slate-800/80 overflow-hidden">
                <div className="sm:flex">
                  {item.images.length > 0 && (
                    <div className="sm:w-80 flex-shrink-0">
                      <button
                        onClick={() =>
                          setLightbox({ images: item.images, index: activeIdx, title: item.title })
                        }
                        className="relative w-full h-52 sm:h-full overflow-hidden cursor-zoom-in group block"
                      >
                        <Image
                          src={activeImage}
                          alt={item.title}
                          fill
                          unoptimized
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-sm text-white rounded-lg px-2 py-1 text-[10px] font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <ImageIcon className="w-3 h-3" />
                          Powiększ
                        </div>
                        {item.images.length > 1 && (
                          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white rounded-full px-2 py-0.5 text-[10px] font-medium">
                            {activeIdx + 1}/{item.images.length}
                          </div>
                        )}
                      </button>
                      {item.images.length > 1 && (
                        <div className="flex gap-1 p-2 bg-slate-50 dark:bg-slate-900/50 overflow-x-auto">
                          {item.images.map((img, imgIdx) => (
                            <button
                              key={imgIdx}
                              onClick={() => setCardImage(item.id, imgIdx)}
                              className={`flex-shrink-0 w-14 h-10 rounded-md overflow-hidden border-2 transition-all ${
                                imgIdx === activeIdx
                                  ? "border-blue-500 shadow-md"
                                  : "border-transparent opacity-60 hover:opacity-100"
                              }`}
                            >
                              <Image src={img} alt="" fill unoptimized className="object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex-1 p-4 sm:p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                          {item.title}
                        </h3>
                        <Badge className="text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-0 shrink-0">
                          {item.category}
                        </Badge>
                      </div>
                      {item.description && (
                        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                          {item.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center flex-wrap gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                      {item.location && (
                        <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <MapPin className="w-3.5 h-3.5 text-blue-500" />
                          {item.location}
                        </span>
                      )}
                      {item.completion_date && (
                        <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <Calendar className="w-3.5 h-3.5 text-blue-500" />
                          {new Date(item.completion_date).toLocaleDateString("pl-PL", {
                            year: "numeric",
                            month: "long",
                          })}
                        </span>
                      )}
                      {item.images.length > 1 && (
                        <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <Camera className="w-3.5 h-3.5 text-blue-500" />
                          {item.images.length} zdjęć
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {lightbox && (
        <ImageLightbox
          images={lightbox.images}
          initialIndex={lightbox.index}
          title={lightbox.title}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
}
