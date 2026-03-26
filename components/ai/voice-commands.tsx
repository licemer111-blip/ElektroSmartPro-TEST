"use client";

import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

/* eslint-disable @typescript-eslint/no-explicit-any */
interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult: ((event: { results: { [index: number]: { [index: number]: { transcript: string }; isFinal: boolean }; length: number }; resultIndex: number }) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}

interface VoiceCommand {
  command: string;
  action: () => void;
  description: string;
}

interface VoiceCommandsProps {
  commands: VoiceCommand[];
  onCommandRecognized?: (command: string) => void;
}

export function VoiceCommands({ commands, onCommandRecognized }: VoiceCommandsProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState("");
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check if speech recognition is supported
    if (typeof window !== "undefined") {
      const w = window as unknown as Record<string, unknown>;
      const SpeechRecognitionCtor = (w.SpeechRecognition || w.webkitSpeechRecognition) as (new () => SpeechRecognitionInstance) | undefined;
      
      if (SpeechRecognitionCtor) {
        setIsSupported(true);
        const recognition = new SpeechRecognitionCtor();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "pl-PL"; // Polish language

        recognition.onresult = (event: { resultIndex: number; results: { [index: number]: { [index: number]: { transcript: string }; isFinal: boolean } } }) => {
          const current = event.resultIndex;
          const transcript = event.results[current][0].transcript.toLowerCase();
          setTranscript(transcript);

          if (event.results[current].isFinal) {
            processCommand(transcript);
          }
        };

        recognition.onerror = (event: { error: string }) => {
          console.error("Speech recognition error:", event.error);
          setIsListening(false);
          
          if (event.error === "no-speech") {
            toast({
              title: "Nie wykryto mowy",
              description: "Spróbuj ponownie",
              variant: "destructive",
            });
          } else if (event.error === "not-allowed") {
            toast({
              title: "Brak dostępu do mikrofonu",
              description: "Zezwól na dostęp do mikrofonu w ustawieniach przeglądarki",
              variant: "destructive",
            });
          } else if (event.error === "network") {
            toast({
              title: "Błąd sieci",
              description: "Sprawdź połączenie z internetem",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Błąd rozpoznawania mowy",
              description: `Kod błędu: ${event.error}`,
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
    onCommandRecognized?.(transcript);

    // Normalize transcript
    const normalizedTranscript = transcript.toLowerCase().trim();

    // Find matching command
    for (const cmd of commands) {
      const normalizedCommand = cmd.command.toLowerCase().trim();
      
      // Check for exact match or contains
      if (normalizedTranscript === normalizedCommand || 
          normalizedTranscript.includes(normalizedCommand) ||
          normalizedCommand.includes(normalizedTranscript)) {
        cmd.action();
        toast({
          title: "Komenda rozpoznana",
          description: cmd.description,
        });
        return;
      }
    }

    // Try fuzzy matching for common commands
    const fuzzyMatches = {
      "dodaj pozycję": "add",
      "nowy projekt": "new",
      "zapisz": "save",
      "usuń": "delete",
      "edytuj": "edit",
      "exportuj pdf": "export",
    };

    for (const [key, action] of Object.entries(fuzzyMatches)) {
      if (transcript.includes(key)) {
        // Find command by checking if the command text includes the key
        const cmd = commands.find(c => c.command.toLowerCase().includes(key.toLowerCase()));
        if (cmd) {
          cmd.action();
          toast({
            title: "Komenda rozpoznana",
            description: cmd.description,
          });
          return;
        }
      }
    }

    toast({
      title: "Nie rozpoznano komendy",
      description: `Powiedziano: "${transcript}"`,
      variant: "destructive",
    });
  };

  const toggleListening = async () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        // Request microphone permission
        await navigator.mediaDevices.getUserMedia({ audio: true });
        
        setTranscript("");
        recognitionRef.current.start();
        setIsListening(true);
        
        toast({
          title: "Nasłuchiwanie...",
          description: "Mów teraz",
        });
      } catch (error) {
        console.error("Microphone access error:", error);
        toast({
          title: "Brak dostępu do mikrofonu",
          description: "Zezwól na dostęp do mikrofonu w ustawieniach przeglądarki",
          variant: "destructive",
        });
      }
    }
  };

  if (!isSupported) {
    return (
      <Badge variant="outline" className="text-xs">
        Komendy głosowe nie są wspierane
      </Badge>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={isListening ? "destructive" : "outline"}
        size="sm"
        onClick={toggleListening}
        className="relative"
      >
        {isListening ? (
          <>
            <MicOff className="h-4 w-4" />
            <span className="ml-2">Stop</span>
            <span className="absolute top-0 right-0 -mt-1 -mr-1">
              <span className="flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
            </span>
          </>
        ) : (
          <>
            <Mic className="h-4 w-4" />
            <span className="ml-2">Komendy głosowe</span>
          </>
        )}
      </Button>

      {transcript && (
        <div className="text-sm text-muted-foreground max-w-xs truncate">
          "{transcript}"
        </div>
      )}
    </div>
  );
}

// Predefined commands for estimate table
export const useEstimateVoiceCommands = (onAddItem?: () => void, onSave?: () => void) => {
  const commands: VoiceCommand[] = [
    {
      command: "dodaj pozycję",
      action: onAddItem || (() => {}),
      description: "Dodaje nową pozycję do kosztorysu",
    },
    {
      command: "nowa pozycja",
      action: onAddItem || (() => {}),
      description: "Dodaje nową pozycję do kosztorysu",
    },
    {
      command: "dodaj",
      action: onAddItem || (() => {}),
      description: "Dodaje nową pozycję",
    },
    {
      command: "zapisz projekt",
      action: onSave || (() => {}),
      description: "Zapisuje bieżący projekt",
    },
    {
      command: "zapisz",
      action: onSave || (() => {}),
      description: "Zapisuje bieżący projekt",
    },
  ];

  return commands;
};
