"use client";

import { useState, useTransition, useRef, useCallback, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Loader2, Bug, Lightbulb, Mail, CheckCircle2, AlertCircle,
  Mic, MicOff, Paperclip, X, ImageIcon, Upload,
} from "lucide-react";
import { submitFeedback, uploadFeedbackAttachment } from "@/app/dashboard/feedback/actions";
import { useToast } from "@/hooks/use-toast";
import type { FeedbackType } from "@/lib/types/database";

interface AttachmentPreview {
  id: string;
  file: File;
  localUrl: string;
  uploadedUrl?: string;
  uploading: boolean;
  error?: string;
}

interface FeedbackFormProps {
  defaultType?: FeedbackType;
  onSuccess?: () => void;
}

interface SrResult {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: { readonly transcript: string };
}
interface SrEvent {
  readonly resultIndex: number;
  readonly results: { readonly length: number; [index: number]: SrResult };
}
interface SrInstance {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((event: SrEvent) => void) | null;
  start(): void;
  stop(): void;
}
declare global {
  interface Window {
    SpeechRecognition: new () => SrInstance;
    webkitSpeechRecognition: new () => SrInstance;
  }
}

export function FeedbackForm({ defaultType = "bug", onSuccess }: FeedbackFormProps) {
  const [type, setType] = useState<FeedbackType>(defaultType);
  const [message, setMessage] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [attachments, setAttachments] = useState<AttachmentPreview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SrInstance | null>(null);
  const interimRef = useRef<string>("");
  const { toast } = useToast();

  useEffect(() => {
    const supported = typeof window !== "undefined" &&
      ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
    setSpeechSupported(supported);
  }, []);

  const uploadFile = useCallback(async (file: File, attachmentId: string) => {
    const fd = new FormData();
    fd.append("file", file);
    const result = await uploadFeedbackAttachment(fd);
    setAttachments((prev) =>
      prev.map((a) =>
        a.id === attachmentId
          ? { ...a, uploading: false, uploadedUrl: result.url, error: result.error }
          : a
      )
    );
    if (result.error) {
      toast({ title: "Błąd przesyłania", description: result.error, variant: "destructive" });
    }
  }, [toast]);

  const addFiles = useCallback((files: FileList | File[]) => {
    const arr = Array.from(files);
    const remaining = 3 - attachments.length;
    if (remaining <= 0) {
      toast({ title: "Limit załączników", description: "Maksymalnie 3 zdjęcia.", variant: "destructive" });
      return;
    }
    const toAdd = arr.slice(0, remaining);
    const newAttachments: AttachmentPreview[] = toAdd.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      localUrl: URL.createObjectURL(file),
      uploading: true,
    }));
    setAttachments((prev) => [...prev, ...newAttachments]);
    newAttachments.forEach((a) => uploadFile(a.file, a.id));
  }, [attachments.length, toast, uploadFile]);

  const removeAttachment = useCallback((id: string) => {
    setAttachments((prev) => {
      const removed = prev.find((a) => a.id === id);
      if (removed) URL.revokeObjectURL(removed.localUrl);
      return prev.filter((a) => a.id !== id);
    });
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const toggleVoice = useCallback(() => {
    if (!speechSupported) return;

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognitionClass =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognitionClass();
    recognition.lang = "pl-PL";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognitionRef.current = recognition;
    interimRef.current = "";

    recognition.onstart = () => setIsRecording(true);

    recognition.onresult = (event: SrEvent) => {
      let interim = "";
      let finalPart = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalPart += transcript + " ";
        } else {
          interim += transcript;
        }
      }
      if (finalPart) {
        setMessage((prev) => (prev ? prev.trimEnd() + " " + finalPart.trim() : finalPart.trim()));
        interimRef.current = "";
      } else {
        interimRef.current = interim;
      }
    };

    recognition.onerror = () => {
      setIsRecording(false);
      toast({ title: "Błąd mikrofonu", description: "Nie można uzyskać dostępu do mikrofonu.", variant: "destructive" });
    };

    recognition.onend = () => setIsRecording(false);

    recognition.start();
  }, [isRecording, speechSupported, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResult(null);

    if (!message.trim()) {
      setResult({ success: false, message: "Wiadomość nie może być pusta." });
      return;
    }

    const stillUploading = attachments.some((a) => a.uploading);
    if (stillUploading) {
      setResult({ success: false, message: "Poczekaj na zakończenie przesyłania zdjęć." });
      return;
    }

    startTransition(async () => {
      const metadata = {
        page_url: typeof window !== "undefined" ? window.location.pathname : "",
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent : "",
        timestamp: new Date().toISOString(),
      };

      const attachmentUrls = attachments
        .filter((a) => a.uploadedUrl)
        .map((a) => a.uploadedUrl as string);

      const response = await submitFeedback({
        type,
        message: message.trim(),
        contactEmail: contactEmail.trim() || undefined,
        metadata,
        attachmentUrls,
      });

      if (response.success) {
        toast({
          title: "Wiadomość wysłana!",
          description: "Dziękujemy za kontakt. Odpowiemy najszybciej jak to możliwe.",
          variant: "default",
        });
        setResult({ success: true, message: "Dziękujemy za wiadomość! Odpowiemy najszybciej jak to możliwe." });
        setMessage("");
        setContactEmail("");
        setType("bug");
        attachments.forEach((a) => URL.revokeObjectURL(a.localUrl));
        setAttachments([]);
        onSuccess?.();
      } else {
        toast({
          title: "Błąd",
          description: response.error || "Nie udało się wysłać wiadomości. Spróbuj ponownie.",
          variant: "destructive",
        });
        setResult({ success: false, message: response.error || "Nie udało się wysłać wiadomości." });
      }
    });
  };

  return (
    <Card className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
      <CardHeader className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 pb-4">
        <CardTitle className="text-lg text-slate-900 dark:text-slate-100">Wyślij Wiadomość</CardTitle>
        <CardDescription className="text-sm text-slate-600 dark:text-slate-400">
          Zgłoś błąd, zaproponuj funkcję lub skontaktuj się z nami
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-5">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Feedback Type Selection */}
          <div className="space-y-2.5">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100" role="group" aria-label="Typ Wiadomości">Typ Wiadomości</p>
            <RadioGroup value={type} onValueChange={(value) => setType(value as FeedbackType)}>
              <div className="flex items-center space-x-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <RadioGroupItem value="bug" id="bug" />
                <Label htmlFor="bug" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Bug className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <div>
                    <div className="font-semibold">Zgłoszenie Błędu</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Coś nie działa? Pomóż nam to naprawić.</div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <RadioGroupItem value="feature" id="feature" />
                <Label htmlFor="feature" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Lightbulb className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                  <div>
                    <div className="font-semibold">Propozycja Funkcji</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Masz pomysł na ulepszenie? Podziel się nim!</div>
                  </div>
                </Label>
              </div>
              <div className="flex items-center space-x-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <RadioGroupItem value="contact" id="contact" />
                <Label htmlFor="contact" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Mail className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <div>
                    <div className="font-semibold">Kontakt</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Pytania ogólne, wsparcie, współpraca.</div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Message Textarea with Voice Button */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="message" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Wiadomość <span className="text-red-500">*</span>
              </Label>
              {speechSupported && (
                <button
                  type="button"
                  onClick={toggleVoice}
                  disabled={isPending}
                  title={isRecording ? "Zatrzymaj nagrywanie" : "Dyktuj wiadomość głosowo"}
                  className={[
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all",
                    isRecording
                      ? "bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 animate-pulse"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700",
                  ].join(" ")}
                >
                  {isRecording ? (
                    <><MicOff className="w-3.5 h-3.5" /> Zatrzymaj</>
                  ) : (
                    <><Mic className="w-3.5 h-3.5" /> Dyktuj</>
                  )}
                </button>
              )}
            </div>
            {isRecording && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                <span className="text-xs text-red-700 dark:text-red-300">Nagrywanie... mów po polsku</span>
              </div>
            )}
            <Textarea
              id="message"
              name="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                type === "bug"
                  ? "Opisz problem: co się stało, jakie kroki wykonałeś, jaki błąd się pojawił..."
                  : type === "feature"
                  ? "Opisz swoją propozycję: jaka funkcja, jak powinna działać, dlaczego jest potrzebna..."
                  : "Twoja wiadomość..."
              }
              rows={6}
              disabled={isPending}
              className="resize-none"
              maxLength={5000}
            />
            <div className="text-xs text-slate-500 dark:text-slate-400 text-right">
              {message.length} / 5000 znaków
            </div>
          </div>

          {/* File Attachments */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Zdjęcia / Zrzuty ekranu{" "}
                <span className="text-slate-400 font-normal">(opcjonalnie, maks. 3)</span>
              </Label>
              {attachments.length < 3 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isPending}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-orange-50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-950/50 transition-colors"
                >
                  <Paperclip className="w-3.5 h-3.5" /> Dołącz plik
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && addFiles(e.target.files)}
            />

            {/* Drop Zone (shown when no attachments) */}
            {attachments.length === 0 && (
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={[
                  "flex flex-col items-center justify-center gap-2 py-6 border-2 border-dashed rounded-xl cursor-pointer transition-colors",
                  isDragging
                    ? "border-orange-400 bg-orange-50 dark:bg-orange-950/20"
                    : "border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/30",
                ].join(" ")}
              >
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <Upload className="w-4 h-4 text-slate-400" />
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Przeciągnij zdjęcie lub kliknij, aby wybrać
                  </p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    JPG, PNG, WebP, GIF · maks. 5MB każde
                  </p>
                </div>
              </div>
            )}

            {/* Thumbnail Previews */}
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {attachments.map((a) => (
                  <div key={a.id} className="relative group w-24 h-24 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex-shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={a.localUrl}
                      alt="Załącznik"
                      className="w-full h-full object-cover"
                    />
                    {a.uploading && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-white animate-spin" />
                      </div>
                    )}
                    {a.error && (
                      <div className="absolute inset-0 bg-red-900/60 flex items-center justify-center">
                        <AlertCircle className="w-5 h-5 text-red-200" />
                      </div>
                    )}
                    {!a.uploading && !a.error && (
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                          <CheckCircle2 className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => removeAttachment(a.id)}
                      className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-black/60 hover:bg-red-600 flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                  </div>
                ))}
                {attachments.length < 3 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/20 transition-colors flex flex-col items-center justify-center gap-1 flex-shrink-0"
                  >
                    <ImageIcon className="w-5 h-5 text-slate-400" />
                    <span className="text-[10px] text-slate-400">Dodaj</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Contact Email (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="contactEmail" className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Email Kontaktowy <span className="text-slate-400 font-normal">(opcjonalnie)</span>
            </Label>
            <Input
              id="contactEmail"
              name="contactEmail"
              type="email"
              autoComplete="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="twoj@email.pl"
              disabled={isPending}
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Podaj email, jeśli chcesz otrzymać odpowiedź. Jeśli jesteś zalogowany, użyjemy Twojego konta.
            </p>
          </div>

          {/* Result Message */}
          {result && (
            <Alert
              variant={result.success ? "default" : "destructive"}
              className={
                result.success
                  ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800"
                  : ""
              }
            >
              {result.success ? (
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertDescription
                className={result.success ? "text-green-900 dark:text-green-100" : ""}
              >
                {result.message}
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isPending || !message.trim() || attachments.some((a) => a.uploading)}
            className="w-full bg-blue-600 text-white hover:bg-blue-700 shadow-sm border-transparent"
            size="lg"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Wysyłanie...
              </>
            ) : (
              <>
                <Mail className="mr-2 h-4 w-4" />
                Wyślij Wiadomość
                {attachments.filter((a) => a.uploadedUrl).length > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 text-[10px] bg-white/20 rounded-full">
                    +{attachments.filter((a) => a.uploadedUrl).length} foto
                  </span>
                )}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
