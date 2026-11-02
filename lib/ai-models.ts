/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║         CENTRAL AI MODEL CONFIGURATION                  ║
 * ║                                                          ║
 * ║  Все модели проекта — в одном месте.                    ║
 * ║  Когда Google/OpenAI меняет модели — правишь ТОЛЬКО     ║
 * ║  этот файл. Весь проект подхватывает автоматически.     ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * Тир 1 — Сложные задачи (vision, blueprint, schemat, validator):
 *   gemini-3.5-flash  (gemini-2.0-flash выключен Google 1 июня 2026)
 *
 * Тир 2 — Стандартные задачи (estimation, RAG, pricing, chat):
 *   gemini-3.5-flash
 *
 * Whisper — голосовой ввод (OpenAI, raw fetch):
 *   whisper-1  (stable alias — не менялся годами)
 *
 * КАК ОБНОВИТЬ: когда выходит новая модель, меняешь строку ниже —
 * и все ~15 файлов проекта сразу используют новую версию.
 * Или без редеплоя: установи AI_MODEL_TIER1_OVERRIDE в Vercel env vars.
 */

// ─── Tier 1: Complex / Vision / Structured tasks ──────────────────────────────
// Used by: blueprint, schemat, document-assistant, excel-analyze,
//          ai-validator (admin/market), ai-import, ai-core (vision),
//          duplicate-detect, clean-przedmiar, ai-lab importer
//
// gemini-2.0-flash was shut down by Google on 1 June 2026.
// To upgrade without redeployment: set AI_MODEL_TIER1_OVERRIDE in Vercel env vars.
export const AI_MODEL_TIER1 =
  process.env.AI_MODEL_TIER1_OVERRIDE ?? "gemini-3.5-flash";

// ─── Tier 2: RAG / Estimation / Chat tasks ────────────────────────────────────
// Used by: ai-actions (pricing, categorize, estimate),
//          ai-lab (RAG chunks), hybrid-ai (chat), panel generator,
//          knowledge-base (KB_MODEL), ai-master-brain (GEMINI_RAG_MODEL)
export const AI_MODEL_TIER2 = "gemini-3.5-flash";

// ─── Voice (OpenAI Whisper) ───────────────────────────────────────────────────
// Used by: voice-actions.ts (transcribeVoiceNote)
export const AI_MODEL_WHISPER = "whisper-1";
