'use server'

import { logger } from "@/lib/logger";
import { queryKnowledgeBase } from "@/server/services/knowledge-base.service";

export async function testKnowledgeBase(question: string) {
  try {
    const response = await queryKnowledgeBase(question);
    
    // В консоли ты увидишь, сработал ли кэш или был fallback
    return { success: true, answer: response };
  } catch (error) {
    logger.error("Ошибка KB:", {}, error);
    return { success: false, error: "Не удалось получить ответ" };
  }
}
