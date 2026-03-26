"use client";

// ═══════════════════════════════════════════════════════════════════
// _parts/OfferSignature.tsx — E-signature modal (canvas, touch+mouse)
// IP address + timestamp are recorded server-side via saveSignature()
// ═══════════════════════════════════════════════════════════════════

import { useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, PenLine, Loader2 } from "lucide-react";

interface OfferSignatureProps {
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
  loading: boolean;
}

export function OfferSignature({ onSave, onCancel, loading }: OfferSignatureProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);

    const getPos = (e: MouseEvent | TouchEvent) => {
      const r = canvas.getBoundingClientRect();
      if ("touches" in e) {
        return { x: e.touches[0].clientX - r.left, y: e.touches[0].clientY - r.top };
      }
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    const start = (e: MouseEvent | TouchEvent) => {
      e.preventDefault();
      isDrawing.current = true;
      const { x, y } = getPos(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
    };

    const move = (e: MouseEvent | TouchEvent) => {
      if (!isDrawing.current) return;
      e.preventDefault();
      const { x, y } = getPos(e);
      ctx.lineTo(x, y);
      ctx.stroke();
    };

    const end = () => { isDrawing.current = false; };

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", move);
    canvas.addEventListener("mouseup", end);
    canvas.addEventListener("mouseleave", end);
    canvas.addEventListener("touchstart", start, { passive: false });
    canvas.addEventListener("touchmove", move, { passive: false });
    canvas.addEventListener("touchend", end);

    return () => {
      canvas.removeEventListener("mousedown", start);
      canvas.removeEventListener("mousemove", move);
      canvas.removeEventListener("mouseup", end);
      canvas.removeEventListener("mouseleave", end);
      canvas.removeEventListener("touchstart", start);
      canvas.removeEventListener("touchmove", move);
      canvas.removeEventListener("touchend", end);
    };
  }, []);

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    onSave(canvas.toDataURL("image/png"));
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-2xl bg-white dark:bg-slate-800">
        <CardContent className="p-5 space-y-4">
          <h3 className="font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <PenLine className="w-4 h-4" />
            Podpis elektroniczny
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Narysuj podpis palcem lub myszką w polu poniżej
          </p>
          <div className="border-2 border-slate-200 dark:border-slate-600 rounded-xl overflow-hidden bg-white">
            <canvas ref={canvasRef} className="w-full touch-none" style={{ height: 180 }} />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleClear} className="text-xs">
              Wyczyść
            </Button>
            <div className="flex-1" />
            <Button variant="outline" size="sm" onClick={onCancel} className="text-xs">
              Anuluj
            </Button>
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white text-xs gap-1"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              Podpisz i akceptuj
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
