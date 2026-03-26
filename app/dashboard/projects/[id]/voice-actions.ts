"use server";

import { logger } from "@/lib/logger";
import { checkAndIncrementAiUsage } from "@/lib/ai-usage";
import { AI_FUNCTION_NAMES } from "@/lib/ai-quota-config";

/**
 * Transcribe audio blob via OpenAI Whisper (raw fetch — no openai package needed).
 * Accepts FormData with "audio" file (webm, mp3, etc.).
 */
export async function transcribeVoiceNote(
  formData: FormData
): Promise<{ text?: string; error?: string }> {
  // AI usage limit for demo users
  const { createClient } = await import("@/utils/supabase/server");
  const _sb = await createClient();
  const { data: { user: _u } } = await _sb.auth.getUser();
  if (_u) {
    const aiCheck = await checkAndIncrementAiUsage(_u.id, AI_FUNCTION_NAMES.transcribeVoice);
    if (!aiCheck.allowed) return { error: aiCheck.error || "Limit AI wyczerpany" };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { error: "Brak klucza OPENAI_API_KEY. Ustaw go w ustawieniach projektu." };
  }

  const file = formData.get("audio") as File | null;
  if (!file?.size) {
    return { error: "Brak pliku audio." };
  }

  const maxMb = 25;
  if (file.size > maxMb * 1024 * 1024) {
    return { error: `Plik za duży (maks. ${maxMb} MB).` };
  }

  try {
    const body = new FormData();
    body.append("file", file);
    body.append("model", "whisper-1");
    body.append("language", "pl");
    body.append("response_format", "text");

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body,
    });

    if (!response.ok) {
      const errBody = await response.text();
      logger.error("[Whisper] API error", { status: response.status }, errBody);
      return { error: `Błąd Whisper API: ${response.status}` };
    }

    const text = await response.text();
    if (!text?.trim()) {
      return { error: "Nie rozpoznano mowy. Mów wyraźnie do mikrofonu." };
    }
    return { text: text.trim() };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Błąd transkrypcji";
    logger.error("[Whisper]", {}, err);
    return { error: message };
  }
}
