import { logger } from "@/lib/logger";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { checkAndIncrementAiUsage } from "@/lib/ai-usage";
import { AI_FUNCTION_NAMES } from "@/lib/ai-quota-config";
import { generateExpertResponse } from "@/server/services/hybrid-ai.service";

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: "Musisz być zalogowany" }, { status: 401 });
    }

    // AI usage limit: DEMO=5/mies., PRO=200/mies. (centralized quota)
    const aiCheck = await checkAndIncrementAiUsage(user.id, AI_FUNCTION_NAMES.chatbot);
    if (!aiCheck.allowed) {
      return NextResponse.json({ error: aiCheck.error || "Limit AI wyczerpany" }, { status: 403 });
    }

    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Brak wiadomości" }, { status: 400 });
    }

    // Split: last message is the current user query, rest is history
    const allMessages = messages as Array<{ role: string; content: string }>;
    const lastMessage = allMessages[allMessages.length - 1];

    if (!lastMessage || lastMessage.role !== "user") {
      return NextResponse.json({ error: "Ostatnia wiadomość musi być od użytkownika" }, { status: 400 });
    }

    const history = allMessages.slice(0, -1).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // Check subscription tier for Hard Demo price-blur rule
    let isPro = false;
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_pro")
        .eq("id", user.id)
        .single();
      isPro = profile?.is_pro ?? false;
    } catch {
      // default to free tier on error (safe)
    }

    // RAG: Supabase KB retrieval → ES-Intelligence v2.1 generation (with graceful fallback)
    const result = await generateExpertResponse(lastMessage.content, history, user.id, { isPro });

    return NextResponse.json({
      reply: result.reply,
      meta: { usedKnowledgeBase: result.usedKnowledgeBase, model: result.modelUsed },
    });
  } catch (error) {
    logger.error("[AI Helper] Error:", {}, error);
    const msg = error instanceof Error ? error.message : "Wystąpił błąd podczas generowania odpowiedzi";
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}
