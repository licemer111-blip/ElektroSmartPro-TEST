"use client";

import { useState, useEffect, useCallback } from "react";
import { LiveKitRoom, useVoiceAssistant, RoomAudioRenderer, BarVisualizer } from "@livekit/components-react";
import "@livekit/components-styles";
import { Mic, MicOff, Phone, PhoneOff, Volume2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

/**
 * V4.0: Co-pilot Mode - LiveKit Audio Session
 * Minimal floating audio call panel for project collaboration
 */

interface CoPilotSessionProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

function AudioCallPanel({ onDisconnect }: { onDisconnect: () => void }) {
  const [isMuted, setIsMuted] = useState(false);
  const { state } = useVoiceAssistant();

  const toggleMute = useCallback(() => {
    // This will be handled by LiveKit's built-in audio track controls
    setIsMuted((prev) => !prev);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 20 }}
      transition={{ duration: 0.2 }}
      className="fixed bottom-6 right-6 z-50"
    >
      <Card className="w-80 p-4 bg-white dark:bg-slate-900 shadow-2xl border-2 border-blue-500">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium">Co-pilot Active</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={onDisconnect}
              className="h-8 gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <PhoneOff className="w-4 h-4" />
              <span className="text-xs">Disconnect</span>
            </Button>
          </div>

          {/* Audio Visualizer */}
          <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded-lg p-4 flex items-center justify-center">
            <BarVisualizer
              state={state}
              barCount={5}
              trackRef={undefined}
              className="w-full h-full"
            />
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            <Button
              size="lg"
              variant={isMuted ? "destructive" : "outline"}
              onClick={toggleMute}
              className="w-14 h-14 rounded-full"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? (
                <MicOff className="w-6 h-6" />
              ) : (
                <Mic className="w-6 h-6" />
              )}
            </Button>

            <Button
              size="lg"
              variant="outline"
              className="w-14 h-14 rounded-full"
              title="Volume"
            >
              <Volume2 className="w-6 h-6" />
            </Button>
          </div>

          {/* Instructions */}
          <p className="text-xs text-center text-slate-500 dark:text-slate-400">
            Audio call in progress. Your colleagues can hear you.
          </p>
        </div>
      </Card>

      {/* Hidden audio renderer for LiveKit */}
      <RoomAudioRenderer />
    </motion.div>
  );
}

export function CoPilotSession({ projectId, isOpen, onClose }: CoPilotSessionProps) {
  const [token, setToken] = useState<string>("");
  const [serverUrl, setServerUrl] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const { toast } = useToast();

  // Fetch LiveKit token when session opens
  useEffect(() => {
    if (isOpen && !token) {
      fetchToken();
    }
  }, [isOpen]);

  const fetchToken = async () => {
    setIsLoading(true);
    setError("");

    try {
      const requestBody = {
        room: `project-${projectId}`,
        projectId: projectId,
      };

      const response = await fetch("/api/livekit/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to get token");
      }

      const data = await response.json();
      
      setToken(data.token);
      setServerUrl(data.url);

      toast({
        title: "✅ Connected!",
        description: "Co-pilot session started",
      });
    } catch (err: unknown) {
      const errObj = err instanceof Error ? err : null;
      const errorMessage = errObj?.message ?? "Unknown error";
      setError(errorMessage);
      
      toast({
        title: "❌ Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });

      // Auto-close on error
      setTimeout(onClose, 2000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = useCallback(() => {
    setToken("");
    setServerUrl("");
    onClose();
    
    toast({
      title: "📞 Call Ended",
      description: "You disconnected from the Co-pilot session",
    });
  }, [onClose, toast]);

  const handleError = useCallback((error: Error) => {
    toast({
      title: "❌ Connection Error",
      description: error.message,
      variant: "destructive",
    });
  }, [toast]);

  if (!isOpen) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Card className="w-80 p-6 bg-white dark:bg-slate-900 shadow-2xl">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm font-medium">Connecting to Co-pilot...</p>
          </div>
        </Card>
      </motion.div>
    );
  }

  // Error state
  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Card className="w-80 p-6 bg-white dark:bg-slate-900 shadow-2xl border-2 border-red-500">
          <div className="flex flex-col items-center gap-3">
            <PhoneOff className="w-8 h-8 text-red-600" />
            <p className="text-sm font-medium text-red-600">Connection Failed</p>
            <p className="text-xs text-center text-slate-500">{error}</p>
            <Button onClick={onClose} variant="outline" size="sm">
              Close
            </Button>
          </div>
        </Card>
      </motion.div>
    );
  }

  // Connected state with LiveKit
  if (token && serverUrl) {
    return (
      <AnimatePresence>
        <LiveKitRoom
          token={token}
          serverUrl={serverUrl}
          connect={true}
          audio={true}
          video={false}
          onError={handleError}
          onDisconnected={handleDisconnect}
          options={{
            adaptiveStream: true,
            dynacast: true,
          }}
        >
          <AudioCallPanel onDisconnect={handleDisconnect} />
        </LiveKitRoom>
      </AnimatePresence>
    );
  }

  return null;
}
