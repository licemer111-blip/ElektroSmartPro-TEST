"use client";

import { useState, useRef, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import {
  Camera,
  Upload,
  Trash2,
  Loader2,
  ImageIcon,
  MapPin,
  Tag,
} from "lucide-react";
import {
  uploadAndSavePhoto,
  deleteProjectPhotoRecord,
} from "@/app/dashboard/projects/[id]/photo-actions";
import type { ProjectPhoto, PhotoType, ProjectItem } from "@/lib/types/database";

const PHOTO_TYPES: { value: PhotoType; label: string; color: string }[] = [
  { value: "before", label: "Przed", color: "bg-orange-100 text-orange-700 border-orange-200" },
  { value: "after", label: "Po", color: "bg-green-100 text-green-700 border-green-200" },
  { value: "progress", label: "W trakcie", color: "bg-blue-100 text-blue-700 border-blue-200" },
  { value: "issue", label: "Problem", color: "bg-red-100 text-red-700 border-red-200" },
  { value: "detail", label: "Detal", color: "bg-purple-100 text-purple-700 border-purple-200" },
];

const LOCATION_PRESETS = [
  "Kuchnia", "Łazienka", "Salon", "Sypialnia", "Korytarz",
  "Garaż", "Piwnica", "Taras", "Rozdzielnica", "Zewnętrzne",
];

interface PhotoDocumentationDialogProps {
  projectId: string;
  photos: ProjectPhoto[];
  items?: ProjectItem[];
  supabaseUrl?: string;
}

export function PhotoDocumentationDialog({
  projectId,
  photos,
  items = [],
  supabaseUrl,
}: PhotoDocumentationDialogProps) {
  const [open, setOpen] = useState(false);
  const [isUploading, startUpload] = useTransition();
  const [selectedType, setSelectedType] = useState<PhotoType>("progress");
  const [caption, setCaption] = useState("");
  const [location, setLocation] = useState("");
  const [selectedItemId, setSelectedItemId] = useState<string>("");
  const [filterType, setFilterType] = useState<PhotoType | "all">("all");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  const getPhotoUrl = (photo: ProjectPhoto) => {
    const baseUrl = supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    return `${baseUrl}/storage/v1/object/public/project-photos/${photo.storage_path}`;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      uploadFile(file);
    }

    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadFile = (file: File) => {
    startUpload(async () => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("photo_type", selectedType);
      if (caption) formData.append("caption", caption);
      if (location) formData.append("location", location);
      if (selectedItemId) formData.append("item_id", selectedItemId);

      const result = await uploadAndSavePhoto(projectId, formData);

      if (result.error) {
        toast({ title: "Błąd", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Dodano zdjęcie", description: file.name });
        setCaption("");
        router.refresh();
      }
    });
  };

  const handleDelete = async (photoId: string) => {
    const result = await deleteProjectPhotoRecord(photoId, projectId);
    if (result.error) {
      toast({ title: "Błąd", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Usunięto zdjęcie" });
      router.refresh();
    }
  };

  const filteredPhotos = filterType === "all"
    ? photos
    : photos.filter((p) => p.photo_type === filterType);

  const getTypeInfo = (type: string) =>
    PHOTO_TYPES.find((t) => t.value === type) || PHOTO_TYPES[2];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-sky-300 dark:border-sky-700 text-sky-700 dark:text-sky-300 hover:bg-sky-50 dark:hover:bg-sky-950/30"
        >
          <Camera className="w-4 h-4" />
          <span className="hidden sm:inline text-xs">Zdjęcia</span>
          {photos.length > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 ml-1">
              {photos.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-sky-600" />
            Dokumentacja fotograficzna
          </DialogTitle>
          <DialogDescription className="text-xs">
            Dodaj zdjęcia przed, w trakcie i po wykonaniu prac
          </DialogDescription>
        </DialogHeader>

        {/* Upload area */}
        <div className="p-4 rounded-lg bg-sky-50 dark:bg-sky-950/20 border border-sky-200 dark:border-sky-800 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div className="space-y-1">
              <Label htmlFor="photo-type" className="text-[10px] text-slate-500">Typ zdjęcia</Label>
              <Select value={selectedType} onValueChange={(v) => setSelectedType(v as PhotoType)}>
                <SelectTrigger id="photo-type" className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PHOTO_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="photo-location" className="text-[10px] text-slate-500">Pomieszczenie</Label>
              <Select value={location} onValueChange={setLocation}>
                <SelectTrigger id="photo-location" className="h-8 text-xs"><SelectValue placeholder="Wybierz..." /></SelectTrigger>
                <SelectContent>
                  {LOCATION_PRESETS.map((l) => (
                    <SelectItem key={l} value={l} className="text-xs">{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 col-span-2">
              <Label htmlFor="photo-caption" className="text-[10px] text-slate-500">Opis (opcjonalnie)</Label>
              <Input
                id="photo-caption"
                name="photo-caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="np. Montaż puszek w salonie"
                className="h-8 text-xs"
              />
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="flex gap-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {isUploading ? "Przesyłanie..." : "Wybierz zdjęcia"}
            </Button>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              variant="outline"
              className="gap-2 border-sky-300"
            >
              <Camera className="w-4 h-4" />
              <span className="hidden sm:inline">Aparat</span>
            </Button>
          </div>
        </div>

        {/* Filter bar */}
        {photos.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setFilterType("all")}
              className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${
                filterType === "all"
                  ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200"
              }`}
            >
              Wszystkie ({photos.length})
            </button>
            {PHOTO_TYPES.map((t) => {
              const count = photos.filter((p) => p.photo_type === t.value).length;
              if (count === 0) return null;
              return (
                <button
                  key={t.value}
                  onClick={() => setFilterType(t.value)}
                  className={`px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${
                    filterType === t.value
                      ? "bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900"
                      : `${t.color} hover:opacity-80`
                  }`}
                >
                  {t.label} ({count})
                </button>
              );
            })}
          </div>
        )}

        {/* Photo grid */}
        {filteredPhotos.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredPhotos.map((photo) => {
              const typeInfo = getTypeInfo(photo.photo_type);
              return (
                <div
                  key={photo.id}
                  className="group relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
                >
                  <div className="aspect-square relative">
                    <img
                      src={getPhotoUrl(photo)}
                      alt={photo.caption || photo.file_name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                      <Button
                        variant="destructive"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDelete(photo.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-2 space-y-1">
                    <div className="flex items-center gap-1 flex-wrap">
                      <Badge variant="outline" className={`text-[9px] px-1 py-0 ${typeInfo.color}`}>
                        {typeInfo.label}
                      </Badge>
                      {photo.location && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0 flex items-center gap-0.5">
                          <MapPin className="w-2.5 h-2.5" />
                          {photo.location}
                        </Badge>
                      )}
                    </div>
                    {photo.caption && (
                      <p className="text-[10px] text-slate-600 dark:text-slate-400 truncate">
                        {photo.caption}
                      </p>
                    )}
                    <p className="text-[9px] text-slate-400">
                      {new Date(photo.created_at).toLocaleDateString("pl-PL", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 space-y-3">
            <ImageIcon className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600" />
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Brak zdjęć
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Dodaj zdjęcia, aby dokumentować postęp prac
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
