"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Save, Check, Package, Mic, MicOff, Loader2, MoreVertical } from "lucide-react";
import { updateProjectNotes } from "@/app/dashboard/projects/[id]/actions";
import { transcribeVoiceNote } from "@/app/dashboard/projects/[id]/voice-actions";
import { useToast } from "@/hooks/use-toast";
import { notifyDataChanged } from "@/hooks/use-synced-action";

interface ProjectNotesProps {
  projectId: string;
  initialNotes?: string | null;
  compact?: boolean;
}

export function ProjectNotes({ projectId, initialNotes, compact = false }: ProjectNotesProps) {
  const [draft, setDraft] = useState(initialNotes || "");
  const [savedNotes, setSavedNotes] = useState(initialNotes || "");
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const lastSavedValueRef = useRef<string>(initialNotes || "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const serverValue = initialNotes || "";
    setSavedNotes(serverValue);
    if (draft === lastSavedValueRef.current) {
      setDraft(serverValue);
      lastSavedValueRef.current = serverValue;
    }
  }, [initialNotes]);

  const handleSave = async () => {
    if (draft === lastSavedValueRef.current) {
      toast({ title: "Zapisano", description: "Notatki są aktualne.", duration: 2000 });
      return;
    }
    setIsSaving(true);
    try {
      const result = await updateProjectNotes(projectId, draft);
      if (result.error) {
        toast({ title: "Błąd", description: result.error, variant: "destructive" });
      } else {
        lastSavedValueRef.current = draft;
        setSavedNotes(draft);
        setLastSaved(new Date());
        notifyDataChanged("notes-changed");
        router.refresh();
        toast({ title: "Zapisano", description: "Notatki zostały zapisane.", duration: 3000 });
      }
    } catch {
      toast({ title: "Błąd", description: "Nie udało się zapisać", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const loadSavedIntoDraft = () => {
    setDraft(savedNotes);
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (e) {
      toast({
        title: "Brak dostępu do mikrofonu",
        description: "Zezwól na mikrofon w ustawieniach przeglądarki.",
        variant: "destructive",
      });
    }
  };

  const stopRecordingAndTranscribe = async () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || recorder.state === "inactive") {
      setIsRecording(false);
      return;
    }

    recorder.stop();
    mediaRecorderRef.current = null;
    setIsRecording(false);

    const chunks = chunksRef.current;
    if (!chunks.length) {
      toast({ title: "Brak nagrania", description: "Nagraj ponownie.", variant: "destructive" });
      return;
    }

    const blob = new Blob(chunks, { type: "audio/webm" });
    const formData = new FormData();
    formData.set("audio", blob, "voice.webm");

    setIsTranscribing(true);
    try {
      const result = await transcribeVoiceNote(formData);
      if (result.error) {
        toast({ title: "Błąd transkrypcji", description: result.error, variant: "destructive" });
      } else if (result.text) {
        setDraft((prev) => (prev ? `${prev} ${result.text}` : result.text || ""));
        toast({ title: "Gotowe", description: "Tekst dopisany do pola edycji. Kliknij Zapisz, aby zapisać notatkę." });
      }
    } catch (e) {
      toast({ title: "Błąd", description: "Nie udało się przetworzyć nagrania.", variant: "destructive" });
    } finally {
      setIsTranscribing(false);
    }
  };

  const toggleVoice = () => {
    if (isTranscribing) return;
    if (isRecording) {
      stopRecordingAndTranscribe();
    } else {
      startRecording();
    }
  };

  if (compact) {
    return (
      <div className="space-y-3">
        <Textarea
          ref={textareaRef}
          id={`notes-compact-${projectId}`}
          name={`notes-compact-${projectId}`}
          aria-label="Notatki projektu"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Pisz lub kliknij Dyktuj — nagraj, zatrzymaj, tekst dopisze się do pola. Zapisz, aby zapisać notatkę."
          className="min-h-[80px] resize-y text-sm"
        />
        {isRecording && (
          <div className="flex items-center gap-2 rounded-lg border-2 border-emerald-300 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 mt-2 shadow-[0_0_12px_rgba(16,185,129,0.35)]">
            <span className="inline-flex h-3 w-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">Nagrywanie... Kliknij Stop, gdy skończysz.</span>
          </div>
        )}
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Pliki i dokumenty dodawaj w zakładce <strong>Materiały do wyceny</strong>.
        </p>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white gap-1">
              <Save className="w-3.5 h-3.5" />
              Zapisz
            </Button>
            <Button
              type="button"
              size="sm"
              variant={isRecording ? "outline" : "default"}
              className={`gap-1 ${isRecording ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-400 ring-offset-2 shadow-[0_0_12px_rgba(16,185,129,0.25)]" : "bg-emerald-500 hover:bg-emerald-600 text-white border-0"}`}
              disabled={isTranscribing}
              onClick={toggleVoice}
              title={isRecording ? "Zatrzymaj i prześlij" : "Dyktuj notatkę głosowo"}
            >
              {isTranscribing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : isRecording ? (
                <MicOff className="w-3.5 h-3.5" />
              ) : (
                <Mic className="w-3.5 h-3.5" />
              )}
              {isTranscribing ? "Przetwarzanie..." : isRecording ? "Stop" : "Dyktuj"}
            </Button>
            {isSaving ? (
              <Badge variant="secondary" className="gap-1 text-xs">
                <Save className="w-3 h-3 animate-pulse" />
                Zapisywanie...
              </Badge>
            ) : lastSaved ? (
              <Badge variant="outline" className="gap-1 text-xs text-green-600 border-green-300">
                <Check className="w-3 h-3" />
                Zapisano {lastSaved.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}
              </Badge>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-slate-600 dark:text-slate-400" />
            Głosowe notatki
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white gap-1">
              <Save className="w-3.5 h-3.5" />
              Zapisz
            </Button>
            <Button
              type="button"
              size="sm"
              variant={isRecording ? "outline" : "default"}
              className={`gap-1 ${isRecording ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-400 ring-offset-2 shadow-[0_0_12px_rgba(16,185,129,0.25)]" : "bg-emerald-500 hover:bg-emerald-600 text-white border-0"}`}
              disabled={isTranscribing}
              onClick={toggleVoice}
              title={isRecording ? "Zatrzymaj i prześlij" : "Dyktuj notatkę głosowo"}
            >
              {isTranscribing ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : isRecording ? (
                <MicOff className="w-3.5 h-3.5" />
              ) : (
                <Mic className="w-3.5 h-3.5" />
              )}
              {isTranscribing ? "Przetwarzanie..." : isRecording ? "Zatrzymaj" : "Dyktuj"}
            </Button>
            {isSaving ? (
              <Badge variant="secondary" className="gap-1 text-xs">
                <Save className="w-3 h-3 animate-pulse" />
                Zapisywanie...
              </Badge>
            ) : lastSaved ? (
              <Badge variant="outline" className="gap-1 text-xs text-green-600 dark:text-green-400 border-green-300 dark:border-green-700">
                <Check className="w-3 h-3" />
                Zapisano {lastSaved.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" })}
              </Badge>
            ) : null}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Textarea
          ref={textareaRef}
          id={`notes-${projectId}`}
          name={`notes-${projectId}`}
          aria-label="Notatki projektu"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Pisz lub kliknij Dyktuj — nagraj, zatrzymaj, tekst dopisze się tutaj. Kliknij Zapisz, aby zapisać notatkę poniżej."
          className="min-h-[100px] resize-y text-sm"
        />
        {isRecording && (
          <div className="flex items-center gap-2 rounded-lg border-2 border-emerald-300 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2.5 mt-2 shadow-[0_0_12px_rgba(16,185,129,0.35)]">
            <span className="inline-flex h-3 w-3 shrink-0 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
            <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">Nagrywanie... Mów do mikrofonu. Kliknij Zatrzymaj, gdy skończysz.</span>
          </div>
        )}
        {isTranscribing && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 italic">Przetwarzanie nagrania głosowego...</p>
        )}
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
          🎤 <strong>Dyktuj</strong> — nagraj, zatrzymaj; tekst dopisze się do pola powyżej. <strong>Zapisz</strong> — zapisuje notatkę poniżej.
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
          <Package className="w-3.5 h-3.5" />
          Pliki i dokumenty (PDF, zdjęcia) dodawaj w zakładce <strong>Materiały do wyceny</strong>.
        </p>
        {savedNotes.trim() && (
          <div className="mt-4 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Zapisana notatka</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                onClick={loadSavedIntoDraft}
                title="Edytuj notatkę (przenieś do pola powyżej)"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </div>
            <div className="text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-words">
              {savedNotes}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
