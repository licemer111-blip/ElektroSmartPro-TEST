"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

// Web Speech API - use generic interface since TS types vary across environments
/* eslint-disable @typescript-eslint/no-explicit-any */
interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: { results: { [index: number]: { [index: number]: { transcript: string } }; length: number }; resultIndex: number }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

interface VoiceCommand {
  command: string;
  action: () => void;
  description: string;
}

interface QuickVoiceControlProps {
  onAddItem?: () => void;
  onSaveProject?: () => void;
}

export function QuickVoiceControl({ onAddItem, onSaveProject }: QuickVoiceControlProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const { toast } = useToast();

  const commands: VoiceCommand[] = [
    {
      command: "dodaj",
      action: onAddItem || (() => {}),
      description: "Dodaje nową pozycję",
    },
    {
      command: "zapisz",
      action: onSaveProject || (() => {}),
      description: "Zapisuje projekt",
    },
  ];

  useEffect(() => {
    // Check if speech recognition is supported
    if (typeof window !== "undefined") {
      const w = window as unknown as Record<string, unknown>;
      const SpeechRecognitionCtor = (w.SpeechRecognition || w.webkitSpeechRecognition) as (new () => SpeechRecognitionInstance) | undefined;
      
      if (SpeechRecognitionCtor) {
        setIsSupported(true);
        const recognition = new SpeechRecognitionCtor();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "pl-PL";

        recognition.onresult = (event: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => {
          const transcript = event.results[0][0].transcript.toLowerCase();
          processCommand(transcript);
        };

        recognition.onerror = (event: { error: string }) => {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
          
          if (event.error === "not-allowed") {
            toast({
              title: "Brak dostępu do mikrofonu",
              description: "Zezwól na dostęp w ustawieniach przeglądarki",
              variant: "destructive",
            });
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, [toast]);

  const processCommand = (transcript: string) => {
    const normalizedTranscript = transcript.toLowerCase().trim();

    for (const cmd of commands) {
      const normalizedCommand = cmd.command.toLowerCase().trim();
      
      if (normalizedTranscript.includes(normalizedCommand)) {
        cmd.action();
        toast({
          title: "✅ Komenda rozpoznana",
          description: cmd.description,
        });
        return;
      }
    }
  };

  const toggleListening = async () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        recognitionRef.current.start();
        setIsListening(true);
        
        toast({
          title: "🎤 Nasłuchiwanie...",
          description: "Powiedz: 'dodaj' lub 'zapisz'",
        });
      } catch (error) {
        toast({
          title: "Brak dostępu do mikrofonu",
          description: "Zezwól na dostęp do mikrofonu",
          variant: "destructive",
        });
      }
    }
  };

  if (!isSupported) return null;

  return (
    <Button
      variant={isListening ? "destructive" : "outline"}
      size="sm"
      onClick={toggleListening}
      className="relative h-8 px-2"
    >
      {isListening ? (
        <>
          <MicOff className="h-3 w-3" />
          <span className="ml-1 text-xs">Stop</span>
          <span className="absolute top-0 right-0 -mt-0.5 -mr-0.5">
            <span className="flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          </span>
        </>
      ) : (
        <>
          <Mic className="h-3 w-3" />
          <span className="ml-1 text-xs">Głos</span>
        </>
      )}
    </Button>
  );
}
