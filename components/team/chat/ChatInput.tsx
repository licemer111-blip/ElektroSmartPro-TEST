"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Send, Loader2, Paperclip, X, FileText, File,
  Image as ImageIcon, Eye, Upload,
} from "lucide-react";
import { formatFileSize } from "@/lib/chat-utils";

interface ChatInputProps {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onFileSelect: (file: File) => void;
  onRemoveFile: () => void;
  onPreviewFile: (file: File) => void;
  selectedFile: File | null;
  sending: boolean;
  uploading: boolean;
}

export function ChatInput({
  value,
  onChange,
  onSend,
  onFileSelect,
  onRemoveFile,
  onPreviewFile,
  selectedFile,
  sending,
  uploading,
}: ChatInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
    // reset so same file can be re-selected
    e.target.value = "";
  };

  return (
    <div className="mt-4 pt-4 border-t space-y-2">
      {/* Selected file preview */}
      {selectedFile && (
        <div className="rounded-lg border-2 border-dashed border-blue-400 dark:border-blue-600 bg-blue-50/50 dark:bg-blue-950/20">
          <div className="px-3 pt-2 pb-1 flex items-center gap-1.5">
            <Upload className="w-3 h-3 text-blue-500" />
            <span className="text-[10px] font-semibold text-blue-500 uppercase tracking-wide">
              {uploading ? "Przesyłanie..." : "Załącznik — kliknij ▶ aby wysłać"}
            </span>
          </div>
          <div className="px-3 pb-2.5 flex items-center gap-2.5">
            {/* File type icon */}
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              selectedFile.type.startsWith("image/")
                ? "bg-green-500/15 text-green-500"
                : selectedFile.type === "application/pdf"
                  ? "bg-red-500/15 text-red-500"
                  : "bg-blue-500/15 text-blue-500"
            }`}>
              {selectedFile.type.startsWith("image/") ? (
                <ImageIcon className="w-5 h-5" />
              ) : selectedFile.type === "application/pdf" ? (
                <FileText className="w-5 h-5" />
              ) : (
                <File className="w-5 h-5" />
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="text-sm font-medium truncate">{selectedFile.name}</div>
              <div className="text-xs text-muted-foreground flex items-center gap-2">
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  selectedFile.type === "application/pdf"
                    ? "bg-red-500/15 text-red-500"
                    : selectedFile.type.startsWith("image/")
                      ? "bg-green-500/15 text-green-500"
                      : "bg-blue-500/15 text-blue-500"
                }`}>
                  {selectedFile.name.split(".").pop()?.toUpperCase() || "FILE"}
                </span>
                <span>{formatFileSize(selectedFile.size)}</span>
              </div>
            </div>

            {/* Image thumbnail */}
            {selectedFile.type.startsWith("image/") && (
              <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 border border-slate-200 dark:border-slate-700">
                <img
                  src={URL.createObjectURL(selectedFile)}
                  alt="podgląd"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Preview button */}
            <Button
              variant="ghost" size="sm"
              className="h-8 w-8 p-0 text-blue-500 hover:text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30"
              onClick={() => onPreviewFile(selectedFile)}
              title="Podgląd pliku"
            >
              <Eye className="w-4 h-4" />
            </Button>

            {/* Remove button */}
            <Button
              variant="ghost" size="sm"
              className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
              onClick={onRemoveFile}
              title="Usuń załącznik"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Input row */}
      <div className="flex gap-2">
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
        />
        <Button
          variant="outline" size="sm" className="px-2"
          onClick={() => fileInputRef.current?.click()}
          disabled={sending}
          title="Dodaj załącznik"
        >
          <Paperclip className="w-4 h-4" />
        </Button>

        <Input
          id="team-chat-input"
          name="team-chat-input"
          aria-label="Napisz wiadomość"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Napisz wiadomość..."
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          disabled={sending}
          className="flex-1"
        />

        <Button
          onClick={onSend}
          disabled={sending || (!value.trim() && !selectedFile)}
          className={`text-white min-w-[40px] ${
            selectedFile && !sending
              ? "bg-green-600 hover:bg-green-700"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
          title={selectedFile ? "Wyślij z załącznikiem" : "Wyślij wiadomość"}
        >
          {uploading ? (
            <div className="flex items-center gap-1.5">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs hidden sm:inline">Przesyłanie...</span>
            </div>
          ) : sending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : selectedFile ? (
            <div className="flex items-center gap-1.5">
              <Send className="w-4 h-4" />
              <span className="text-xs hidden sm:inline">Wyślij</span>
            </div>
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
