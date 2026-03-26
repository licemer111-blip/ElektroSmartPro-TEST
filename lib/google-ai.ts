import { GoogleGenAI } from "@google/genai";

// Model name for Knowledge Base — confirmed to support createCachedContent
// (gemini-1.5-pro is NOT available on this API key's tier)
export const KB_MODEL = "gemini-2.0-flash";

// Default TTL for cached content: 24 hours in seconds
export const CACHE_TTL_SECONDS = 86400;

export function isGoogleAIConfigured(): boolean {
  return Boolean(process.env.GOOGLE_AI_API_KEY);
}

// Lazy singleton — only instantiated when API key is present
// Avoids build-time crash when GOOGLE_AI_API_KEY is not set in Vercel env
let _ai: GoogleGenAI | null = null;

export function getGoogleAI(): GoogleGenAI {
  if (!_ai) {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_AI_API_KEY is not configured");
    }
    _ai = new GoogleGenAI({ apiKey, apiVersion: "v1" });
  }
  return _ai;
}

// Legacy export for any code that imports `ai` directly — lazy proxy
export const ai = new Proxy({} as GoogleGenAI, {
  get(_target, prop) {
    return Reflect.get(getGoogleAI(), prop);
  },
});
