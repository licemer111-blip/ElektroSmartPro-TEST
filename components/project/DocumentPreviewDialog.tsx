"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  Image as ImageIcon,
  ExternalLink,
  Loader2,
  ZoomIn,
  ZoomOut,
  Pencil,
  Square,
  Eraser,
  RotateCcw,
  Move,
  FileSpreadsheet,
  File,
  Download,
} from "lucide-react";
import type { ProjectDocument } from "@/app/dashboard/projects/[id]/document-actions";

type DrawingTool = "pan" | "pen" | "rectangle" | "eraser";

interface DocumentPreviewDialogProps {
  doc: ProjectDocument | null;
  projectId: string;
  previewUrl: string | null;
  pdfBlobUrl: string | null;
  spreadsheetData: string[][] | null;
  textContent: string | null;
  previewLoading: boolean;
  onClose: () => void;
}

const isPdf = (name: string) => /\.pdf$/i.test(name);
const isImage = (name: string) => /\.(jpg|jpeg|png|webp)$/i.test(name);
const isSpreadsheet = (name: string) => /\.(xlsx|xls|csv)$/i.test(name);
const isText = (name: string) => /\.txt$/i.test(name);

export function DocumentPreviewDialog({
  doc,
  projectId,
  previewUrl,
  pdfBlobUrl,
  spreadsheetData,
  textContent,
  previewLoading,
  onClose,
}: DocumentPreviewDialogProps) {
  const [zoom, setZoom] = useState(100);
  const [tool, setTool] = useState<DrawingTool>("pan");
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Reset state when opening new document
  useEffect(() => {
    if (doc) {
      setZoom(100);
      setTool("pan");
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [doc]);

  // Ctrl+Wheel zoom for images
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !doc || isPdf(doc.name)) return;
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        e.stopPropagation();
        setZoom(prev => e.deltaY < 0 ? Math.min(prev + 15, 400) : Math.max(prev - 15, 25));
      }
    };
    container.addEventListener("wheel", handleWheel, { passive: false });
    return () => container.removeEventListener("wheel", handleWheel);
  }, [doc]);

  const getCanvasPos = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const handleImageLoad = () => {
    const img = imageRef.current;
    const canvas = canvasRef.current;
    if (img && canvas) {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
    }
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (tool === "pan") return;
    setIsDrawing(true);
    const pos = getCanvasPos(e);
    setDrawStart(pos);
    if (tool === "pen" || tool === "eraser") {
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) { ctx.beginPath(); ctx.moveTo(pos.x, pos.y); }
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || tool === "pan") return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    const pos = getCanvasPos(e);
    if (tool === "pen") {
      ctx.lineWidth = 4; ctx.lineCap = "round"; ctx.strokeStyle = "#ff0000";
      ctx.lineTo(pos.x, pos.y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(pos.x, pos.y);
    } else if (tool === "eraser") {
      ctx.lineWidth = 25; ctx.lineCap = "round"; ctx.globalCompositeOperation = "destination-out";
      ctx.lineTo(pos.x, pos.y); ctx.stroke(); ctx.beginPath(); ctx.moveTo(pos.x, pos.y);
      ctx.globalCompositeOperation = "source-over";
    }
  };

  const handleCanvasMouseUp = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    if (tool === "rectangle") {
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) {
        const pos = getCanvasPos(e);
        ctx.strokeStyle = "#ff0000"; ctx.lineWidth = 4;
        ctx.strokeRect(drawStart.x, drawStart.y, pos.x - drawStart.x, pos.y - drawStart.y);
      }
    }
    setIsDrawing(false);
  };

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const openInNewTab = () => {
    if (previewUrl) window.open(previewUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <Dialog
      open={!!doc}
      onOpenChange={(open) => { if (!open) onClose(); }}
    >
      <DialogContent className="max-w-[95vw] w-full h-[95vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-4 py-3 border-b flex-row items-center justify-between gap-4 shrink-0">
          <DialogTitle className="text-sm font-semibold truncate">{doc?.name ?? ""}</DialogTitle>
          <DialogDescription className="sr-only">Podgląd dokumentu projektu</DialogDescription>

          {doc && isImage(doc.name) && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.max(z - 25, 25))} className="h-8 w-8" title="Pomniejsz" aria-label="Pomniejsz">
                <ZoomOut className="h-4 w-4" />
              </Button>
              <span className="text-xs font-medium w-12 text-center">{zoom}%</span>
              <Button variant="outline" size="icon" onClick={() => setZoom(z => Math.min(z + 25, 400))} className="h-8 w-8" title="Powiększ" aria-label="Powiększ">
                <ZoomIn className="h-4 w-4" />
              </Button>
              <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />
              {(["pan", "pen", "rectangle", "eraser"] as DrawingTool[]).map((t) => (
                <Button key={t} variant={tool === t ? "default" : "outline"} size="icon" onClick={() => setTool(t)} className="h-8 w-8"
                  title={{ pan: "Przeciąganie", pen: "Rysowanie", rectangle: "Prostokąt", eraser: "Gumka" }[t]}
                  aria-label={{ pan: "Przeciąganie", pen: "Rysowanie", rectangle: "Prostokąt", eraser: "Gumka" }[t]}
                >
                  {t === "pan" && <Move className="h-4 w-4" />}
                  {t === "pen" && <Pencil className="h-4 w-4" />}
                  {t === "rectangle" && <Square className="h-4 w-4" />}
                  {t === "eraser" && <Eraser className="h-4 w-4" />}
                </Button>
              ))}
              <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />
              <Button variant="outline" size="sm" onClick={handleClearCanvas} className="h-8 text-xs">Wyczyść</Button>
              <Button variant="outline" size="sm" onClick={() => setZoom(100)} className="h-8 text-xs gap-1">
                <RotateCcw className="h-3 w-3" />Reset
              </Button>
            </div>
          )}
        </DialogHeader>

        <div ref={containerRef} className="flex-1 min-h-0 overflow-auto bg-slate-200 dark:bg-slate-800">
          {previewLoading || !previewUrl ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-10 h-10 animate-spin text-slate-400" />
            </div>
          ) : doc ? (
            <>
              {isPdf(doc.name) ? (
                pdfBlobUrl ? (
                  <iframe src={pdfBlobUrl + "#toolbar=1&navpanes=1&scrollbar=1"} className="w-full h-full border-0" title={doc.name} />
                ) : (
                  <div className="flex items-center justify-center h-full"><Loader2 className="w-10 h-10 animate-spin text-slate-400" /></div>
                )
              ) : isImage(doc.name) ? (
                <div className="min-w-full min-h-full flex items-start justify-start p-4" style={{ cursor: tool === "pan" ? "grab" : "crosshair" }}>
                  <div className="relative inline-block origin-top-left" style={{ transform: `scale(${zoom / 100})` }}>
                    <img ref={imageRef} src={previewUrl} alt={doc.name} className="max-w-none" onLoad={handleImageLoad} draggable={false} />
                    <canvas
                      ref={canvasRef}
                      className="absolute top-0 left-0 w-full h-full"
                      style={{ pointerEvents: tool === "pan" ? "none" : "auto" }}
                      onMouseDown={handleCanvasMouseDown}
                      onMouseMove={handleCanvasMouseMove}
                      onMouseUp={handleCanvasMouseUp}
                      onMouseLeave={handleCanvasMouseUp}
                    />
                  </div>
                </div>
              ) : isSpreadsheet(doc.name) ? (
                spreadsheetData ? (
                  <div className="w-full h-full overflow-auto p-4">
                    <table className="w-full border-collapse text-sm">
                      <tbody>
                        {spreadsheetData.slice(0, 500).map((row, rowIdx) => (
                          <tr key={rowIdx} className={rowIdx === 0 ? "bg-slate-100 dark:bg-slate-800 font-semibold sticky top-0" : rowIdx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50 dark:bg-slate-800/50"}>
                            {(row || []).map((cell, cellIdx) => (
                              <td key={cellIdx} className="border border-slate-200 dark:border-slate-700 px-3 py-2 whitespace-nowrap max-w-xs truncate" title={String(cell ?? "")}>
                                {String(cell ?? "")}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {spreadsheetData.length > 500 && (
                      <p className="text-center text-sm text-muted-foreground mt-4">Pokazano pierwsze 500 wierszy z {spreadsheetData.length}</p>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
                    <FileSpreadsheet className="w-24 h-24 text-green-600" />
                    <div className="text-center max-w-md">
                      <h3 className="text-lg font-semibold mb-2">Plik Excel/CSV</h3>
                      <p className="text-muted-foreground mb-4">Nie udało się wyświetlić podglądu. Pobierz plik, aby go otworzyć w programie Excel.</p>
                      <Button onClick={openInNewTab} className="gap-2 bg-green-600 hover:bg-green-700 text-white"><Download className="w-4 h-4" />Pobierz plik</Button>
                    </div>
                  </div>
                )
              ) : isText(doc.name) ? (
                textContent !== null ? (
                  <div className="w-full h-full overflow-auto p-4">
                    <pre className="text-sm font-mono whitespace-pre-wrap break-words bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border">{textContent}</pre>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
                    <FileText className="w-24 h-24 text-slate-500" />
                    <div className="text-center max-w-md">
                      <h3 className="text-lg font-semibold mb-2">Plik tekstowy</h3>
                      <p className="text-muted-foreground mb-4">Nie udało się wyświetlić podglądu. Pobierz plik.</p>
                      <Button onClick={openInNewTab} className="gap-2"><Download className="w-4 h-4" />Pobierz plik</Button>
                    </div>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-6 p-8">
                  <File className="w-24 h-24 text-slate-500" />
                  <div className="text-center max-w-md">
                    <h3 className="text-lg font-semibold mb-2">{doc.name}</h3>
                    <p className="text-muted-foreground mb-4">Podgląd tego typu pliku nie jest dostępny.</p>
                    <Button onClick={openInNewTab} className="gap-2"><Download className="w-4 h-4" />Pobierz plik</Button>
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        <DialogFooter className="px-4 py-3 border-t gap-2 shrink-0">
          {doc && isImage(doc.name) && (
            <p className="text-xs text-muted-foreground mr-auto">💡 Ctrl + kółko = zoom | Tryb &quot;Przeciąganie&quot; = scroll | Narzędzia rysowania = zaznaczanie</p>
          )}
          {doc && isPdf(doc.name) && (
            <p className="text-xs text-muted-foreground mr-auto">💡 Kliknij <strong>ES Import</strong>, aby wyciągnąć pozycje do kosztorysu</p>
          )}
          {doc && isSpreadsheet(doc.name) && (
            <p className="text-xs text-muted-foreground mr-auto">💡 Kliknij <strong>ES Import</strong>, aby przeanalizować dane i dodać do kosztorysu</p>
          )}
          {doc && isText(doc.name) && (
            <p className="text-xs text-muted-foreground mr-auto">💡 Plik tekstowy — możesz skopiować zawartość lub pobrać</p>
          )}
          <Button variant="outline" onClick={onClose}>Zamknij</Button>
          {(isSpreadsheet(doc?.name || "") || isText(doc?.name || "")) && (
            <Button onClick={openInNewTab} variant="outline" className="gap-2">
              <Download className="w-4 h-4" />Pobierz
            </Button>
          )}
          <Button onClick={openInNewTab} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
            <ExternalLink className="w-4 h-4" />Otwórz w nowej karcie
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
