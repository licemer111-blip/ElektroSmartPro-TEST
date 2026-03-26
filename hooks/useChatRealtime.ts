"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { getTeamMessages } from "@/app/dashboard/team/chat-actions";
import { enrichMessageWithAttachment, type TeamMessage } from "@/lib/chat-utils";

interface UseChatRealtimeReturn {
  messages: TeamMessage[];
  loading: boolean;
  fetchMessages: () => Promise<void>;
}

export function useChatRealtime(teamId: string): UseChatRealtimeReturn {
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [loading, setLoading] = useState(true);
  // Prevent stale closure in realtime callback
  const fetchRef = useRef<() => Promise<void>>();

  const fetchMessages = useCallback(async () => {
    const result = await getTeamMessages(teamId);
    if (!result.error) {
      const enriched = (result.messages as TeamMessage[]).map(
        enrichMessageWithAttachment
      );
      setMessages(enriched);
    }
    setLoading(false);
  }, [teamId]);

  // Keep ref in sync so the realtime callback always calls the latest version
  useEffect(() => {
    fetchRef.current = fetchMessages;
  }, [fetchMessages]);

  // Initial fetch
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Supabase Realtime subscription
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`team-chat-${teamId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "team_messages",
          filter: `team_id=eq.${teamId}`,
        },
        () => {
          fetchRef.current?.();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId]);

  return { messages, loading, fetchMessages };
}
