"use client";

import { useState, useRef, useCallback } from "react";
import { Camera, Upload, Scan, Loader2, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface ScanResult {
  type: "outlet" | "switch" | "breaker" | "cable" | "unknown";
  description: string;
  confidence: number;
  catalogMatches?: Array<{
    id: string;
    name: string;
    price: number;
    similarity: number;
  }>;
}

interface CameraScannerProps {
  onScanComplete?: (result: ScanResult) => void;
  onAddToProject?: (item: { name: string; price: number; quantity: number; unit: string; type?: string }) => void;
  isPro?: boolean;
}

export function CameraScanner({ onScanComplete, onAddToProject, isPro = true }: CameraScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsScanning(true);
      }
    } catch (error) {
      console.error("Camera access denied:", error);
      toast({
        title: "Brak dostępu do kamery",
        description: "Zezwól na dostęp do kamery aby skanować urządzenia",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0);
        
        const imageData = canvas.toDataURL("image/jpeg");
        setPreview(imageData);
        stopCamera();
        processImage(imageData);
      }
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageData = e.target?.result as string;
        setPreview(imageData);
        processImage(imageData);
      };
      reader.readAsDataURL(file);
    }
  };

  const processImage = async (imageData: string) => {
    setIsProcessing(true);
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Mock scan results based on random selection
    const mockResults: Omit<ScanResult, "catalogMatches">[] = [
      {
        type: "outlet",
        description: "Gniazdko elektryczne Schuko 16A",
        confidence: 0.94,
      },
      {
        type: "switch",
        description: "Włącznik jednobiegowy 10A",
        confidence: 0.87,
      },
      {
        type: "breaker",
        description: "Wyłącznik nadprądowy 1P 16A C",
        confidence: 0.91,
      },
      {
        type: "cable",
        description: "Przewód YKY 3x2.5mm²",
        confidence: 0.78,
      },
    ];
    
    const result = mockResults[Math.floor(Math.random() * mockResults.length)];
    
    // Add mock catalog matches
    const resultWithMatches: ScanResult = {
      ...result,
      catalogMatches: [
        {
          id: "1",
          name: result.description + " - Standard",
          price: 12.50,
          similarity: result.confidence,
        },
        {
          id: "2", 
          name: result.description + " - Premium",
          price: 18.90,
          similarity: result.confidence - 0.1,
        },
        {
          id: "3",
          name: result.description + " - Eco",
          price: 8.30,
          similarity: result.confidence - 0.2,
        },
      ],
    };
    
    setScanResult(resultWithMatches);
    setIsProcessing(false);
    onScanComplete?.(resultWithMatches);
    
    toast({
      title: "Skanowanie zakończone",
      description: `Rozpoznano: ${result.description}`,
    });
  };

  const reset = () => {
    setPreview(null);
    setScanResult(null);
    setIsProcessing(false);
    stopCamera();
  };

  const handleAddToProject = (match: NonNullable<ScanResult["catalogMatches"]>[0]) => {
    onAddToProject?.({
      name: match.name,
      price: match.price,
      quantity: 1,
      unit: "szt.",
      type: scanResult?.type,
    });
    
    toast({
      title: "Dodano do projektu",
      description: match.name,
    });
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Scan className="h-5 w-5" />
          Skaner AI
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!preview && !isScanning && (
          <div className="space-y-3">
            <Button onClick={startCamera} className="w-full">
              <Camera className="h-4 w-4 mr-2" />
              Otwórz kamerę
            </Button>
            
            <div className="relative">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
              >
                <Upload className="h-4 w-4 mr-2" />
                Wybierz z galerii
              </Button>
            </div>
          </div>
        )}

        {isScanning && (
          <div className="space-y-3">
            <div className="relative">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg"
              />
              <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500"></div>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button onClick={capturePhoto} className="flex-1">
                <Camera className="h-4 w-4 mr-2" />
                Zrób zdjęcie
              </Button>
              <Button variant="outline" onClick={stopCamera}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {preview && isProcessing && (
          <div className="space-y-3">
            <img src={preview} alt="Preview" className="w-full rounded-lg" />
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">ES-Engine analizuje zdjęcie...</span>
              </div>
              <Progress value={66} className="w-full" />
            </div>
          </div>
        )}

        {preview && scanResult && (
          <div className="space-y-3">
            <img src={preview} alt="Scanned" className="w-full rounded-lg" />
            
            <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="font-medium text-sm">Rozpoznano:</span>
              </div>
              <p className="text-sm">{scanResult.description}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Pewność: {Math.round(scanResult.confidence * 100)}%
              </p>
            </div>

            {scanResult.catalogMatches && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Pasujące produkty:</h4>
                {scanResult.catalogMatches.map((match) => (
                  <div
                    key={match.id}
                    className="flex items-center justify-between p-2 border rounded-lg"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{match.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {isPro ? `${match.price.toFixed(2)} PLN` : '*** PLN'} • Podobieństwo: {Math.round(match.similarity * 100)}%
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAddToProject(match)}
                      className="ml-2"
                    >
                      Dodaj
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <Button variant="outline" onClick={reset} className="w-full">
              <Scan className="h-4 w-4 mr-2" />
              Skanuj ponownie
            </Button>
          </div>
        )}

        <canvas ref={canvasRef} className="hidden" />
      </CardContent>
    </Card>
  );
}
