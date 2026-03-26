"use client";

import { useCallback } from "react";
import { broadcastDataChange } from "./use-project-data-sync";

/**
 * Wrapper для server actions с автоматической синхронизацией
 * После успешного выполнения action отправляет broadcast всем участникам
 */
export function useSyncedAction<TArgs extends unknown[], TResult>(
  action: (...args: TArgs) => Promise<TResult>,
  changeType: string = "data-changed"
): (...args: TArgs) => Promise<TResult> {
  return useCallback(
    async (...args: TArgs) => {
      const result = await action(...args);
      
      // Если action вернул success - broadcast'им изменение
      const res = typeof result === 'object' && result !== null ? (result as Record<string, unknown>) : null;
      if (res?.success || (!res?.error && result !== null)) {
        broadcastDataChange(changeType);
      }
      
      return result;
    },
    [action, changeType]
  ) as (...args: TArgs) => Promise<TResult>;
}

/**
 * Простая функция для ручного broadcast после изменения
 */
export function notifyDataChanged(changeType: string = "data-changed") {
  broadcastDataChange(changeType);
}
