"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Mic, MicOff, Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { transcribeVoiceNote } from "@/app/dashboard/projects/[id]/voice-actions";
import { useSingleAiQuota } from "@/hooks/use-ai-quota";
import { AI_FUNCTION_NAMES } from "@/lib/ai-quota-config";
import { createClient } from "@/utils/supabase/client";

type RecordingState = "idle" | "recording" | "processing" | "error";

interface VoiceInputButtonProps {
  /** Called with the transcribed text when Whisper returns a result */
  onTranscript: (text: string) => void;
  /** Optional extra class names for the button */
  className?: string;
  /** Disabled externally (e.g. parent form is submitting) */
  disabled?: boolean;
  /** Tooltip / aria-label */
  title?: string;
}

/**
 * VoiceInputButton — one-click voice-to-text using OpenAI Whisper.
 * Records via MediaRecorder, sends to voice-actions.ts, appends transcript.
 * Visual: pulsing orange ring while recording, spinner while processing.
 * Quota: tied to transcribeVoice function (DEMO=3, PRO=100).
 */
export function VoiceInputButton({
  onTranscript,
  className,
  disabled = false,
  title = "Nagraj głosem",
}: VoiceInputButtonProps) {
  const [state, setState] = useState<RecordingState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const { info: quotaInfo, refresh: refreshQuota } = useSingleAiQuota(
    userId,
    AI_FUNCTION_NAMES.transcribeVoice
  );

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startRecording = useCallback(async () => {
    setErrorMsg(null);

    if (quotaInfo?.isExhausted) {
      setErrorMsg("Limit transkrypcji wyczerpany");
      setState("error");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Prefer webm/opus, fallback to whatever browser supports
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "";

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        setState("processing");
        try {
          const blob = new Blob(chunksRef.current, {
            type: mimeType || "audio/webm",
          });

          const formData = new FormData();
          formData.append("audio", blob, "voice.webm");

          const result = await transcribeVoiceNote(formData);

          if (result.error) {
            setErrorMsg(result.error);
            setState("error");
          } else if (result.text) {
            onTranscript(result.text);
            void refreshQuota();
            setState("idle");
          } else {
            setErrorMsg("Nie rozpoznano mowy");
            setState("error");
          }
        } catch {
          setErrorMsg("Błąd transkrypcji");
          setState("error");
        }
      };

      recorder.start(250); // collect chunks every 250ms
      setState("recording");
    } catch (err) {
      const msg =
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Brak dostępu do mikrofonu — zezwól w ustawieniach przeglądarki"
          : "Nie można uruchomić mikrofonu";
      setErrorMsg(msg);
      setState("error");
    }
  }, [quotaInfo, onTranscript, refreshQuota]);

  const handleClick = useCallback(() => {
    if (state === "recording") {
      stopRecording();
    } else if (state === "idle" || state === "error") {
      setState("idle");
      setErrorMsg(null);
      void startRecording();
    }
  }, [state, stopRecording, startRecording]);

  const isDisabled =
    disabled || state === "processing" || quotaInfo?.isExhausted === true;

  const tooltipText = quotaInfo?.isExhausted
    ? `Limit transkrypcji wyczerpany (${quotaInfo.used}/${quotaInfo.limit})`
    : state === "recording"
    ? "Kliknij, aby zatrzymać nagrywanie"
    : state === "processing"
    ? "Przetwarzanie..."
    : title;

  return (
    <div className="relative inline-flex flex-col items-center gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={isDisabled}
        title={tooltipText}
        aria-label={tooltipText}
        className={cn(
          "relative flex items-center justify-center rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500",
          "w-8 h-8 border-2",
          // Idle
          state === "idle" &&
            !isDisabled &&
            "border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:border-orange-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-950/30",
          // Recording — pulsing orange ring
          state === "recording" &&
            "border-orange-500 bg-orange-500 text-white shadow-lg shadow-orange-500/40 animate-pulse",
          // Processing
          state === "processing" &&
            "border-amber-400 bg-amber-50 dark:bg-amber-950/30 text-amber-600 cursor-wait",
          // Error
          state === "error" &&
            "border-red-400 bg-red-50 dark:bg-red-950/30 text-red-500",
          // Disabled / exhausted
          isDisabled && state !== "recording" && state !== "processing" &&
            "opacity-40 cursor-not-allowed",
          className
        )}
      >
        {state === "processing" ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : state === "error" ? (
          <AlertCircle className="w-3.5 h-3.5" />
        ) : state === "recording" ? (
          <MicOff className="w-3.5 h-3.5" />
        ) : (
          <Mic className="w-3.5 h-3.5" />
        )}

        {/* Outer pulse ring while recording */}
        {state === "recording" && (
          <span className="absolute inset-0 rounded-full border-2 border-orange-400 animate-ping opacity-60" />
        )}
      </button>

      {/* Quota badge — shown when low or exhausted */}
      {quotaInfo && !quotaInfo.isPro && (
        <span
          className={cn(
            "text-[9px] font-medium leading-none",
            quotaInfo.isExhausted
              ? "text-red-500"
              : quotaInfo.isLow
              ? "text-amber-500"
              : "text-slate-400"
          )}
        >
          {quotaInfo.used}/{quotaInfo.limit}
        </span>
      )}

      {/* Inline error tooltip */}
      {state === "error" && errorMsg && (
        <div className="absolute bottom-full mb-1.5 left-1/2 -translate-x-1/2 z-50 w-max max-w-[200px] px-2 py-1 rounded-md bg-red-600 text-white text-[10px] text-center shadow-lg whitespace-normal">
          {errorMsg}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-red-600" />
        </div>
      )}
    </div>
  );
}
