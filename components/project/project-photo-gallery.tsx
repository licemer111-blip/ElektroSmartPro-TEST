"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Camera, Upload, Loader2, Trash2, ZoomIn, X, ImageIcon,
  Download, Plus,
} from "lucide-react";
import { uploadProjectPhotoFile, listProjectPhotos } from "@/app/dashboard/projects/[id]/photo-actions";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface ProjectPhotoGalleryProps {
  projectId: string;
  /** URLs already attached to the project (parsed from notes or a dedicated field) */
  existingPhotos?: string[];
}

export function ProjectPhotoGallery({ projectId, existingPhotos = [] }: ProjectPhotoGalleryProps) {
  const [photos, setPhotos] = useState<string[]>(existingPhotos);
  const [uploading, setUploading] = useState(false);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  // Load existing photos from Supabase Storage on mount
  useEffect(() => {
    let cancelled = false;
    setLoadingPhotos(true);
    listProjectPhotos(projectId).then(({ urls, error }) => {
      if (cancelled) return;
      if (!error && urls.length > 0) {
        setPhotos(urls);
      }
      setLoadingPhotos(false);
    });
    return () => { cancelled = true; };
  }, [projectId]);

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    const newPhotos: string[] = [];

    for (let i = 0; i < Math.min(files.length, 10); i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("file", file);

      try {
        const result = await uploadProjectPhotoFile(projectId, formData);
        if (result.success && result.imageUrl) {
          newPhotos.push(result.imageUrl);
        } else {
          toast({
            title: "Błąd",
            description: result.error || `Nie udało się przesłać: ${file.name}`,
            variant: "destructive",
          });
        }
      } catch {
        toast({
          title: "Błąd",
          description: `Nie udało się przesłać: ${file.name}`,
          variant: "destructive",
        });
      }
    }

    if (newPhotos.length > 0) {
      setPhotos((prev) => [...prev, ...newPhotos]);
      toast({
        title: "Przesłano!",
        description: `Dodano ${newPhotos.length} zdjęć`,
      });
      router.refresh();
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [projectId, toast, router]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Camera className="w-5 h-5 text-blue-600" />
            Dokumentacja zdjęciowa
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Dodawaj zdjęcia z placu budowy, istniejącej instalacji, tablicy rozdzielczej itp.
          </p>
        </div>
        <Badge variant="secondary" className="text-xs">
          {photos.length} zdjęć
        </Badge>
      </div>

      {/* Upload zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        className="border-2 border-dashed border-blue-200 dark:border-blue-800 rounded-xl p-6 text-center bg-blue-50/30 dark:bg-blue-950/10 hover:bg-blue-50/60 dark:hover:bg-blue-950/20 transition-colors cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="hidden"
          onChange={(e) => handleFileSelect(e.target.files)}
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            <p className="text-sm font-medium">Przesyłanie zdjęć...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
              <Upload className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <p className="text-sm font-medium">Przeciągnij zdjęcia lub kliknij, aby wybrać</p>
            <p className="text-xs text-muted-foreground">JPG, PNG, WEBP, GIF · Maks. 10 MB na plik</p>
          </div>
        )}
      </div>

      {/* Photo grid */}
      {photos.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {photos.map((url, index) => (
            <div
              key={index}
              className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 cursor-pointer hover:shadow-lg transition-all"
              onClick={() => setSelectedPhoto(url)}
            >
              <img
                src={url}
                alt={`Zdjęcie projektu ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="absolute bottom-1 left-1">
                <Badge className="text-[9px] bg-black/50 text-white border-0">
                  #{index + 1}
                </Badge>
              </div>
            </div>
          ))}

          {/* Add more button */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-blue-400 hover:text-blue-600 transition-colors"
          >
            <Plus className="w-6 h-6" />
            <span className="text-[10px]">Dodaj</span>
          </button>
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-20" />
          <p className="text-sm">Brak zdjęć</p>
          <p className="text-xs mt-1">Dodaj zdjęcia z placu budowy do dokumentacji projektu</p>
        </div>
      )}

      {/* Lightbox dialog */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="w-[95vw] sm:max-w-3xl p-2">
          <DialogHeader className="sr-only">
            <DialogTitle>Podgląd zdjęcia</DialogTitle>
            <DialogDescription>Powiększony podgląd zdjęcia projektu</DialogDescription>
          </DialogHeader>
          {selectedPhoto && (
            <div className="relative">
              <img
                src={selectedPhoto}
                alt="Podgląd zdjęcia"
                className="w-full h-auto max-h-[75vh] object-contain rounded-lg"
              />
              <div className="absolute top-2 left-2 flex gap-1">
                <a
                  href={selectedPhoto}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-white hover:bg-black/70 transition-colors"
                  title="Pobierz"
                >
                  <Download className="w-4 h-4" />
                </a>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
